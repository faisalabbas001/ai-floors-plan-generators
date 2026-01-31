'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { FloorLayout, RoomLayout, WallLayout } from '@/lib/engines/layout-engine'

// Colors for different elements
const COLORS = {
  wall: {
    exterior: '#1a1a2e',
    interior: '#374151',
    partition: '#6b7280',
  },
  room: {
    bedroom: '#bfdbfe',
    'master bedroom': '#93c5fd',
    'living room': '#fde68a',
    lounge: '#fde68a',
    kitchen: '#fed7aa',
    bathroom: '#a5f3fc',
    toilet: '#a5f3fc',
    dining: '#d9f99d',
    office: '#e9d5ff',
    garage: '#d1d5db',
    store: '#e5e7eb',
    lobby: '#fce7f3',
    corridor: '#f3f4f6',
    staircase: '#fecaca',
    default: '#f9fafb',
  },
  door: '#8b4513',
  window: '#60a5fa',
  grid: '#e5e7eb',
  text: '#1f2937',
  dimension: '#ef4444',
}

export interface DXFViewerHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface DXFViewerProps {
  layout: FloorLayout | null
  floorIndex?: number
  showGrid?: boolean
  showDimensions?: boolean
  showRoomLabels?: boolean
  scale?: number
  className?: string
}

