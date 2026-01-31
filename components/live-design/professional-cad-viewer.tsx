'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { FloorLayout, RoomLayout } from '@/lib/engines/layout-engine'
import { getFurnitureForRoom } from '@/lib/engines/furniture-library'
import jsPDF from 'jspdf'

// Professional monochrome architectural colors (line-drawing style)
const COLORS = {
  background: '#ffffff',
  wall: {
    exterior: '#000000',
    interior: '#1a1a1a',
    fill: '#ffffff',
  },
  room: {
    // All rooms use white/light gray for monochrome style
    bedroom: '#ffffff',
    'master bedroom': '#ffffff',
    'living room': '#ffffff',
    lounge: '#ffffff',
    'drawing room': '#ffffff',
    kitchen: '#ffffff',
    bathroom: '#fafafa',
    toilet: '#fafafa',
    'w.c': '#fafafa',
    dining: '#ffffff',
    office: '#ffffff',
    garage: '#ffffff',
    store: '#fafafa',
    lobby: '#ffffff',
    corridor: '#fafafa',
    staircase: '#f5f5f5',
    veranda: '#ffffff',
    porch: '#ffffff',
    parking: '#ffffff',
    garden: '#ffffff',
    'service yard': '#fafafa',
    pooja: '#ffffff',
    default: '#ffffff',
  },
  door: '#1a1a1a',
  window: '#1a1a1a',
  dimension: '#333333',
  text: '#1a1a1a',
  grid: {
    major: '#e0e0e0',
    minor: '#f0f0f0',
  },
  furniture: '#1a1a1a',
}

export interface ProfessionalCADViewerHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
  exportToPDF: () => void
  exportToPNG: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface ProfessionalCADViewerProps {
  layout: FloorLayout | null
  floorIndex?: number
  showGrid?: boolean
  showDimensions?: boolean
  showRoomLabels?: boolean
  showFurniture?: boolean
  scale?: number
  className?: string
  title?: string
}

