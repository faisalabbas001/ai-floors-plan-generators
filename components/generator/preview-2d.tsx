'use client'

import { useRef, useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Text, Group, Line, Arc, Shape } from 'react-konva'
import Konva from 'konva'
import type { GeneratedPlan } from '@/lib/api'

// Export handle type for parent components
export interface Preview2DHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
}

// Constants - Professional CAD style
const OUTER_WALL = 8
const INNER_WALL = 3
const BG_COLOR = '#FFFFFF'
const FLOOR_COLOR = '#FFFFFF'
const WALL_COLOR = '#000000'

// Room colors - very subtle or white for professional CAD look
const ROOM_COLORS: Record<string, string> = {
  bedroom: '#FFFFFF',
  'master bedroom': '#FFFFFF',
  bathroom: '#F8F8F8',
  kitchen: '#FFFFFF',
  'living room': '#FFFFFF',
  living: '#FFFFFF',
  'dining room': '#FFFFFF',
  dining: '#FFFFFF',
  office: '#FFFFFF',
  garage: '#F5F5F5',
  hallway: '#FFFFFF',
  corridor: '#FFFFFF',
  closet: '#FFFFFF',
  laundry: '#F8F8F8',
  porch: '#F0F0F0',
  veranda: '#F0F0F0',
  default: '#FFFFFF',
}

const getRoomColor = (roomType: string): string => {
  const type = roomType.toLowerCase()
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (type.includes(key)) return color
  }
  return ROOM_COLORS.default
}

// Format feet-inches like AutoCAD
const formatDimension = (feet: number): string => {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)
  if (inches === 0 || inches === 12) {
    return `${inches === 12 ? wholeFeet + 1 : wholeFeet}'-0"`
  }
  return `${wholeFeet}'-${inches}"`
}

// ========== CAD-STYLE FURNITURE SYMBOLS ==========

// Double bed symbol - CAD standard
const drawBedCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isDouble: boolean) => {
  const bedW = Math.min(w * 0.6, isDouble ? 70 : 45)
  const bedH = Math.min(h * 0.5, 85)
  const bx = x + (w - bedW) / 2
  const by = y + (h - bedH) / 2

  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  // Bed outline
  ctx.beginPath()
  ctx.rect(bx, by, bedW, bedH)
  ctx.fill()
  ctx.stroke()

  // Headboard - thick line
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + bedW, by)
  ctx.stroke()
  ctx.lineWidth = 1.5

  // Pillows
  if (isDouble) {
    const pw = bedW / 2 - 8
    ctx.beginPath()
    ctx.rect(bx + 4, by + 6, pw, 16)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.rect(bx + bedW / 2 + 4, by + 6, pw, 16)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.rect(bx + 6, by + 6, bedW - 12, 16)
    ctx.fill()
    ctx.stroke()
  }

  // Blanket fold line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(bx + 4, by + bedH * 0.55)
  ctx.lineTo(bx + bedW - 4, by + bedH * 0.55)
  ctx.stroke()
}

// Wardrobe/Closet symbol
const drawWardrobeCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const ww = Math.min(w * 0.35, 45)
  const wh = Math.min(h * 0.25, 30)
  const wx = x + 8
  const wy = y + 8

  ctx.beginPath()
  ctx.rect(wx, wy, ww, wh)
  ctx.fill()
  ctx.stroke()

  // Center line (door division)
  ctx.beginPath()
  ctx.moveTo(wx + ww / 2, wy)
  ctx.lineTo(wx + ww / 2, wy + wh)
  ctx.stroke()

  // Diagonal hatch lines
  ctx.lineWidth = 0.5
  for (let i = 0; i <= ww; i += 6) {
    ctx.beginPath()
    ctx.moveTo(wx + i, wy)
    ctx.lineTo(wx + Math.max(0, i - wh * 0.8), wy + Math.min(wh, i * 1.2))
    ctx.stroke()
  }
}

// Toilet symbol - CAD standard
const drawToiletCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const tx = x + w * 0.7
  const ty = y + h * 0.35

  // Tank
  ctx.beginPath()
  ctx.rect(tx - 12, ty - 8, 24, 14)
  ctx.fill()
  ctx.stroke()

  // Bowl - ellipse
  ctx.beginPath()
  ctx.ellipse(tx, ty + 22, 14, 20, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Inner bowl
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(tx, ty + 24, 9, 14, 0, 0, Math.PI * 2)
  ctx.stroke()
}

// Sink symbol - CAD standard
const drawSinkCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const sx = x + 12
  const sy = y + 12

  // Vanity counter
  ctx.beginPath()
  ctx.rect(sx, sy, 42, 28)
  ctx.fill()
  ctx.stroke()

  // Basin oval
  ctx.beginPath()
  ctx.ellipse(sx + 21, sy + 14, 14, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Faucet symbol
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(sx + 21, sy + 5, 3, 0, Math.PI * 2)
  ctx.stroke()
}

// Bathtub symbol - CAD standard
const drawBathtubCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const bw = Math.min(w * 0.75, 75)
  const bh = 30
  const bx = x + (w - bw) / 2
  const by = y + h * 0.55

  // Outer tub
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 6)
  ctx.fill()
  ctx.stroke()

  // Inner tub
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(bx + 4, by + 4, bw - 8, bh - 8, 4)
  ctx.stroke()

  // Drain
  ctx.beginPath()
  ctx.arc(bx + bw - 18, by + bh / 2, 4, 0, Math.PI * 2)
  ctx.stroke()

  // Faucet end
  ctx.beginPath()
  ctx.arc(bx + 15, by + bh / 2, 4, 0, Math.PI * 2)
  ctx.stroke()
}