export const DXFViewer = forwardRef<DXFViewerHandle, DXFViewerProps>(({
  layout,
  floorIndex = 0,
  showGrid = true,
  showDimensions = true,
  showRoomLabels = true,
  scale: initialScale = 10,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(initialScale) // pixels per foot
  const [offset, setOffset] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType = 'image/png', quality = 1) => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL(mimeType, quality)
      }
      return null
    },
    zoomIn: () => setScale(s => Math.min(s * 1.2, 50)),
    zoomOut: () => setScale(s => Math.max(s / 1.2, 2)),
    resetView: () => {
      setScale(initialScale)
      setOffset({ x: 50, y: 50 })
    },
  }))

  // Draw the floor plan
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !layout) return

    const { width, height } = canvas

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Save context for transformations
    ctx.save()

    // Apply offset for panning
    ctx.translate(offset.x, offset.y)

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, layout.boundingBox, scale)
    }

    // Draw rooms (filled rectangles)
    for (const room of layout.rooms) {
      drawRoom(ctx, room, scale)
    }

    // Draw walls
    for (const wall of layout.walls) {
      drawWall(ctx, wall, scale)
    }

    // Draw doors
    for (const room of layout.rooms) {
      for (const door of room.doors) {
        drawDoor(ctx, door, scale)
      }
    }

    // Draw windows
    for (const room of layout.rooms) {
      for (const window of room.windows) {
        drawWindow(ctx, window, scale)
      }
    }

    // Draw room labels
    if (showRoomLabels) {
      for (const room of layout.rooms) {
        drawRoomLabel(ctx, room, scale)
      }
    }

    // Draw dimensions
    if (showDimensions) {
      drawDimensions(ctx, layout, scale)
    }

    // Draw corridors
    if (layout.circulation?.corridors) {
      for (const corridor of layout.circulation.corridors) {
        ctx.fillStyle = COLORS.room.corridor
        ctx.fillRect(
          corridor.x * scale,
          corridor.y * scale,
          corridor.width * scale,
          corridor.height * scale
        )
      }
    }

    // Draw stairs
    if (layout.circulation?.stairs) {
      drawStairs(ctx, layout.circulation.stairs, scale)
    }

    // Draw title
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 16px Arial'
    ctx.fillText(`${layout.level} Floor Plan`, 10, -20)

    // Restore context
    ctx.restore()
  }, [layout, scale, offset, showGrid, showDimensions, showRoomLabels])

  // Resize canvas to fit container
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = width * window.devicePixelRatio
        canvas.height = height * window.devicePixelRatio
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        draw()
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [draw])

  // Redraw when layout or settings change
  useEffect(() => {
    draw()
  }, [draw])

  // Mouse handlers for panning
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

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel handler for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.min(Math.max(s * delta, 2), 50))
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] bg-white overflow-hidden ${className}`}
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

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 50))}
          className="w-8 h-8 bg-white border rounded shadow hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(s / 1.2, 2))}
          className="w-8 h-8 bg-white border rounded shadow hover:bg-gray-50 flex items-center justify-center text-lg font-bold"
        >
          -
        </button>
        <button
          onClick={() => {
            setScale(initialScale)
            setOffset({ x: 50, y: 50 })
          }}
          className="w-8 h-8 bg-white border rounded shadow hover:bg-gray-50 flex items-center justify-center text-xs"
        >
          FIT
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 rounded text-xs border">
        Scale: 1:{Math.round(100 / scale)} | {scale.toFixed(1)}px/ft
      </div>

      {/* No layout message */}
      {!layout && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Enter a prompt to generate a design</p>
            <p className="text-sm mt-1">The floor plan will appear here in real-time</p>
          </div>
        </div>
      )}
    </div>
  )
})

DXFViewer.displayName = 'DXFViewer'

// Helper drawing functions
function drawGrid(ctx: CanvasRenderingContext2D, boundingBox: { width: number; height: number }, scale: number) {
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 0.5

  const gridSize = 5 // 5 foot grid

  for (let x = 0; x <= boundingBox.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x * scale, 0)
    ctx.lineTo(x * scale, boundingBox.height * scale)
    ctx.stroke()
  }

  for (let y = 0; y <= boundingBox.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y * scale)
    ctx.lineTo(boundingBox.width * scale, y * scale)
    ctx.stroke()
  }
}

function drawRoom(ctx: CanvasRenderingContext2D, room: RoomLayout, scale: number) {
  const roomType = room.type.toLowerCase()
  const color = COLORS.room[roomType as keyof typeof COLORS.room] || COLORS.room.default

  ctx.fillStyle = color
  ctx.fillRect(
    room.x * scale,
    room.y * scale,
    room.width * scale,
    room.height * scale
  )

  // Room outline
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 1
  ctx.strokeRect(
    room.x * scale,
    room.y * scale,
    room.width * scale,
    room.height * scale
  )
}

function drawWall(ctx: CanvasRenderingContext2D, wall: WallLayout, scale: number) {
  const color = COLORS.wall[wall.type as keyof typeof COLORS.wall] || COLORS.wall.interior

  ctx.strokeStyle = color
  ctx.lineWidth = wall.thickness * scale
  ctx.lineCap = 'square'

  ctx.beginPath()
  ctx.moveTo(wall.x1 * scale, wall.y1 * scale)
  ctx.lineTo(wall.x2 * scale, wall.y2 * scale)
  ctx.stroke()
}

function drawDoor(ctx: CanvasRenderingContext2D, door: { x: number; y: number; width: number; height: number; rotation: number; type: string }, scale: number) {
  ctx.save()
  ctx.translate(door.x * scale, door.y * scale)
  ctx.rotate(door.rotation * Math.PI / 180)

  // Door opening (white gap)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, -door.height * scale / 2, door.width * scale, door.height * scale)

  // Door arc
  ctx.strokeStyle = COLORS.door
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, door.width * scale, -Math.PI / 2, 0)
  ctx.stroke()

  // Door line
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(door.width * scale, 0)
  ctx.stroke()

  ctx.restore()
}

function drawWindow(ctx: CanvasRenderingContext2D, window: { x: number; y: number; width: number; height: number; rotation: number }, scale: number) {
  ctx.save()
  ctx.translate(window.x * scale, window.y * scale)
  ctx.rotate(window.rotation * Math.PI / 180)

  // Window frame
  ctx.fillStyle = COLORS.window
  ctx.fillRect(0, 0, window.width * scale, window.height * scale)

  // Window panes
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(window.width * scale / 2, 0)
  ctx.lineTo(window.width * scale / 2, window.height * scale)
  ctx.stroke()

  ctx.restore()
}

function drawRoomLabel(ctx: CanvasRenderingContext2D, room: RoomLayout, scale: number) {
  const centerX = (room.x + room.width / 2) * scale
  const centerY = (room.y + room.height / 2) * scale

  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(room.name, centerX, centerY - 8)

  // Area text
  ctx.font = '10px Arial'
  ctx.fillStyle = '#6b7280'
  const area = Math.round(room.width * room.height)
  ctx.fillText(`${area} sqft`, centerX, centerY + 8)
}

function drawDimensions(ctx: CanvasRenderingContext2D, layout: FloorLayout, scale: number) {
  ctx.strokeStyle = COLORS.dimension
  ctx.fillStyle = COLORS.dimension
  ctx.lineWidth = 1
  ctx.font = '10px Arial'

  const { width, height } = layout.boundingBox

  // Bottom dimension (width)
  const bottomY = height * scale + 20
  ctx.beginPath()
  ctx.moveTo(0, bottomY)
  ctx.lineTo(width * scale, bottomY)
  ctx.stroke()

  // Dimension arrows
  ctx.beginPath()
  ctx.moveTo(0, bottomY - 5)
  ctx.lineTo(0, bottomY + 5)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(width * scale, bottomY - 5)
  ctx.lineTo(width * scale, bottomY + 5)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillText(`${width.toFixed(1)}'`, width * scale / 2, bottomY + 15)

  // Right dimension (height)
  const rightX = width * scale + 20
  ctx.beginPath()
  ctx.moveTo(rightX, 0)
  ctx.lineTo(rightX, height * scale)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(rightX - 5, 0)
  ctx.lineTo(rightX + 5, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(rightX - 5, height * scale)
  ctx.lineTo(rightX + 5, height * scale)
  ctx.stroke()

  ctx.save()
  ctx.translate(rightX + 15, height * scale / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.fillText(`${height.toFixed(1)}'`, 0, 0)
  ctx.restore()
}

function drawStairs(ctx: CanvasRenderingContext2D, stairs: { x: number; y: number; width: number; height: number }, scale: number) {
  ctx.fillStyle = COLORS.room.staircase
  ctx.fillRect(
    stairs.x * scale,
    stairs.y * scale,
    stairs.width * scale,
    stairs.height * scale
  )

  // Draw stair lines
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 1
  const steps = 10
  const stepHeight = stairs.height / steps

  for (let i = 1; i < steps; i++) {
    ctx.beginPath()
    ctx.moveTo(stairs.x * scale, (stairs.y + i * stepHeight) * scale)
    ctx.lineTo((stairs.x + stairs.width) * scale, (stairs.y + i * stepHeight) * scale)
    ctx.stroke()
  }

  // Label
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('STAIRS', (stairs.x + stairs.width / 2) * scale, (stairs.y + stairs.height / 2) * scale)
}

export default DXFViewer