export const ProfessionalCADViewer = forwardRef<ProfessionalCADViewerHandle, ProfessionalCADViewerProps>(({
  layout,
  showGrid = true,
  showDimensions = true,
  showRoomLabels = true,
  showFurniture = true,
  scale: initialScale = 8,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(initialScale)
  const [offset, setOffset] = useState({ x: 80, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Export to PNG
  const exportToPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `floor-plan-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Export to PDF
  const exportToPDF = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout) return

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({
      orientation: layout.boundingBox.width > layout.boundingBox.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Title
    pdf.setFontSize(16)
    pdf.setTextColor(30, 41, 59)
    pdf.text(`${layout.level} Floor Plan`, pageWidth / 2, 15, { align: 'center' })

    // Metadata
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    const area = layout.boundingBox.width * layout.boundingBox.height
    pdf.text(`Plot: ${layout.boundingBox.width}' x ${layout.boundingBox.height}' | Area: ${area.toLocaleString()} sq.ft`, pageWidth / 2, 22, { align: 'center' })

    // Image
    const imgWidth = canvas.width / window.devicePixelRatio
    const imgHeight = canvas.height / window.devicePixelRatio
    const maxWidth = pageWidth - 20
    const maxHeight = pageHeight - 50

    let finalWidth = maxWidth
    let finalHeight = (imgHeight * finalWidth) / imgWidth

    if (finalHeight > maxHeight) {
      finalHeight = maxHeight
      finalWidth = (imgWidth * finalHeight) / imgHeight
    }

    const xOffset = (pageWidth - finalWidth) / 2
    pdf.addImage(imgData, 'PNG', xOffset, 28, finalWidth, finalHeight)

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Generated: ${new Date().toLocaleDateString()} | FloorPlan AI`, pageWidth / 2, pageHeight - 8, { align: 'center' })

    pdf.save(`floor-plan-${layout.level}-${Date.now()}.pdf`)
  }, [layout])

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType = 'image/png', quality = 1) => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL(mimeType, quality)
      }
      return null
    },
    exportToPDF,
    exportToPNG,
    zoomIn: () => setScale(s => Math.min(s * 1.2, 30)),
    zoomOut: () => setScale(s => Math.max(s / 1.2, 3)),
    resetView: () => {
      setScale(initialScale)
      setOffset({ x: 80, y: 80 })
    },
  }))

  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !layout) return

    const { width, height } = canvas
    const dpr = window.devicePixelRatio || 1

    // Clear canvas
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(offset.x * dpr, offset.y * dpr)

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, layout.boundingBox, scale * dpr)
    }

    // Draw rooms with fills
    for (const room of layout.rooms) {
      drawRoomFill(ctx, room, scale * dpr)
    }

    // Draw walls (thick lines)
    drawWalls(ctx, layout, scale * dpr)

    // Draw doors
    for (const room of layout.rooms) {
      for (const door of room.doors) {
        drawDoor(ctx, door, scale * dpr)
      }
    }

    // Draw windows
    for (const room of layout.rooms) {
      for (const window of room.windows) {
        drawWindow(ctx, window, scale * dpr)
      }
    }

    // Draw furniture
    if (showFurniture) {
      for (const room of layout.rooms) {
        drawFurniture(ctx, room, scale * dpr)
      }
    }

    // Draw room labels with dimensions
    if (showRoomLabels) {
      for (const room of layout.rooms) {
        drawRoomLabel(ctx, room, scale * dpr)
      }
    }

    // Draw dimensions
    if (showDimensions) {
      drawDimensions(ctx, layout, scale * dpr)
    }

    // Draw stairs if present
    if (layout.circulation?.stairs) {
      drawStairs(ctx, layout.circulation.stairs, scale * dpr)
    }

    // Draw north arrow
    drawNorthArrow(ctx, layout.boundingBox, scale * dpr)

    // Draw scale bar
    drawScaleBar(ctx, layout.boundingBox, scale * dpr)

    ctx.restore()
  }, [layout, scale, offset, showGrid, showDimensions, showRoomLabels, showFurniture])

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        draw()
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [draw])

  useEffect(() => {
    draw()
  }, [draw])

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.min(Math.max(s * delta, 3), 30))
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-125 bg-white overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 30))}
          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-700"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(s / 1.2, 3))}
          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-700"
        >
          -
        </button>
        <button
          onClick={() => {
            setScale(initialScale)
            setOffset({ x: 80, y: 80 })
          }}
          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700"
        >
          FIT
        </button>
      </div>

      {/* Info */}
      <div className="absolute bottom-4 left-4 bg-white/95 px-3 py-2 rounded-lg text-xs border-2 border-gray-200 shadow-lg">
        <div className="font-semibold text-gray-800">Scale: 1" = {Math.round(12 / scale)}'</div>
        <div className="text-gray-500">{scale.toFixed(1)} px/ft</div>
      </div>

      {/* No layout */}
      {!layout && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium">Enter a prompt to generate floor plan</p>
            <p className="text-sm mt-2">Professional CAD output will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
})

ProfessionalCADViewer.displayName = 'ProfessionalCADViewer'

// Drawing helper functions
function drawGrid(ctx: CanvasRenderingContext2D, bbox: { width: number; height: number }, scale: number) {
  const majorGrid = 10 // 10 feet
  const minorGrid = 1 // 1 foot

  // Minor grid
  ctx.strokeStyle = COLORS.grid.minor
  ctx.lineWidth = 0.5
  for (let x = 0; x <= bbox.width; x += minorGrid) {
    ctx.beginPath()
    ctx.moveTo(x * scale, 0)
    ctx.lineTo(x * scale, bbox.height * scale)
    ctx.stroke()
  }
  for (let y = 0; y <= bbox.height; y += minorGrid) {
    ctx.beginPath()
    ctx.moveTo(0, y * scale)
    ctx.lineTo(bbox.width * scale, y * scale)
    ctx.stroke()
  }

  // Major grid
  ctx.strokeStyle = COLORS.grid.major
  ctx.lineWidth = 1
  for (let x = 0; x <= bbox.width; x += majorGrid) {
    ctx.beginPath()
    ctx.moveTo(x * scale, 0)
    ctx.lineTo(x * scale, bbox.height * scale)
    ctx.stroke()
  }
  for (let y = 0; y <= bbox.height; y += majorGrid) {
    ctx.beginPath()
    ctx.moveTo(0, y * scale)
    ctx.lineTo(bbox.width * scale, y * scale)
    ctx.stroke()
  }
}

function drawRoomFill(ctx: CanvasRenderingContext2D, room: RoomLayout, scale: number) {
  const roomType = room.type.toLowerCase()
  const color = COLORS.room[roomType as keyof typeof COLORS.room] || COLORS.room.default

  ctx.fillStyle = color
  ctx.fillRect(room.x * scale, room.y * scale, room.width * scale, room.height * scale)
}