// Shower symbol
const drawShowerCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const size = Math.min(w * 0.4, h * 0.35, 40)
  const sx = x + w - size - 10
  const sy = y + 10

  // Shower base
  ctx.beginPath()
  ctx.rect(sx, sy, size, size)
  ctx.fill()
  ctx.stroke()

  // Diagonal tile lines
  ctx.lineWidth = 0.5
  for (let i = 0; i <= size; i += 8) {
    ctx.beginPath()
    ctx.moveTo(sx + i, sy)
    ctx.lineTo(sx, sy + i)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(sx + size, sy + i)
    ctx.lineTo(sx + size - i, sy + size)
    ctx.stroke()
  }

  // Shower head symbol
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(sx + size / 2, sy + 12, 6, 0, Math.PI * 2)
  ctx.stroke()
}

// Kitchen counter with appliances - CAD style
const drawKitchenCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const counterDepth = 24

  // L-shaped counter - bottom
  ctx.beginPath()
  ctx.rect(x + 6, y + h - counterDepth - 6, w - 12, counterDepth)
  ctx.fill()
  ctx.stroke()

  // L-shaped counter - left side
  ctx.beginPath()
  ctx.rect(x + 6, y + 6, counterDepth, h * 0.5)
  ctx.fill()
  ctx.stroke()

  // Stove/Range - 4 burners
  const stoveX = x + w * 0.5
  const stoveY = y + h - counterDepth / 2 - 3
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    const burnerX = stoveX + (i % 2) * 16 - 8
    const burnerY = stoveY + Math.floor(i / 2) * 12 - 6
    ctx.beginPath()
    ctx.arc(burnerX, burnerY, 6, 0, Math.PI * 2)
    ctx.stroke()
    // Inner ring
    ctx.beginPath()
    ctx.arc(burnerX, burnerY, 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Sink in counter - double bowl
  ctx.lineWidth = 1.5
  const sinkX = x + counterDepth + 20
  const sinkY = y + h - counterDepth + 3
  ctx.beginPath()
  ctx.rect(sinkX, sinkY, 35, 18)
  ctx.fill()
  ctx.stroke()
  // Divider
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sinkX + 17.5, sinkY)
  ctx.lineTo(sinkX + 17.5, sinkY + 18)
  ctx.stroke()

  // Refrigerator
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(x + w - 40, y + 10, 32, 50)
  ctx.fill()
  ctx.stroke()
  // Fridge door line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + w - 40, y + 32)
  ctx.lineTo(x + w - 8, y + 32)
  ctx.stroke()
}

// Dining table with chairs - CAD style
const drawDiningCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const tw = Math.min(w * 0.5, 70)
  const th = Math.min(h * 0.35, 45)
  const tx = x + (w - tw) / 2
  const ty = y + (h - th) / 2

  // Table
  ctx.beginPath()
  ctx.rect(tx, ty, tw, th)
  ctx.fill()
  ctx.stroke()

  // Chairs - rectangles with rounded edges
  const chairW = 14
  const chairD = 12
  const positions = [
    { cx: tx + tw * 0.3, cy: ty - chairD - 4, rot: 0 },
    { cx: tx + tw * 0.7, cy: ty - chairD - 4, rot: 0 },
    { cx: tx + tw * 0.3, cy: ty + th + 4, rot: 0 },
    { cx: tx + tw * 0.7, cy: ty + th + 4, rot: 0 },
    { cx: tx - chairD - 4, cy: ty + th / 2, rot: Math.PI / 2 },
    { cx: tx + tw + 4, cy: ty + th / 2, rot: Math.PI / 2 },
  ]

  ctx.lineWidth = 1
  positions.forEach(pos => {
    ctx.beginPath()
    ctx.roundRect(pos.cx - chairW / 2, pos.cy - chairD / 2, chairW, chairD, 2)
    ctx.fill()
    ctx.stroke()
  })
}

// Living room sofa with coffee table - CAD style
const drawLivingCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const sofaW = Math.min(w * 0.6, 90)
  const sofaH = 30
  const sx = x + (w - sofaW) / 2
  const sy = y + h * 0.5

  // L-shaped sofa - main section
  ctx.beginPath()
  ctx.rect(sx, sy, sofaW, sofaH)
  ctx.fill()
  ctx.stroke()

  // Sofa back cushion line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx + 4, sy + 8)
  ctx.lineTo(sx + sofaW - 4, sy + 8)
  ctx.stroke()

  // Armrests
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(sx - 6, sy + 3, 6, sofaH - 6)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(sx + sofaW, sy + 3, 6, sofaH - 6)
  ctx.fill()
  ctx.stroke()

  // Coffee table
  const ctW = sofaW * 0.45
  const ctH = 22
  ctx.beginPath()
  ctx.rect(sx + (sofaW - ctW) / 2, sy - ctH - 15, ctW, ctH)
  ctx.fill()
  ctx.stroke()

  // TV unit
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(sx + sofaW * 0.15, sy + sofaH + 30, sofaW * 0.7, 10)
  ctx.fill()
  ctx.stroke()
}

// Office/Study desk - CAD style
const drawOfficeCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const dw = Math.min(w * 0.55, 60)
  const dh = 25
  const dx = x + (w - dw) / 2
  const dy = y + h * 0.3

  // Desk
  ctx.beginPath()
  ctx.rect(dx, dy, dw, dh)
  ctx.fill()
  ctx.stroke()

  // Monitor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(dx + dw / 2 - 14, dy + 4, 28, 16)
  ctx.stroke()

  // Chair - circular
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(dx + dw / 2, dy + dh + 22, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Chair back arc
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(dx + dw / 2, dy + dh + 22, 11, Math.PI * 0.7, Math.PI * 0.3, true)
  ctx.stroke()

  // Bookshelf
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(dx - 25, dy, 20, 45)
  ctx.fill()
  ctx.stroke()
  // Shelf lines
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(dx - 25, dy + 15)
  ctx.lineTo(dx - 5, dy + 15)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(dx - 25, dy + 30)
  ctx.lineTo(dx - 5, dy + 30)
  ctx.stroke()
}