function drawWalls(ctx: CanvasRenderingContext2D, layout: FloorLayout, scale: number) {
  const exteriorThickness = 6
  const interiorThickness = 3

  const bbox = layout.boundingBox

  // Draw exterior walls - double line architectural style
  ctx.strokeStyle = COLORS.wall.exterior
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'

  // Outer line
  ctx.lineWidth = exteriorThickness
  ctx.strokeRect(-exteriorThickness / 2, -exteriorThickness / 2, bbox.width * scale + exteriorThickness, bbox.height * scale + exteriorThickness)

  // Inner line (creates double-wall effect)
  ctx.lineWidth = 1
  ctx.strokeRect(exteriorThickness / 2, exteriorThickness / 2, bbox.width * scale - exteriorThickness, bbox.height * scale - exteriorThickness)

  // Fill between walls (white)
  ctx.fillStyle = COLORS.wall.fill
  ctx.fillRect(0, 0, bbox.width * scale, exteriorThickness / 2)
  ctx.fillRect(0, bbox.height * scale - exteriorThickness / 2, bbox.width * scale, exteriorThickness / 2)
  ctx.fillRect(0, 0, exteriorThickness / 2, bbox.height * scale)
  ctx.fillRect(bbox.width * scale - exteriorThickness / 2, 0, exteriorThickness / 2, bbox.height * scale)

  // Draw interior walls with double-line style
  ctx.strokeStyle = COLORS.wall.interior
  for (const room of layout.rooms) {
    const rx = room.x * scale
    const ry = room.y * scale
    const rw = room.width * scale
    const rh = room.height * scale

    // Thick wall line
    ctx.lineWidth = interiorThickness
    ctx.strokeRect(rx, ry, rw, rh)

    // Inner detail line
    ctx.lineWidth = 0.5
    ctx.strokeRect(rx + interiorThickness / 2, ry + interiorThickness / 2, rw - interiorThickness, rh - interiorThickness)
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, door: { x: number; y: number; width: number; height: number; rotation: number; type: string }, scale: number) {
  const dx = door.x * scale
  const dy = door.y * scale
  const dw = door.width * scale
  const wallThickness = 4

  ctx.save()
  ctx.translate(dx, dy)
  ctx.rotate((door.rotation * Math.PI) / 180)

  // Clear wall where door is (opening)
  ctx.fillStyle = COLORS.background
  ctx.fillRect(-1, -wallThickness - 1, dw + 2, wallThickness * 2 + 2)

  // Door frame jambs - simple black lines
  ctx.strokeStyle = COLORS.door
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -wallThickness)
  ctx.lineTo(0, wallThickness)
  ctx.moveTo(dw, -wallThickness)
  ctx.lineTo(dw, wallThickness)
  ctx.stroke()

  // Door swing arc - thin line (architectural standard)
  ctx.strokeStyle = COLORS.door
  ctx.lineWidth = 0.75
  ctx.beginPath()
  ctx.arc(0, 0, dw, -Math.PI / 2, 0)
  ctx.stroke()

  // Door leaf - shows door at 90 degrees open
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -dw) // Door opens perpendicular to wall
  ctx.stroke()

  ctx.restore()
}

function drawWindow(ctx: CanvasRenderingContext2D, window: { x: number; y: number; width: number; height: number; rotation: number }, scale: number) {
  const wx = window.x * scale
  const wy = window.y * scale
  const ww = window.width * scale
  const wallThickness = 4

  ctx.save()
  ctx.translate(wx, wy)
  ctx.rotate((window.rotation * Math.PI) / 180)

  // Clear wall opening
  ctx.fillStyle = COLORS.background
  ctx.fillRect(-1, -wallThickness - 1, ww + 2, wallThickness * 2 + 2)

  // Window frame - architectural double line style
  ctx.strokeStyle = COLORS.window
  ctx.lineWidth = 1.5

  // Outer frame
  ctx.strokeRect(0, -wallThickness + 1, ww, wallThickness * 2 - 2)

  // Inner frame
  ctx.lineWidth = 0.75
  ctx.strokeRect(2, -wallThickness + 3, ww - 4, wallThickness * 2 - 6)

  // Glass panes - crossed lines (architectural symbol for glass)
  ctx.lineWidth = 0.5
  ctx.beginPath()
  // Diagonal lines to indicate glass
  ctx.moveTo(3, -wallThickness + 4)
  ctx.lineTo(ww - 3, wallThickness - 4)
  ctx.moveTo(ww - 3, -wallThickness + 4)
  ctx.lineTo(3, wallThickness - 4)
  ctx.stroke()

  ctx.restore()
}

function drawFurniture(ctx: CanvasRenderingContext2D, room: RoomLayout, scale: number) {
  const furniture = getFurnitureForRoom(room.type)
  if (furniture.length === 0) return

  const roomCenterX = room.x + room.width / 2
  const roomCenterY = room.y + room.height / 2

  // Position furniture intelligently
  furniture.forEach((item) => {
    const fw = Math.min(item.defaultWidth, room.width * 0.8)
    const fh = Math.min(item.defaultHeight, room.height * 0.8)

    let fx: number, fy: number

    // Position based on furniture type
    if (item.category === 'bedroom' && item.id.includes('Bed')) {
      // Bed at back of room
      fx = roomCenterX - fw / 2
      fy = room.y + room.height - fh - 1
    } else if (item.id === 'wardrobe') {
      // Wardrobe on side
      fx = room.x + 0.5
      fy = room.y + 0.5
    } else if (item.category === 'bathroom') {
      // Bathroom fixtures along walls
      if (item.id === 'toilet') {
        fx = room.x + room.width - fw - 0.5
        fy = room.y + 0.5
      } else if (item.id === 'washBasin') {
        fx = room.x + 0.5
        fy = room.y + 0.5
      } else {
        fx = room.x + 0.5
        fy = room.y + room.height - fh - 0.5
      }
    } else if (item.category === 'kitchen') {
      // Kitchen counter along wall
      fx = room.x + 0.5
      fy = room.y + room.height - fh - 0.5
    } else {
      // Center other furniture
      fx = roomCenterX - fw / 2
      fy = roomCenterY - fh / 2
    }

    item.draw(ctx, fx, fy, fw, fh, scale)
  })
}