// Porch/Veranda with tile hatching
const drawPorchCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 0.5

  // Tile hatching pattern
  const tileSize = 15
  for (let i = 0; i <= w; i += tileSize) {
    ctx.beginPath()
    ctx.moveTo(x + i, y)
    ctx.lineTo(x + i, y + h)
    ctx.stroke()
  }
  for (let j = 0; j <= h; j += tileSize) {
    ctx.beginPath()
    ctx.moveTo(x, y + j)
    ctx.lineTo(x + w, y + j)
    ctx.stroke()
  }

  // Steps
  ctx.lineWidth = 1.5
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.rect(x + 15, y + h - 35 + i * 10, w - 30, 8)
    ctx.stroke()
  }
}

// Staircase symbol
const drawStairsCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1

  const stairW = Math.min(w * 0.4, 40)
  const stairH = Math.min(h * 0.6, 60)
  const sx = x + (w - stairW) / 2
  const sy = y + (h - stairH) / 2

  // Stair outline
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(sx, sy, stairW, stairH)
  ctx.stroke()

  // Steps
  ctx.lineWidth = 1
  const numSteps = 8
  const stepH = stairH / numSteps
  for (let i = 1; i < numSteps; i++) {
    ctx.beginPath()
    ctx.moveTo(sx, sy + i * stepH)
    ctx.lineTo(sx + stairW, sy + i * stepH)
    ctx.stroke()
  }

  // Arrow showing direction
  ctx.beginPath()
  ctx.moveTo(sx + stairW / 2, sy + stairH - 10)
  ctx.lineTo(sx + stairW / 2, sy + 10)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sx + stairW / 2 - 6, sy + 18)
  ctx.lineTo(sx + stairW / 2, sy + 10)
  ctx.lineTo(sx + stairW / 2 + 6, sy + 18)
  ctx.stroke()
}

interface LayoutedRoom {
  name: string
  type?: string
  areaSqft: number
  dimensions?: { length: number; width: number }
  position?: { x: number; y: number }
  doors?: Array<{
    id?: string
    wall: 'north' | 'south' | 'east' | 'west'
    position: number
    width: number
    height?: number
    type?: string
    connectsTo?: string
    swingDirection?: string
  }>
  windows?: Array<{
    id?: string
    wall: 'north' | 'south' | 'east' | 'west'
    position: number
    width: number
    height?: number
    sillHeight?: number
    type?: string
  }>
  x: number
  y: number
  width: number
  height: number
  color: string
  scale?: number // Scale factor for converting feet to pixels
}

interface Preview2DProps {
  plan: GeneratedPlan
  floorIndex?: number
  style?: string
}