function drawRoomLabel(ctx: CanvasRenderingContext2D, room: RoomLayout, scale: number) {
  const cx = (room.x + room.width / 2) * scale
  const cy = (room.y + room.height / 2) * scale

  // Room name - clean architectural text
  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${Math.max(10, scale * 1)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(room.name.toUpperCase(), cx, cy - scale * 0.6)

  // Dimensions - smaller text below
  const dimText = `${room.width.toFixed(0)}' x ${room.height.toFixed(0)}'`
  ctx.font = `${Math.max(8, scale * 0.8)}px Arial`
  ctx.fillStyle = '#4a4a4a'
  ctx.fillText(dimText, cx, cy + scale * 0.4)
}

function drawDimensions(ctx: CanvasRenderingContext2D, layout: FloorLayout, scale: number) {
  const { width, height } = layout.boundingBox
  const offset = 25

  ctx.strokeStyle = COLORS.dimension
  ctx.fillStyle = COLORS.dimension
  ctx.lineWidth = 1
  ctx.font = 'bold 11px Arial'

  // Bottom dimension
  const bottomY = height * scale + offset
  ctx.beginPath()
  ctx.moveTo(0, bottomY)
  ctx.lineTo(width * scale, bottomY)
  ctx.stroke()

  // Arrows
  drawArrow(ctx, 0, bottomY, 'left')
  drawArrow(ctx, width * scale, bottomY, 'right')

  ctx.textAlign = 'center'
  ctx.fillText(`${width.toFixed(0)}' - 0"`, (width * scale) / 2, bottomY + 15)

  // Right dimension
  const rightX = width * scale + offset
  ctx.beginPath()
  ctx.moveTo(rightX, 0)
  ctx.lineTo(rightX, height * scale)
  ctx.stroke()

  drawArrow(ctx, rightX, 0, 'up')
  drawArrow(ctx, rightX, height * scale, 'down')

  ctx.save()
  ctx.translate(rightX + 15, (height * scale) / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.fillText(`${height.toFixed(0)}' - 0"`, 0, 0)
  ctx.restore()
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 'left' | 'right' | 'up' | 'down') {
  const size = 6
  ctx.beginPath()
  switch (dir) {
    case 'left':
      ctx.moveTo(x + size, y - size / 2)
      ctx.lineTo(x, y)
      ctx.lineTo(x + size, y + size / 2)
      break
    case 'right':
      ctx.moveTo(x - size, y - size / 2)
      ctx.lineTo(x, y)
      ctx.lineTo(x - size, y + size / 2)
      break
    case 'up':
      ctx.moveTo(x - size / 2, y + size)
      ctx.lineTo(x, y)
      ctx.lineTo(x + size / 2, y + size)
      break
    case 'down':
      ctx.moveTo(x - size / 2, y - size)
      ctx.lineTo(x, y)
      ctx.lineTo(x + size / 2, y - size)
      break
  }
  ctx.stroke()
}

function drawStairs(ctx: CanvasRenderingContext2D, stairs: { x: number; y: number; width: number; height: number }, scale: number) {
  const sx = stairs.x * scale
  const sy = stairs.y * scale
  const sw = stairs.width * scale
  const sh = stairs.height * scale

  // White background
  ctx.fillStyle = COLORS.background
  ctx.fillRect(sx, sy, sw, sh)

  // Outer border - thick black line
  ctx.strokeStyle = COLORS.furniture
  ctx.lineWidth = 2
  ctx.strokeRect(sx, sy, sw, sh)

  // Steps - simple lines (architectural style)
  const steps = 12
  const stepH = sh / steps

  ctx.lineWidth = 0.75
  for (let i = 1; i < steps; i++) {
    const stepY = sy + i * stepH
    ctx.beginPath()
    ctx.moveTo(sx + 2, stepY)
    ctx.lineTo(sx + sw - 2, stepY)
    ctx.stroke()
  }

  // Handrails - simple lines on sides
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx + 3, sy)
  ctx.lineTo(sx + 3, sy + sh)
  ctx.moveTo(sx + sw - 3, sy)
  ctx.lineTo(sx + sw - 3, sy + sh)
  ctx.stroke()

  // Direction arrow - simple line with arrowhead
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx + sw / 2, sy + sh - 10)
  ctx.lineTo(sx + sw / 2, sy + 20)
  ctx.stroke()

  // Arrow head
  ctx.beginPath()
  ctx.moveTo(sx + sw / 2, sy + 12)
  ctx.lineTo(sx + sw / 2 - 5, sy + 22)
  ctx.lineTo(sx + sw / 2 + 5, sy + 22)
  ctx.closePath()
  ctx.fill()

  // "UP" label
  ctx.fillStyle = COLORS.background
  ctx.fillRect(sx + sw / 2 - 10, sy + sh / 2 - 6, 20, 12)
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('UP', sx + sw / 2, sy + sh / 2)
}

function drawNorthArrow(ctx: CanvasRenderingContext2D, bbox: { width: number; height: number }, scale: number) {
  const x = bbox.width * scale + 50
  const y = 30

  ctx.save()
  ctx.translate(x, y)

  // Circle
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, 15, 0, Math.PI * 2)
  ctx.stroke()

  // Arrow
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.moveTo(0, -12)
  ctx.lineTo(-5, 5)
  ctx.lineTo(0, 2)
  ctx.lineTo(5, 5)
  ctx.closePath()
  ctx.fill()

  // N label
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('N', 0, -18)

  ctx.restore()
}

function drawScaleBar(ctx: CanvasRenderingContext2D, bbox: { width: number; height: number }, scale: number) {
  const x = 10
  const y = bbox.height * scale + 50
  const barLength = 10 * scale // 10 feet

  ctx.strokeStyle = '#1f2937'
  ctx.fillStyle = '#1f2937'
  ctx.lineWidth = 2

  // Bar
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + barLength, y)
  ctx.stroke()

  // End marks
  ctx.beginPath()
  ctx.moveTo(x, y - 5)
  ctx.lineTo(x, y + 5)
  ctx.moveTo(x + barLength, y - 5)
  ctx.lineTo(x + barLength, y + 5)
  ctx.stroke()

  // Divisions
  for (let i = 1; i < 10; i++) {
    const dx = x + (i * barLength) / 10
    ctx.beginPath()
    ctx.moveTo(dx, y - 3)
    ctx.lineTo(dx, y + 3)
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Label
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText("10' - 0\"", x + barLength / 2, y + 15)
  ctx.fillText('SCALE', x + barLength / 2, y - 10)
}

export default ProfessionalCADViewer