export const Preview2D = forwardRef<Preview2DHandle, Preview2DProps>(({ plan, floorIndex = 0 }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [selectedFloor, setSelectedFloor] = useState(floorIndex)
  const [zoom, setZoom] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  // Expose toDataURL method to parent via ref
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType = 'image/png', quality = 1) => {
      if (stageRef.current) {
        return stageRef.current.toDataURL({ mimeType, quality, pixelRatio: 2 })
      }
      return null
    }
  }))

  const floor = plan.floors[selectedFloor] || plan.floors[0]
  const padding = 100

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const scaleBy = 1.1
    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const clampedScale = Math.max(0.3, Math.min(3, newScale))

    setZoom(clampedScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }, [zoom, stagePos])

  // Layout rooms
  const layoutRooms = useMemo((): LayoutedRoom[] => {
    const rooms = floor.rooms
    if (rooms.length === 0) return []

    const availableWidth = dimensions.width - padding * 2
    const availableHeight = dimensions.height - padding * 2 - 60

    const hasPositionData = rooms.some(r => r.position && typeof r.position.x === 'number')

    if (hasPositionData) {
      const buildingWidth = plan.buildingDimensions?.width ||
        Math.max(...rooms.map(r => (r.position?.x || 0) + (r.dimensions?.width || 10)))
      const buildingDepth = plan.buildingDimensions?.depth ||
        Math.max(...rooms.map(r => (r.position?.y || 0) + (r.dimensions?.length || 10)))

      const scaleX = availableWidth / buildingWidth
      const scaleY = availableHeight / buildingDepth
      const scale = Math.min(scaleX, scaleY) * 0.8

      const scaledWidth = buildingWidth * scale
      const scaledHeight = buildingDepth * scale
      const offsetX = padding + (availableWidth - scaledWidth) / 2
      const offsetY = padding + 30 + (availableHeight - scaledHeight) / 2

      return rooms.map(room => ({
        ...room,
        x: offsetX + (room.position?.x || 0) * scale,
        y: offsetY + (room.position?.y || 0) * scale,
        width: (room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale,
        height: (room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale,
        color: getRoomColor(room.type || room.name),
        scale, // Store scale for door/window positioning
        doors: room.doors || [],
        windows: room.windows || [],
      }))
    }

    // Fallback grid layout
    const totalArea = rooms.reduce((sum, r) => sum + r.areaSqft, 0)
    const scaleFactor = Math.sqrt((availableWidth * availableHeight * 0.55) / totalArea)
    const cols = Math.ceil(Math.sqrt(rooms.length))

    const roomsWithSize = rooms.map(room => {
      const area = room.areaSqft * scaleFactor * scaleFactor
      let rw: number, rh: number
      if (room.dimensions) {
        rw = room.dimensions.width * scaleFactor
        rh = room.dimensions.length * scaleFactor
      } else {
        const ratio = 1.2
        rw = Math.sqrt(area * ratio)
        rh = area / rw
      }
      return { ...room, width: Math.max(rw, 70), height: Math.max(rh, 60) }
    })

    const rows: Array<{ rooms: typeof roomsWithSize; height: number }> = []
    let currentRow: typeof roomsWithSize = []
    let totalW = 0, totalH = 0

    roomsWithSize.forEach(room => {
      if (currentRow.length >= cols) {
        const rowH = Math.max(...currentRow.map(r => r.height))
        rows.push({ rooms: currentRow, height: rowH })
        totalW = Math.max(totalW, currentRow.reduce((sum, r) => sum + r.width, 0))
        totalH += rowH
        currentRow = []
      }
      currentRow.push(room)
    })
    if (currentRow.length > 0) {
      const rowH = Math.max(...currentRow.map(r => r.height))
      rows.push({ rooms: currentRow, height: rowH })
      totalW = Math.max(totalW, currentRow.reduce((sum, r) => sum + r.width, 0))
      totalH += rowH
    }

    const offsetX = padding + (availableWidth - totalW) / 2
    const offsetY = padding + 30 + (availableHeight - totalH) / 2

    const layouted: LayoutedRoom[] = []
    let currentY = offsetY

    rows.forEach(({ rooms: rowRooms, height: rowH }) => {
      const rowW = rowRooms.reduce((sum, r) => sum + r.width, 0)
      let currentX = offsetX + (totalW - rowW) / 2

      rowRooms.forEach(room => {
        layouted.push({
          ...room,
          x: currentX,
          y: currentY,
          height: rowH,
          color: getRoomColor(room.type || room.name),
          scale: scaleFactor,
          doors: room.doors || [],
          windows: room.windows || [],
        })
        currentX += room.width
      })
      currentY += rowH
    })

    return layouted
  }, [floor.rooms, dimensions, padding, plan.buildingDimensions])

  // Building bounds
  const buildingBounds = useMemo(() => {
    if (layoutRooms.length === 0) return null
    return {
      minX: Math.min(...layoutRooms.map(r => r.x)),
      minY: Math.min(...layoutRooms.map(r => r.y)),
      maxX: Math.max(...layoutRooms.map(r => r.x + r.width)),
      maxY: Math.max(...layoutRooms.map(r => r.y + r.height)),
    }
  }, [layoutRooms])

  // Shared walls detection
  const getSharedWalls = useMemo(() => {
    const shared: Map<number, Set<string>> = new Map()
    layoutRooms.forEach((room1, i) => {
      layoutRooms.forEach((room2, j) => {
        if (i >= j) return
        const tolerance = 3

        if (Math.abs((room1.x + room1.width) - room2.x) < tolerance &&
            room1.y < room2.y + room2.height && room1.y + room1.height > room2.y) {
          if (!shared.has(i)) shared.set(i, new Set())
          if (!shared.has(j)) shared.set(j, new Set())
          shared.get(i)!.add('east')
          shared.get(j)!.add('west')
        }

        if (Math.abs((room2.x + room2.width) - room1.x) < tolerance &&
            room1.y < room2.y + room2.height && room1.y + room1.height > room2.y) {
          if (!shared.has(i)) shared.set(i, new Set())
          if (!shared.has(j)) shared.set(j, new Set())
          shared.get(i)!.add('west')
          shared.get(j)!.add('east')
        }

        if (Math.abs((room1.y + room1.height) - room2.y) < tolerance &&
            room1.x < room2.x + room2.width && room1.x + room1.width > room2.x) {
          if (!shared.has(i)) shared.set(i, new Set())
          if (!shared.has(j)) shared.set(j, new Set())
          shared.get(i)!.add('south')
          shared.get(j)!.add('north')
        }

        if (Math.abs((room2.y + room2.height) - room1.y) < tolerance &&
            room1.x < room2.x + room2.width && room1.x + room1.width > room2.x) {
          if (!shared.has(i)) shared.set(i, new Set())
          if (!shared.has(j)) shared.set(j, new Set())
          shared.get(i)!.add('north')
          shared.get(j)!.add('south')
        }
      })
    })
    return shared
  }, [layoutRooms])

  const buildingWidthFt = plan.buildingDimensions?.width ||
    (buildingBounds ? Math.round((buildingBounds.maxX - buildingBounds.minX) / 10) : 40)
  const buildingDepthFt = plan.buildingDimensions?.depth ||
    (buildingBounds ? Math.round((buildingBounds.maxY - buildingBounds.minY) / 10) : 30)

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white">
      {/* Floor selector */}
      {plan.floors.length > 1 && (
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {plan.floors.map((f, index) => (
            <button
              key={index}
              onClick={() => setSelectedFloor(index)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedFloor === index
                  ? 'bg-black text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {f.level}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded p-1">
        <button
          onClick={() => setZoom(z => Math.min(3, z * 1.2))}
          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-gray-200 rounded"
        >
          +
        </button>
        <div className="text-[10px] text-center text-gray-600">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
          className="w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-gray-200 rounded"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
          className="w-7 h-7 flex items-center justify-center text-[10px] hover:bg-gray-200 rounded"
          title="Reset"
        >
          ⟲
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
      >
        {/* Background */}
        <Layer>
          <Rect x={-2000} y={-2000} width={6000} height={6000} fill={BG_COLOR} />
        </Layer>

        {/* Building and rooms */}
        <Layer>
          {buildingBounds && (
            <>
              {/* Building outline - thick black */}
              <Rect
                x={buildingBounds.minX}
                y={buildingBounds.minY}
                width={buildingBounds.maxX - buildingBounds.minX}
                height={buildingBounds.maxY - buildingBounds.minY}
                fill={FLOOR_COLOR}
                stroke={WALL_COLOR}
                strokeWidth={OUTER_WALL}
              />

              {/* Top dimension line */}
              <Line
                points={[buildingBounds.minX, buildingBounds.minY - 40, buildingBounds.maxX, buildingBounds.minY - 40]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[buildingBounds.minX, buildingBounds.minY - 48, buildingBounds.minX, buildingBounds.minY - 32]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[buildingBounds.maxX, buildingBounds.minY - 48, buildingBounds.maxX, buildingBounds.minY - 32]}
                stroke="#000"
                strokeWidth={1}
              />
              <Text
                x={buildingBounds.minX}
                y={buildingBounds.minY - 62}
                width={buildingBounds.maxX - buildingBounds.minX}
                text={formatDimension(buildingWidthFt)}
                fontSize={12}
                fontFamily="Arial"
                fill="#000"
                align="center"
              />

              {/* Left dimension line */}
              <Line
                points={[buildingBounds.minX - 40, buildingBounds.minY, buildingBounds.minX - 40, buildingBounds.maxY]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[buildingBounds.minX - 48, buildingBounds.minY, buildingBounds.minX - 32, buildingBounds.minY]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[buildingBounds.minX - 48, buildingBounds.maxY, buildingBounds.minX - 32, buildingBounds.maxY]}
                stroke="#000"
                strokeWidth={1}
              />
              <Text
                x={buildingBounds.minX - 75}
                y={buildingBounds.minY + (buildingBounds.maxY - buildingBounds.minY) / 2 - 6}
                text={formatDimension(buildingDepthFt)}
                fontSize={12}
                fontFamily="Arial"
                fill="#000"
              />

              {/* Entry indicator */}
              <Line
                points={[
                  (buildingBounds.minX + buildingBounds.maxX) / 2 - 20,
                  buildingBounds.maxY,
                  (buildingBounds.minX + buildingBounds.maxX) / 2 + 20,
                  buildingBounds.maxY
                ]}
                stroke={FLOOR_COLOR}
                strokeWidth={OUTER_WALL + 2}
              />
              <Text
                x={(buildingBounds.minX + buildingBounds.maxX) / 2 - 30}
                y={buildingBounds.maxY + 15}
                text="ENTRY"
                fontSize={10}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#000"
              />
            </>
          )}

          {/* Rooms */}
          {layoutRooms.map((room, index) => {
            const sharedWalls = getSharedWalls.get(index) || new Set()
            const isExteriorNorth = buildingBounds && Math.abs(room.y - buildingBounds.minY) < 5
            const isExteriorSouth = buildingBounds && Math.abs(room.y + room.height - buildingBounds.maxY) < 5
            const isExteriorWest = buildingBounds && Math.abs(room.x - buildingBounds.minX) < 5
            const isExteriorEast = buildingBounds && Math.abs(room.x + room.width - buildingBounds.maxX) < 5
            const roomType = room.name.toLowerCase()

            const roomWidthFt = room.dimensions?.width || Math.round(room.width / 10)
            const roomHeightFt = room.dimensions?.length || Math.round(room.height / 10)

            return (
              <Group key={index}>
                {/* Room fill */}
                <Rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={room.color}
                />

                {/* Interior walls - thin black */}
                {!isExteriorNorth && (
                  <Line
                    points={[room.x, room.y, room.x + room.width, room.y]}
                    stroke={WALL_COLOR}
                    strokeWidth={sharedWalls.has('north') ? INNER_WALL : INNER_WALL}
                  />
                )}
                {!isExteriorSouth && (
                  <Line
                    points={[room.x, room.y + room.height, room.x + room.width, room.y + room.height]}
                    stroke={WALL_COLOR}
                    strokeWidth={sharedWalls.has('south') ? INNER_WALL : INNER_WALL}
                  />
                )}
                {!isExteriorWest && (
                  <Line
                    points={[room.x, room.y, room.x, room.y + room.height]}
                    stroke={WALL_COLOR}
                    strokeWidth={sharedWalls.has('west') ? INNER_WALL : INNER_WALL}
                  />
                )}
                {!isExteriorEast && (
                  <Line
                    points={[room.x + room.width, room.y, room.x + room.width, room.y + room.height]}
                    stroke={WALL_COLOR}
                    strokeWidth={sharedWalls.has('east') ? INNER_WALL : INNER_WALL}
                  />
                )}

                {/* Render actual doors from AI data */}
                {room.doors && room.doors.length > 0 ? (
                  // Use actual door data from AI
                  room.doors.map((door, doorIndex) => {
                    const doorScale = room.scale || 10
                    const doorWidthPx = (door.width || 3) * doorScale
                    const doorPositionPx = (door.position || 0) * doorScale

                    let doorX = room.x
                    let doorY = room.y
                    let arcRotation = 0
                    let arcRadius = doorWidthPx * 0.9
                    let isHorizontal = true

                    // Calculate door position based on wall
                    switch (door.wall) {
                      case 'north':
                        doorX = room.x + doorPositionPx
                        doorY = room.y
                        arcRotation = 180
                        break
                      case 'south':
                        doorX = room.x + doorPositionPx
                        doorY = room.y + room.height
                        arcRotation = -90
                        break
                      case 'east':
                        doorX = room.x + room.width
                        doorY = room.y + doorPositionPx
                        arcRotation = 0
                        isHorizontal = false
                        break
                      case 'west':
                        doorX = room.x
                        doorY = room.y + doorPositionPx
                        arcRotation = 90
                        isHorizontal = false
                        break
                    }

                    return (
                      <Group key={`door-${doorIndex}`}>
                        {/* Door gap in wall */}
                        {isHorizontal ? (
                          <Line
                            points={[doorX, doorY, doorX + doorWidthPx, doorY]}
                            stroke={room.color}
                            strokeWidth={(door.wall === 'north' || door.wall === 'south') &&
                              ((door.wall === 'north' && isExteriorNorth) || (door.wall === 'south' && isExteriorSouth))
                              ? OUTER_WALL + 2 : INNER_WALL + 2}
                          />
                        ) : (
                          <Line
                            points={[doorX, doorY, doorX, doorY + doorWidthPx]}
                            stroke={room.color}
                            strokeWidth={(door.wall === 'east' || door.wall === 'west') &&
                              ((door.wall === 'east' && isExteriorEast) || (door.wall === 'west' && isExteriorWest))
                              ? OUTER_WALL + 2 : INNER_WALL + 2}
                          />
                        )}
                        {/* Door swing arc */}
                        <Arc
                          x={isHorizontal ? doorX : doorX}
                          y={isHorizontal ? doorY : doorY}
                          innerRadius={0}
                          outerRadius={arcRadius}
                          angle={90}
                          rotation={arcRotation}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        {/* Door leaf */}
                        {isHorizontal ? (
                          <Line
                            points={[
                              doorX,
                              doorY,
                              doorX,
                              door.wall === 'south' ? doorY - arcRadius : doorY + arcRadius
                            ]}
                            stroke="#000"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Line
                            points={[
                              doorX,
                              doorY,
                              door.wall === 'east' ? doorX + arcRadius : doorX - arcRadius,
                              doorY
                            ]}
                            stroke="#000"
                            strokeWidth={1.5}
                          />
                        )}
                      </Group>
                    )
                  })
                ) : (
                  // Fallback: Generate doors based on shared walls (existing logic)
                  <>
                    {sharedWalls.has('south') && (
                      <Group>
                        <Line
                          points={[room.x + room.width * 0.4, room.y + room.height, room.x + room.width * 0.65, room.y + room.height]}
                          stroke={room.color}
                          strokeWidth={INNER_WALL + 2}
                        />
                        <Arc
                          x={room.x + room.width * 0.4}
                          y={room.y + room.height}
                          innerRadius={0}
                          outerRadius={room.width * 0.23}
                          angle={90}
                          rotation={-90}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[
                            room.x + room.width * 0.4,
                            room.y + room.height,
                            room.x + room.width * 0.4,
                            room.y + room.height - room.width * 0.23
                          ]}
                          stroke="#000"
                          strokeWidth={1.5}
                        />
                      </Group>
                    )}
                    {sharedWalls.has('east') && !sharedWalls.has('south') && (
                      <Group>
                        <Line
                          points={[room.x + room.width, room.y + room.height * 0.35, room.x + room.width, room.y + room.height * 0.6]}
                          stroke={room.color}
                          strokeWidth={INNER_WALL + 2}
                        />
                        <Arc
                          x={room.x + room.width}
                          y={room.y + room.height * 0.35}
                          innerRadius={0}
                          outerRadius={room.height * 0.23}
                          angle={90}
                          rotation={0}
                          stroke="#000"
                          strokeWidth={1}
                        />
                      </Group>
                    )}
                  </>
                )}

                {/* Render actual windows from AI data */}
                {room.windows && room.windows.length > 0 ? (
                  // Use actual window data from AI
                  room.windows.map((window, windowIndex) => {
                    const windowScale = room.scale || 10
                    const windowWidthPx = (window.width || 3) * windowScale
                    const windowPositionPx = (window.position || 0) * windowScale

                    let winX1 = room.x
                    let winY1 = room.y
                    let winX2 = room.x
                    let winY2 = room.y
                    let isOnExterior = false

                    // Calculate window position based on wall
                    switch (window.wall) {
                      case 'north':
                        winX1 = room.x + windowPositionPx
                        winX2 = winX1 + windowWidthPx
                        winY1 = winY2 = room.y
                        isOnExterior = isExteriorNorth || false
                        break
                      case 'south':
                        winX1 = room.x + windowPositionPx
                        winX2 = winX1 + windowWidthPx
                        winY1 = winY2 = room.y + room.height
                        isOnExterior = isExteriorSouth || false
                        break
                      case 'east':
                        winX1 = winX2 = room.x + room.width
                        winY1 = room.y + windowPositionPx
                        winY2 = winY1 + windowWidthPx
                        isOnExterior = isExteriorEast || false
                        break
                      case 'west':
                        winX1 = winX2 = room.x
                        winY1 = room.y + windowPositionPx
                        winY2 = winY1 + windowWidthPx
                        isOnExterior = isExteriorWest || false
                        break
                    }

                    // Only render windows on exterior walls
                    if (!isOnExterior) return null

                    const isHorizontal = window.wall === 'north' || window.wall === 'south'

                    return (
                      <Group key={`window-${windowIndex}`}>
                        {/* Window gap in wall */}
                        <Line
                          points={[winX1, winY1, winX2, winY2]}
                          stroke={room.color}
                          strokeWidth={OUTER_WALL + 2}
                        />
                        {/* Window frame - double line */}
                        {isHorizontal ? (
                          <>
                            <Line
                              points={[winX1, winY1 - 2, winX2, winY2 - 2]}
                              stroke="#000"
                              strokeWidth={1}
                            />
                            <Line
                              points={[winX1, winY1 + 2, winX2, winY2 + 2]}
                              stroke="#000"
                              strokeWidth={1}
                            />
                            {/* Window glass */}
                            <Line
                              points={[winX1, winY1, winX2, winY2]}
                              stroke="#4A90D9"
                              strokeWidth={2}
                            />
                            {/* Center mullion */}
                            <Line
                              points={[(winX1 + winX2) / 2, winY1 - 2, (winX1 + winX2) / 2, winY1 + 2]}
                              stroke="#000"
                              strokeWidth={0.5}
                            />
                          </>
                        ) : (
                          <>
                            <Line
                              points={[winX1 - 2, winY1, winX2 - 2, winY2]}
                              stroke="#000"
                              strokeWidth={1}
                            />
                            <Line
                              points={[winX1 + 2, winY1, winX2 + 2, winY2]}
                              stroke="#000"
                              strokeWidth={1}
                            />
                            {/* Window glass */}
                            <Line
                              points={[winX1, winY1, winX2, winY2]}
                              stroke="#4A90D9"
                              strokeWidth={2}
                            />
                            {/* Center mullion */}
                            <Line
                              points={[winX1 - 2, (winY1 + winY2) / 2, winX1 + 2, (winY1 + winY2) / 2]}
                              stroke="#000"
                              strokeWidth={0.5}
                            />
                          </>
                        )}
                      </Group>
                    )
                  })
                ) : (
                  // Fallback: Generate windows on exterior walls (existing logic)
                  <>
                    {isExteriorNorth && !roomType.includes('bathroom') && !roomType.includes('toilet') && (
                      <Group>
                        <Line
                          points={[room.x + room.width * 0.25, room.y, room.x + room.width * 0.75, room.y]}
                          stroke={room.color}
                          strokeWidth={OUTER_WALL + 2}
                        />
                        <Line
                          points={[room.x + room.width * 0.25, room.y - 2, room.x + room.width * 0.75, room.y - 2]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width * 0.25, room.y + 2, room.x + room.width * 0.75, room.y + 2]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width * 0.25, room.y, room.x + room.width * 0.75, room.y]}
                          stroke="#4A90D9"
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                    {isExteriorSouth && !roomType.includes('bathroom') && !roomType.includes('toilet') && !roomType.includes('kitchen') && (
                      <Group>
                        <Line
                          points={[room.x + room.width * 0.3, room.y + room.height, room.x + room.width * 0.7, room.y + room.height]}
                          stroke={room.color}
                          strokeWidth={OUTER_WALL + 2}
                        />
                        <Line
                          points={[room.x + room.width * 0.3, room.y + room.height - 2, room.x + room.width * 0.7, room.y + room.height - 2]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width * 0.3, room.y + room.height + 2, room.x + room.width * 0.7, room.y + room.height + 2]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width * 0.3, room.y + room.height, room.x + room.width * 0.7, room.y + room.height]}
                          stroke="#4A90D9"
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                    {isExteriorEast && !roomType.includes('bathroom') && !roomType.includes('toilet') && (
                      <Group>
                        <Line
                          points={[room.x + room.width, room.y + room.height * 0.25, room.x + room.width, room.y + room.height * 0.75]}
                          stroke={room.color}
                          strokeWidth={OUTER_WALL + 2}
                        />
                        <Line
                          points={[room.x + room.width - 2, room.y + room.height * 0.25, room.x + room.width - 2, room.y + room.height * 0.75]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width + 2, room.y + room.height * 0.25, room.x + room.width + 2, room.y + room.height * 0.75]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + room.width, room.y + room.height * 0.25, room.x + room.width, room.y + room.height * 0.75]}
                          stroke="#4A90D9"
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                    {isExteriorWest && !roomType.includes('bathroom') && !roomType.includes('toilet') && (
                      <Group>
                        <Line
                          points={[room.x, room.y + room.height * 0.25, room.x, room.y + room.height * 0.75]}
                          stroke={room.color}
                          strokeWidth={OUTER_WALL + 2}
                        />
                        <Line
                          points={[room.x - 2, room.y + room.height * 0.25, room.x - 2, room.y + room.height * 0.75]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x + 2, room.y + room.height * 0.25, room.x + 2, room.y + room.height * 0.75]}
                          stroke="#000"
                          strokeWidth={1}
                        />
                        <Line
                          points={[room.x, room.y + room.height * 0.25, room.x, room.y + room.height * 0.75]}
                          stroke="#4A90D9"
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                  </>
                )}

                {/* Furniture - CAD style */}
                <Shape
                  sceneFunc={(context, shape) => {
                    const ctx = context._context as CanvasRenderingContext2D

                    if (roomType.includes('master') || roomType.includes('bedroom')) {
                      drawBedCAD(ctx, room.x, room.y, room.width, room.height, roomType.includes('master'))
                      drawWardrobeCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('bathroom') || roomType.includes('en-suite')) {
                      drawToiletCAD(ctx, room.x, room.y, room.width, room.height)
                      drawSinkCAD(ctx, room.x, room.y, room.width, room.height)
                      if (room.width > 80 && room.height > 80) {
                        drawBathtubCAD(ctx, room.x, room.y, room.width, room.height)
                      } else if (room.width > 60 || room.height > 60) {
                        drawShowerCAD(ctx, room.x, room.y, room.width, room.height)
                      }
                    } else if (roomType.includes('toilet')) {
                      drawToiletCAD(ctx, room.x, room.y, room.width, room.height)
                      drawSinkCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('kitchen')) {
                      drawKitchenCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('dining')) {
                      drawDiningCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('living') || roomType.includes('drawing')) {
                      drawLivingCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('office') || roomType.includes('study')) {
                      drawOfficeCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('porch') || roomType.includes('veranda') || roomType.includes('sit out')) {
                      drawPorchCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('stair')) {
                      drawStairsCAD(ctx, room.x, room.y, room.width, room.height)
                    }

                    context.fillStrokeShape(shape)
                  }}
                />

              </Group>
            )
          })}

          {/* Room Labels - Rendered separately on top of all rooms to prevent overlap */}
          {layoutRooms.map((room, index) => {
            const minDim = Math.min(room.width, room.height)
            const labelFontSize = Math.max(7, Math.min(11, minDim / 9))
            const dimFontSize = Math.max(6, Math.min(9, minDim / 11))
            const areaFontSize = Math.max(5, Math.min(8, minDim / 13))

            const labelHeight = labelFontSize + dimFontSize + areaFontSize + 14
            const labelWidth = Math.min(room.width - 16, 95)
            const labelX = room.x + (room.width - labelWidth) / 2
            const labelY = room.y + (room.height - labelHeight) / 2

            const maxChars = Math.floor(labelWidth / (labelFontSize * 0.55))
            const displayName = room.name.length > maxChars
              ? room.name.substring(0, maxChars - 2).toUpperCase() + '..'
              : room.name.toUpperCase()

            const roomWidthFt = room.dimensions?.width || Math.round(room.width / 10)
            const roomHeightFt = room.dimensions?.length || Math.round(room.height / 10)

            // Skip labels for very small rooms
            if (room.width < 50 || room.height < 50) return null

            return (
              <Group key={`label-${index}`}>
                {/* Label background */}
                <Rect
                  x={labelX}
                  y={labelY}
                  width={labelWidth}
                  height={labelHeight}
                  fill="rgba(255, 255, 255, 0.95)"
                  stroke="rgba(180, 180, 180, 0.6)"
                  strokeWidth={0.5}
                  cornerRadius={3}
                />
                {/* Room name */}
                <Text
                  x={labelX}
                  y={labelY + 5}
                  width={labelWidth}
                  text={displayName}
                  fontSize={labelFontSize}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#000"
                  align="center"
                  wrap="none"
                  ellipsis={true}
                />
                {/* Room dimensions */}
                <Text
                  x={labelX}
                  y={labelY + labelFontSize + 8}
                  width={labelWidth}
                  text={`${formatDimension(roomWidthFt)} x ${formatDimension(roomHeightFt)}`}
                  fontSize={dimFontSize}
                  fontFamily="Arial"
                  fill="#333"
                  align="center"
                  wrap="none"
                />
                {/* Room area */}
                <Text
                  x={labelX}
                  y={labelY + labelFontSize + dimFontSize + 11}
                  width={labelWidth}
                  text={`${room.areaSqft} SF`}
                  fontSize={areaFontSize}
                  fontFamily="Arial"
                  fill="#666"
                  align="center"
                  wrap="none"
                />
              </Group>
            )
          })}

          {/* Scale bar */}
          {buildingBounds && (
            <Group>
              <Rect
                x={buildingBounds.minX + 10}
                y={buildingBounds.maxY + 50}
                width={100}
                height={8}
                fill="#000"
              />
              <Rect
                x={buildingBounds.minX + 60}
                y={buildingBounds.maxY + 50}
                width={50}
                height={8}
                fill="#fff"
                stroke="#000"
                strokeWidth={1}
              />
              <Text x={buildingBounds.minX + 5} y={buildingBounds.maxY + 62} text="0" fontSize={9} fill="#000" />
              <Text x={buildingBounds.minX + 52} y={buildingBounds.maxY + 62} text="5'" fontSize={9} fill="#000" />
              <Text x={buildingBounds.minX + 100} y={buildingBounds.maxY + 62} text="10'" fontSize={9} fill="#000" />
              <Text x={buildingBounds.minX + 10} y={buildingBounds.maxY + 75} text="SCALE 1:100" fontSize={9} fontStyle="bold" fill="#000" />
            </Group>
          )}

          {/* Title block - enhanced */}
          {buildingBounds && (
            <Group>
              <Rect
                x={buildingBounds.maxX - 200}
                y={buildingBounds.maxY + 45}
                width={200}
                height={60}
                stroke="#000"
                strokeWidth={1.5}
                fill="#fff"
              />
              <Line
                points={[buildingBounds.maxX - 200, buildingBounds.maxY + 65, buildingBounds.maxX, buildingBounds.maxY + 65]}
                stroke="#000"
                strokeWidth={1}
              />
              <Line
                points={[buildingBounds.maxX - 200, buildingBounds.maxY + 85, buildingBounds.maxX, buildingBounds.maxY + 85]}
                stroke="#000"
                strokeWidth={0.5}
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 50}
                text={`${plan.buildingType?.toUpperCase() || 'RESIDENCE'}`}
                fontSize={11}
                fontStyle="bold"
                fill="#000"
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 70}
                text={`${floor.level.toUpperCase()} FLOOR PLAN`}
                fontSize={10}
                fill="#000"
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 90}
                text={`AREA: ${floor.totalArea || plan.totalArea || (buildingWidthFt * buildingDepthFt)} SF`}
                fontSize={9}
                fill="#333"
              />
              <Text
                x={buildingBounds.maxX - 80}
                y={buildingBounds.maxY + 90}
                text={`${buildingWidthFt}'x${buildingDepthFt}'`}
                fontSize={9}
                fill="#333"
              />
            </Group>
          )}

          {/* North arrow */}
          {buildingBounds && (
            <Group>
              <Line
                points={[
                  buildingBounds.maxX - 30,
                  buildingBounds.minY - 20,
                  buildingBounds.maxX - 30,
                  buildingBounds.minY - 55
                ]}
                stroke="#000"
                strokeWidth={2}
              />
              <Line
                points={[
                  buildingBounds.maxX - 37,
                  buildingBounds.minY - 45,
                  buildingBounds.maxX - 30,
                  buildingBounds.minY - 55,
                  buildingBounds.maxX - 23,
                  buildingBounds.minY - 45
                ]}
                stroke="#000"
                strokeWidth={2}
                closed
                fill="#000"
              />
              <Text
                x={buildingBounds.maxX - 35}
                y={buildingBounds.minY - 70}
                text="N"
                fontSize={14}
                fontStyle="bold"
                fill="#000"
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  )
})

Preview2D.displayName = 'Preview2D'
