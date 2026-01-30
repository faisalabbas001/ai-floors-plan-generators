'use client'

import { useRef, useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Text, Group, Line, Arc, Shape, Circle, Arrow } from 'react-konva'
import Konva from 'konva'
import type { GeneratedPlan } from '@/lib/api'

// Export handle type for parent components
export interface PreviewTechnicalHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
}

// AutoCAD-style constants
const OUTER_WALL = 10
const INNER_WALL = 5
const WALL_FILL = '#000000'
const BG_COLOR = '#FFFFFF'
const DIM_LINE_COLOR = '#000000'
const TEXT_COLOR = '#000000'
const HATCH_COLOR = '#888888'
const WINDOW_COLOR = '#0066CC'

// Format as feet-inches (12'-6")
const formatFeetInches = (feet: number): string => {
  const ft = Math.floor(feet)
  const inches = Math.round((feet - ft) * 12)
  if (inches === 0) return `${ft}'-0"`
  if (inches === 12) return `${ft + 1}'-0"`
  return `${ft}'-${inches}"`
}

// ============ AUTOCAD-STYLE FURNITURE SYMBOLS ============

// Bed with proper architectural symbol
const drawBedCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isDouble: boolean) => {
  const bedW = Math.min(w * 0.65, isDouble ? 72 : 42)
  const bedH = Math.min(h * 0.55, 84)
  const bx = x + (w - bedW) / 2
  const by = y + (h - bedH) / 2

  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  // Bed frame
  ctx.beginPath()
  ctx.rect(bx, by, bedW, bedH)
  ctx.fill()
  ctx.stroke()

  // Headboard (thick black)
  ctx.fillStyle = '#000'
  ctx.fillRect(bx, by, bedW, 4)

  // Pillows
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 0.8

  if (isDouble) {
    const pw = (bedW - 12) / 2
    ctx.beginPath()
    ctx.roundRect(bx + 4, by + 8, pw, 18, 3)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.roundRect(bx + pw + 8, by + 8, pw, 18, 3)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.roundRect(bx + 4, by + 8, bedW - 8, 18, 3)
    ctx.fill()
    ctx.stroke()
  }

  // Blanket fold line
  ctx.setLineDash([3, 2])
  ctx.beginPath()
  ctx.moveTo(bx + 4, by + bedH * 0.55)
  ctx.lineTo(bx + bedW - 4, by + bedH * 0.55)
  ctx.stroke()
  ctx.setLineDash([])

  // Nightstand
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(bx + bedW + 5, by, 20, 20)
  ctx.fill()
  ctx.stroke()
}

// Wardrobe with CAD hatch pattern
const drawWardrobeCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const ww = Math.min(w * 0.38, 45)
  const wh = Math.min(h * 0.22, 30)
  const wx = x + 10
  const wy = y + 10

  ctx.beginPath()
  ctx.rect(wx, wy, ww, wh)
  ctx.fill()
  ctx.stroke()

  // Door division
  ctx.beginPath()
  ctx.moveTo(wx + ww / 2, wy)
  ctx.lineTo(wx + ww / 2, wy + wh)
  ctx.stroke()

  // CAD hatch lines (diagonal)
  ctx.lineWidth = 0.5
  for (let i = 0; i < ww + wh; i += 5) {
    ctx.beginPath()
    const startX = Math.max(wx, wx + i - wh)
    const startY = Math.min(wy + wh, wy + i)
    const endX = Math.min(wx + ww, wx + i)
    const endY = Math.max(wy, wy + i - ww)
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
  ctx.lineWidth = 1
}

// Toilet - detailed CAD symbol
const drawToiletCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const tx = x + w * 0.68
  const ty = y + h * 0.28

  // Tank
  ctx.beginPath()
  ctx.roundRect(tx - 14, ty - 8, 28, 16, 2)
  ctx.fill()
  ctx.stroke()

  // Bowl outer
  ctx.beginPath()
  ctx.ellipse(tx, ty + 24, 16, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Bowl inner
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.ellipse(tx, ty + 26, 10, 15, 0, 0, Math.PI * 2)
  ctx.stroke()

  // Seat
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(tx, ty + 24, 14, 20, 0, 0, Math.PI * 2)
  ctx.stroke()
}

// Sink - detailed vanity symbol
const drawSinkCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const sx = x + 12
  const sy = y + 12

  // Vanity cabinet
  ctx.beginPath()
  ctx.rect(sx, sy, 48, 34)
  ctx.fill()
  ctx.stroke()

  // Basin
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(sx + 24, sy + 17, 16, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Drain
  ctx.beginPath()
  ctx.arc(sx + 24, sy + 17, 3, 0, Math.PI * 2)
  ctx.stroke()

  // Faucet
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(sx + 24, sy + 6, 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sx + 24, sy + 10)
  ctx.lineTo(sx + 24, sy + 14)
  ctx.stroke()
}

// Bathtub with cross-hatch pattern
const drawBathtubCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const bw = Math.min(w * 0.78, 75)
  const bh = 32
  const bx = x + (w - bw) / 2
  const by = y + h * 0.52

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

  // Cross-hatch pattern inside
  ctx.lineWidth = 0.3
  ctx.strokeStyle = HATCH_COLOR
  for (let i = 8; i < bw - 8; i += 6) {
    ctx.beginPath()
    ctx.moveTo(bx + i, by + 6)
    ctx.lineTo(bx + i, by + bh - 6)
    ctx.stroke()
  }
  for (let i = 8; i < bh - 8; i += 6) {
    ctx.beginPath()
    ctx.moveTo(bx + 6, by + i)
    ctx.lineTo(bx + bw - 6, by + i)
    ctx.stroke()
  }
  ctx.strokeStyle = '#000'

  // Drain
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(bx + bw - 18, by + bh / 2, 5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(bx + bw - 18, by + bh / 2, 2, 0, Math.PI * 2)
  ctx.stroke()

  // Faucet
  ctx.beginPath()
  ctx.rect(bx + 10, by - 4, 16, 6)
  ctx.fill()
  ctx.stroke()
}

// Shower with diagonal lines
const drawShowerCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const size = Math.min(w * 0.38, h * 0.35, 42)
  const sx = x + w - size - 10
  const sy = y + 10

  // Shower base
  ctx.beginPath()
  ctx.rect(sx, sy, size, size)
  ctx.fill()
  ctx.stroke()

  // Diagonal pattern
  ctx.lineWidth = 0.5
  for (let i = 0; i < size * 2; i += 6) {
    ctx.beginPath()
    const startX = Math.max(sx, sx + i - size)
    const startY = Math.min(sy + size, sy + i)
    const endX = Math.min(sx + size, sx + i)
    const endY = Math.max(sy, sy + i - size)
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
  ctx.lineWidth = 1

  // Shower head
  ctx.beginPath()
  ctx.arc(sx + size / 2, sy + 14, 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(sx + size / 2, sy + 14, 4, 0, Math.PI * 2)
  ctx.fill()

  // Drain
  ctx.beginPath()
  ctx.arc(sx + size / 2, sy + size - 12, 4, 0, Math.PI * 2)
  ctx.stroke()
}

// Kitchen with detailed appliances
const drawKitchenCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const counterD = 28

  // L-counter - bottom
  ctx.beginPath()
  ctx.rect(x + 6, y + h - counterD - 8, w - 12, counterD)
  ctx.fill()
  ctx.stroke()

  // L-counter - left side
  ctx.beginPath()
  ctx.rect(x + 6, y + 8, counterD, h * 0.55)
  ctx.fill()
  ctx.stroke()

  // Stove with burners
  ctx.lineWidth = 1
  const stoveX = x + w * 0.52
  const stoveY = y + h - counterD / 2 - 4
  ctx.beginPath()
  ctx.rect(stoveX - 22, stoveY - 12, 44, 24)
  ctx.stroke()

  // Burners
  for (let i = 0; i < 4; i++) {
    const cx = stoveX + (i % 2) * 18 - 9
    const cy = stoveY + Math.floor(i / 2) * 14 - 7
    ctx.beginPath()
    ctx.arc(cx, cy, 7, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Sink with double basin
  ctx.beginPath()
  ctx.rect(x + counterD + 18, y + h - counterD + 2, 35, 22)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(x + counterD + 21, y + h - counterD + 5, 14, 16)
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(x + counterD + 37, y + h - counterD + 5, 14, 16)
  ctx.stroke()

  // Fridge
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(x + w - 48, y + 12, 40, 55)
  ctx.fill()
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + w - 48, y + 35)
  ctx.lineTo(x + w - 8, y + 35)
  ctx.stroke()
  // Handle
  ctx.beginPath()
  ctx.rect(x + w - 14, y + 40, 3, 20)
  ctx.stroke()
}

// Dining table with chairs
const drawDiningCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const tw = Math.min(w * 0.52, 72)
  const th = Math.min(h * 0.38, 48)
  const tx = x + (w - tw) / 2
  const ty = y + (h - th) / 2

  // Table
  ctx.beginPath()
  ctx.rect(tx, ty, tw, th)
  ctx.fill()
  ctx.stroke()

  // Chairs
  ctx.lineWidth = 1
  const chairW = 14
  const chairH = 14
  const chairs = [
    { cx: tx + tw * 0.3, cy: ty - chairH - 6 },
    { cx: tx + tw * 0.7, cy: ty - chairH - 6 },
    { cx: tx + tw * 0.3, cy: ty + th + 6 },
    { cx: tx + tw * 0.7, cy: ty + th + 6 },
    { cx: tx - chairW - 6, cy: ty + th * 0.5 },
    { cx: tx + tw + 6, cy: ty + th * 0.5 },
  ]

  chairs.forEach(({ cx, cy }) => {
    ctx.beginPath()
    ctx.roundRect(cx - chairW / 2, cy - chairH / 2, chairW, chairH, 2)
    ctx.fill()
    ctx.stroke()
  })
}

// Sofa with detailed cushions
const drawSofaCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const sw = Math.min(w * 0.62, 95)
  const sh = 35
  const sx = x + (w - sw) / 2
  const sy = y + h * 0.48

  // Main body
  ctx.beginPath()
  ctx.roundRect(sx, sy, sw, sh, 4)
  ctx.fill()
  ctx.stroke()

  // Back cushions
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx + 5, sy + 8)
  ctx.lineTo(sx + sw - 5, sy + 8)
  ctx.stroke()

  // Seat cushion divisions
  const cushions = 3
  for (let i = 1; i < cushions; i++) {
    ctx.beginPath()
    ctx.moveTo(sx + (sw / cushions) * i, sy + 8)
    ctx.lineTo(sx + (sw / cushions) * i, sy + sh - 3)
    ctx.stroke()
  }

  // Armrests
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.roundRect(sx - 8, sy + 4, 8, sh - 8, 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(sx + sw, sy + 4, 8, sh - 8, 2)
  ctx.fill()
  ctx.stroke()

  // Coffee table
  const ctw = sw * 0.42
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(sx + (sw - ctw) / 2, sy - 30, ctw, 24, 2)
  ctx.fill()
  ctx.stroke()

  // TV cabinet
  ctx.beginPath()
  ctx.rect(sx + sw * 0.12, sy + sh + 38, sw * 0.76, 12)
  ctx.fill()
  ctx.stroke()
}

// Office desk with computer
const drawDeskCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.2
  ctx.fillStyle = '#fff'

  const dw = Math.min(w * 0.55, 60)
  const dh = 28
  const dx = x + (w - dw) / 2
  const dy = y + h * 0.25

  // Desk
  ctx.beginPath()
  ctx.rect(dx, dy, dw, dh)
  ctx.fill()
  ctx.stroke()

  // Drawers
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.rect(dx + 3, dy + 3, dw * 0.3, dh - 6)
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(dx + dw - 3 - dw * 0.3, dy + 3, dw * 0.3, dh - 6)
  ctx.stroke()

  // Monitor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(dx + dw / 2 - 16, dy + 5, 32, 20)
  ctx.stroke()

  // Chair
  ctx.beginPath()
  ctx.arc(dx + dw / 2, dy + dh + 22, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Chair base
  ctx.beginPath()
  ctx.moveTo(dx + dw / 2 - 10, dy + dh + 36)
  ctx.lineTo(dx + dw / 2 + 10, dy + dh + 36)
  ctx.stroke()
}

// Staircase - spiral type
const drawSpiralStairsCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5

  const cx = x + w / 2
  const cy = y + h / 2
  const outerR = Math.min(w, h) * 0.42
  const innerR = outerR * 0.25

  // Outer circle
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
  ctx.stroke()

  // Inner circle (pole)
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.fill()

  // Steps
  ctx.lineWidth = 1
  const steps = 12
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
    ctx.stroke()
  }
}

// Staircase - straight type
const drawStraightStairsCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  ctx.fillStyle = '#fff'

  const sw = Math.min(w * 0.75, 65)
  const sh = Math.min(h * 0.85, 90)
  const sx = x + (w - sw) / 2
  const sy = y + (h - sh) / 2

  // Outline
  ctx.beginPath()
  ctx.rect(sx, sy, sw, sh)
  ctx.fill()
  ctx.stroke()

  // Steps
  ctx.lineWidth = 0.8
  const steps = 12
  const stepH = sh / steps
  for (let i = 0; i <= steps; i++) {
    ctx.beginPath()
    ctx.moveTo(sx, sy + i * stepH)
    ctx.lineTo(sx + sw, sy + i * stepH)
    ctx.stroke()
  }

  // Direction arrow
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx + sw / 2, sy + sh - 10)
  ctx.lineTo(sx + sw / 2, sy + 10)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sx + sw / 2 - 8, sy + 22)
  ctx.lineTo(sx + sw / 2, sy + 10)
  ctx.lineTo(sx + sw / 2 + 8, sy + 22)
  ctx.stroke()

  // "UP" label
  ctx.fillStyle = '#000'
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('UP', sx + sw / 2, sy + sh - 15)
}

// Tile hatch pattern for wet areas
const drawTileHatchCAD = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = HATCH_COLOR
  ctx.lineWidth = 0.3

  const spacing = 10
  // Horizontal
  for (let i = spacing; i < h; i += spacing) {
    ctx.beginPath()
    ctx.moveTo(x + 3, y + i)
    ctx.lineTo(x + w - 3, y + i)
    ctx.stroke()
  }
  // Vertical
  for (let i = spacing; i < w; i += spacing) {
    ctx.beginPath()
    ctx.moveTo(x + i, y + 3)
    ctx.lineTo(x + i, y + h - 3)
    ctx.stroke()
  }
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
  }>
  windows?: Array<{
    id?: string
    wall: 'north' | 'south' | 'east' | 'west'
    position: number
    width: number
    height?: number
  }>
  x: number
  y: number
  width: number
  height: number
  scale?: number
}

interface PreviewTechnicalProps {
  plan: GeneratedPlan
  floorIndex?: number
}

export const PreviewTechnical = forwardRef<PreviewTechnicalHandle, PreviewTechnicalProps>(({ plan, floorIndex = 0 }, ref) => {
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
  const padding = 120

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

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const scaleBy = 1.08
    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const clampedScale = Math.max(0.25, Math.min(5, newScale))

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
    const availableHeight = dimensions.height - padding * 2 - 80

    const hasPositionData = rooms.some(r => r.position && typeof r.position.x === 'number')

    if (hasPositionData) {
      const buildingWidth = plan.buildingDimensions?.width ||
        Math.max(...rooms.map(r => (r.position?.x || 0) + (r.dimensions?.width || 10)))
      const buildingDepth = plan.buildingDimensions?.depth ||
        Math.max(...rooms.map(r => (r.position?.y || 0) + (r.dimensions?.length || 10)))

      const scaleX = availableWidth / buildingWidth
      const scaleY = availableHeight / buildingDepth
      const scale = Math.min(scaleX, scaleY) * 0.75

      const scaledWidth = buildingWidth * scale
      const scaledHeight = buildingDepth * scale
      const offsetX = padding + (availableWidth - scaledWidth) / 2
      const offsetY = padding + 50 + (availableHeight - scaledHeight) / 2

      return rooms.map(room => ({
        ...room,
        x: offsetX + (room.position?.x || 0) * scale,
        y: offsetY + (room.position?.y || 0) * scale,
        width: (room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale,
        height: (room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale,
        scale,
        doors: room.doors || [],
        windows: room.windows || [],
      }))
    }

    // Fallback grid
    const totalArea = rooms.reduce((sum, r) => sum + r.areaSqft, 0)
    const scaleFactor = Math.sqrt((availableWidth * availableHeight * 0.5) / totalArea)
    const cols = Math.ceil(Math.sqrt(rooms.length))

    const roomsWithSize = rooms.map(room => {
      const area = room.areaSqft * scaleFactor * scaleFactor
      let rw: number, rh: number
      if (room.dimensions) {
        rw = room.dimensions.width * scaleFactor
        rh = room.dimensions.length * scaleFactor
      } else {
        rw = Math.sqrt(area * 1.2)
        rh = area / rw
      }
      return { ...room, width: Math.max(rw, 80), height: Math.max(rh, 70) }
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
    const offsetY = padding + 50 + (availableHeight - totalH) / 2

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

  const buildingBounds = useMemo(() => {
    if (layoutRooms.length === 0) return null
    return {
      minX: Math.min(...layoutRooms.map(r => r.x)),
      minY: Math.min(...layoutRooms.map(r => r.y)),
      maxX: Math.max(...layoutRooms.map(r => r.x + r.width)),
      maxY: Math.max(...layoutRooms.map(r => r.y + r.height)),
    }
  }, [layoutRooms])

  const getSharedWalls = useMemo(() => {
    const shared: Map<number, Set<string>> = new Map()
    layoutRooms.forEach((room1, i) => {
      layoutRooms.forEach((room2, j) => {
        if (i >= j) return
        const tolerance = 6

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
      {plan.floors.length > 1 && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {plan.floors.map((f, index) => (
            <button
              key={index}
              onClick={() => setSelectedFloor(index)}
              className={`px-4 py-1.5 text-xs font-semibold rounded border transition-all ${
                selectedFloor === index
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-400 hover:border-black'
              }`}
            >
              {f.level}
            </button>
          ))}
        </div>
      )}

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white border border-gray-300 rounded p-1">
        <button
          onClick={() => setZoom(z => Math.min(5, z * 1.25))}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 rounded border border-gray-200"
        >
          +
        </button>
        <div className="text-[10px] text-center font-mono">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => setZoom(z => Math.max(0.25, z / 1.25))}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 rounded border border-gray-200"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
          className="w-8 h-8 flex items-center justify-center text-[9px] font-bold hover:bg-gray-100 rounded border border-gray-200"
        >
          FIT
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
        <Layer>
          <Rect x={-3000} y={-3000} width={8000} height={8000} fill={BG_COLOR} />
        </Layer>

        <Layer>
          {buildingBounds && (
            <>
              {/* Title Block */}
              <Rect
                x={buildingBounds.maxX - 200}
                y={buildingBounds.maxY + 65}
                width={200}
                height={60}
                stroke="#000"
                strokeWidth={2}
              />
              <Line
                points={[buildingBounds.maxX - 200, buildingBounds.maxY + 85, buildingBounds.maxX, buildingBounds.maxY + 85]}
                stroke="#000"
                strokeWidth={1}
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 70}
                text={(plan.buildingType || 'RESIDENTIAL').toUpperCase()}
                fontSize={9}
                fontFamily="Arial"
                fill="#000"
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 92}
                text={`${floor.level.toUpperCase()} FLOOR PLAN`}
                fontSize={13}
                fontStyle="bold"
                fontFamily="Arial"
                fill="#000"
              />
              <Text
                x={buildingBounds.maxX - 195}
                y={buildingBounds.maxY + 108}
                text={`SCALE: 1:100 | AREA: ${floor.totalArea || buildingWidthFt * buildingDepthFt} SQ.FT`}
                fontSize={8}
                fontFamily="Arial"
                fill="#333"
              />

              {/* North Arrow */}
              <Group x={buildingBounds.minX + 25} y={buildingBounds.maxY + 80}>
                <Circle radius={20} stroke="#000" strokeWidth={1.5} />
                <Line points={[0, 18, 0, -18]} stroke="#000" strokeWidth={2} />
                <Line points={[-6, -8, 0, -18, 6, -8]} stroke="#000" strokeWidth={2} closed fill="#000" />
                <Text x={-5} y={22} text="N" fontSize={14} fontStyle="bold" fill="#000" />
              </Group>

              {/* Scale Bar */}
              <Group x={buildingBounds.minX + 70} y={buildingBounds.maxY + 85}>
                <Rect x={0} y={-3} width={120} height={8} stroke="#000" strokeWidth={1} />
                <Rect x={0} y={-3} width={30} height={8} fill="#000" />
                <Rect x={60} y={-3} width={30} height={8} fill="#000" />
                <Line points={[0, -6, 0, 8]} stroke="#000" strokeWidth={1} />
                <Line points={[60, -6, 60, 8]} stroke="#000" strokeWidth={1} />
                <Line points={[120, -6, 120, 8]} stroke="#000" strokeWidth={1} />
                <Text x={-5} y={12} text="0" fontSize={8} fill="#000" />
                <Text x={52} y={12} text="10'" fontSize={8} fill="#000" />
                <Text x={112} y={12} text="20'" fontSize={8} fill="#000" />
              </Group>

              {/* Room Schedule - Positioned above the floor plan */}
              <Group x={buildingBounds.minX} y={buildingBounds.minY - 150}>
                <Text x={0} y={-18} text="ROOM SCHEDULE" fontSize={10} fontStyle="bold" fill="#000" />
                {/* Header row */}
                <Rect x={0} y={0} width={90} height={16} stroke="#000" strokeWidth={0.8} fill="#E8E8E8" />
                <Rect x={90} y={0} width={55} height={16} stroke="#000" strokeWidth={0.8} fill="#E8E8E8" />
                <Text x={5} y={4} text="ROOM" fontSize={9} fontStyle="bold" fill="#000" />
                <Text x={95} y={4} text="AREA (SF)" fontSize={9} fontStyle="bold" fill="#000" />
                {/* Data rows */}
                {layoutRooms.slice(0, 8).map((room, idx) => (
                  <Group key={`schedule-${idx}`}>
                    <Rect x={0} y={16 + idx * 14} width={90} height={14} stroke="#000" strokeWidth={0.4} fill="#FFFFFF" />
                    <Rect x={90} y={16 + idx * 14} width={55} height={14} stroke="#000" strokeWidth={0.4} fill="#FFFFFF" />
                    <Text x={5} y={19 + idx * 14} text={room.name.length > 14 ? room.name.substring(0, 12) + '..' : room.name} fontSize={8} fill="#000" />
                    <Text x={95} y={19 + idx * 14} text={`${room.areaSqft}`} fontSize={8} fill="#000" />
                  </Group>
                ))}
                {/* Total row */}
                <Rect x={0} y={16 + Math.min(layoutRooms.length, 8) * 14} width={90} height={16} stroke="#000" strokeWidth={0.8} fill="#E8E8E8" />
                <Rect x={90} y={16 + Math.min(layoutRooms.length, 8) * 14} width={55} height={16} stroke="#000" strokeWidth={0.8} fill="#E8E8E8" />
                <Text x={5} y={20 + Math.min(layoutRooms.length, 8) * 14} text="TOTAL" fontSize={9} fontStyle="bold" fill="#000" />
                <Text x={95} y={20 + Math.min(layoutRooms.length, 8) * 14} text={`${layoutRooms.reduce((sum, r) => sum + r.areaSqft, 0)}`} fontSize={9} fontStyle="bold" fill="#000" />
              </Group>

              {/* Building Overall Dimensions - Top */}
              <Line
                points={[buildingBounds.minX, buildingBounds.minY - 50, buildingBounds.maxX, buildingBounds.minY - 50]}
                stroke={DIM_LINE_COLOR}
                strokeWidth={0.8}
              />
              <Line points={[buildingBounds.minX, buildingBounds.minY - 56, buildingBounds.minX, buildingBounds.minY - 44]} stroke={DIM_LINE_COLOR} strokeWidth={0.8} />
              <Line points={[buildingBounds.maxX, buildingBounds.minY - 56, buildingBounds.maxX, buildingBounds.minY - 44]} stroke={DIM_LINE_COLOR} strokeWidth={0.8} />
              <Text
                x={buildingBounds.minX}
                y={buildingBounds.minY - 68}
                width={buildingBounds.maxX - buildingBounds.minX}
                text={formatFeetInches(buildingWidthFt)}
                fontSize={11}
                fontFamily="Arial"
                fontStyle="bold"
                fill={TEXT_COLOR}
                align="center"
              />

              {/* Building Overall Dimensions - Left */}
              <Line
                points={[buildingBounds.minX - 50, buildingBounds.minY, buildingBounds.minX - 50, buildingBounds.maxY]}
                stroke={DIM_LINE_COLOR}
                strokeWidth={0.8}
              />
              <Line points={[buildingBounds.minX - 56, buildingBounds.minY, buildingBounds.minX - 44, buildingBounds.minY]} stroke={DIM_LINE_COLOR} strokeWidth={0.8} />
              <Line points={[buildingBounds.minX - 56, buildingBounds.maxY, buildingBounds.minX - 44, buildingBounds.maxY]} stroke={DIM_LINE_COLOR} strokeWidth={0.8} />
              <Text
                x={buildingBounds.minX - 85}
                y={(buildingBounds.minY + buildingBounds.maxY) / 2 - 6}
                text={formatFeetInches(buildingDepthFt)}
                fontSize={11}
                fontFamily="Arial"
                fontStyle="bold"
                fill={TEXT_COLOR}
              />

              {/* Building Outline - thick black walls */}
              <Rect
                x={buildingBounds.minX - OUTER_WALL / 2}
                y={buildingBounds.minY - OUTER_WALL / 2}
                width={buildingBounds.maxX - buildingBounds.minX + OUTER_WALL}
                height={buildingBounds.maxY - buildingBounds.minY + OUTER_WALL}
                stroke={WALL_FILL}
                strokeWidth={OUTER_WALL}
                fill="#FFFFFF"
              />
            </>
          )}

          {/* Rooms */}
          {layoutRooms.map((room, index) => {
            const sharedWalls = getSharedWalls.get(index) || new Set()
            const isExteriorNorth = buildingBounds && Math.abs(room.y - buildingBounds.minY) < 6
            const isExteriorSouth = buildingBounds && Math.abs(room.y + room.height - buildingBounds.maxY) < 6
            const isExteriorWest = buildingBounds && Math.abs(room.x - buildingBounds.minX) < 6
            const isExteriorEast = buildingBounds && Math.abs(room.x + room.width - buildingBounds.maxX) < 6
            const roomType = room.name.toLowerCase()

            const isWetArea = roomType.includes('bathroom') || roomType.includes('kitchen') ||
                             roomType.includes('toilet') || roomType.includes('w.c') || roomType.includes('laundry')

            return (
              <Group key={index}>
                {/* Room fill */}
                <Rect x={room.x} y={room.y} width={room.width} height={room.height} fill="#FFFFFF" />

                {/* Tile hatch for wet areas */}
                {isWetArea && (
                  <Shape
                    sceneFunc={(context, shape) => {
                      const ctx = context._context as CanvasRenderingContext2D
                      drawTileHatchCAD(ctx, room.x, room.y, room.width, room.height)
                      context.fillStrokeShape(shape)
                    }}
                  />
                )}

                {/* Interior walls */}
                {!isExteriorNorth && !sharedWalls.has('north') && (
                  <Line points={[room.x, room.y, room.x + room.width, room.y]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {sharedWalls.has('north') && (
                  <Line points={[room.x, room.y, room.x + room.width, room.y]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {!isExteriorSouth && !sharedWalls.has('south') && (
                  <Line points={[room.x, room.y + room.height, room.x + room.width, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {sharedWalls.has('south') && (
                  <Line points={[room.x, room.y + room.height, room.x + room.width, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {!isExteriorWest && !sharedWalls.has('west') && (
                  <Line points={[room.x, room.y, room.x, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {sharedWalls.has('west') && (
                  <Line points={[room.x, room.y, room.x, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {!isExteriorEast && !sharedWalls.has('east') && (
                  <Line points={[room.x + room.width, room.y, room.x + room.width, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}
                {sharedWalls.has('east') && (
                  <Line points={[room.x + room.width, room.y, room.x + room.width, room.y + room.height]} stroke={WALL_FILL} strokeWidth={INNER_WALL} />
                )}

                {/* Doors from AI data */}
                {room.doors && room.doors.length > 0 ? (
                  room.doors.map((door, doorIdx) => {
                    const doorScale = room.scale || 10
                    const doorWidthPx = door.width * doorScale
                    const doorPosPx = door.position * doorScale

                    // Calculate door position based on wall
                    let doorX = room.x
                    let doorY = room.y
                    let isHorizontal = true
                    let swingDir = door.type === 'sliding' ? 0 : 1

                    switch (door.wall) {
                      case 'north':
                        doorX = room.x + doorPosPx
                        doorY = room.y
                        isHorizontal = true
                        swingDir = 1 // swing down into room
                        break
                      case 'south':
                        doorX = room.x + doorPosPx
                        doorY = room.y + room.height
                        isHorizontal = true
                        swingDir = -1 // swing up into room
                        break
                      case 'west':
                        doorX = room.x
                        doorY = room.y + doorPosPx
                        isHorizontal = false
                        swingDir = 1 // swing right into room
                        break
                      case 'east':
                        doorX = room.x + room.width
                        doorY = room.y + doorPosPx
                        isHorizontal = false
                        swingDir = -1 // swing left into room
                        break
                    }

                    const isSliding = door.type === 'sliding' || door.type === 'pocket'
                    const isDouble = door.type === 'double' || door.type === 'french'
                    const wallThickness = (door.wall === 'north' || door.wall === 'south') && (isExteriorNorth || isExteriorSouth) ? OUTER_WALL : INNER_WALL

                    return (
                      <Group key={`door-${doorIdx}`}>
                        {/* Wall opening (clear the wall) */}
                        {isHorizontal ? (
                          <Line
                            points={[doorX, doorY, doorX + doorWidthPx, doorY]}
                            stroke="#FFFFFF"
                            strokeWidth={wallThickness + 4}
                          />
                        ) : (
                          <Line
                            points={[doorX, doorY, doorX, doorY + doorWidthPx]}
                            stroke="#FFFFFF"
                            strokeWidth={wallThickness + 4}
                          />
                        )}

                        {isSliding ? (
                          // Sliding door - parallel lines
                          isHorizontal ? (
                            <>
                              <Line points={[doorX, doorY - 2, doorX + doorWidthPx, doorY - 2]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX, doorY + 2, doorX + doorWidthPx, doorY + 2]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX + doorWidthPx / 2, doorY - 2, doorX + doorWidthPx / 2, doorY + 2]} stroke={DIM_LINE_COLOR} strokeWidth={1} />
                            </>
                          ) : (
                            <>
                              <Line points={[doorX - 2, doorY, doorX - 2, doorY + doorWidthPx]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX + 2, doorY, doorX + 2, doorY + doorWidthPx]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX - 2, doorY + doorWidthPx / 2, doorX + 2, doorY + doorWidthPx / 2]} stroke={DIM_LINE_COLOR} strokeWidth={1} />
                            </>
                          )
                        ) : isDouble ? (
                          // Double door - two swing arcs
                          isHorizontal ? (
                            <>
                              <Arc
                                x={doorX}
                                y={doorY}
                                innerRadius={0}
                                outerRadius={doorWidthPx / 2}
                                angle={90}
                                rotation={swingDir > 0 ? 0 : -90}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Arc
                                x={doorX + doorWidthPx}
                                y={doorY}
                                innerRadius={0}
                                outerRadius={doorWidthPx / 2}
                                angle={90}
                                rotation={swingDir > 0 ? 90 : 180}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Line points={[doorX, doorY, doorX, doorY + swingDir * doorWidthPx / 2]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX + doorWidthPx, doorY, doorX + doorWidthPx, doorY + swingDir * doorWidthPx / 2]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                            </>
                          ) : (
                            <>
                              <Arc
                                x={doorX}
                                y={doorY}
                                innerRadius={0}
                                outerRadius={doorWidthPx / 2}
                                angle={90}
                                rotation={swingDir > 0 ? -90 : 180}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Arc
                                x={doorX}
                                y={doorY + doorWidthPx}
                                innerRadius={0}
                                outerRadius={doorWidthPx / 2}
                                angle={90}
                                rotation={swingDir > 0 ? 0 : 90}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Line points={[doorX, doorY, doorX + swingDir * doorWidthPx / 2, doorY]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                              <Line points={[doorX, doorY + doorWidthPx, doorX + swingDir * doorWidthPx / 2, doorY + doorWidthPx]} stroke={DIM_LINE_COLOR} strokeWidth={2} />
                            </>
                          )
                        ) : (
                          // Single door with swing arc
                          isHorizontal ? (
                            <>
                              <Arc
                                x={doorX}
                                y={doorY}
                                innerRadius={0}
                                outerRadius={doorWidthPx}
                                angle={90}
                                rotation={swingDir > 0 ? 0 : -90}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Line
                                points={[doorX, doorY, doorX, doorY + swingDir * doorWidthPx]}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={2}
                              />
                            </>
                          ) : (
                            <>
                              <Arc
                                x={doorX}
                                y={doorY}
                                innerRadius={0}
                                outerRadius={doorWidthPx}
                                angle={90}
                                rotation={swingDir > 0 ? -90 : 180}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={0.8}
                              />
                              <Line
                                points={[doorX, doorY, doorX + swingDir * doorWidthPx, doorY]}
                                stroke={DIM_LINE_COLOR}
                                strokeWidth={2}
                              />
                            </>
                          )
                        )}
                      </Group>
                    )
                  })
                ) : (
                  // Fallback: Door on south or east shared wall if no AI data
                  <>
                    {sharedWalls.has('south') && (
                      <Group>
                        <Line
                          points={[room.x + room.width * 0.32, room.y + room.height, room.x + room.width * 0.68, room.y + room.height]}
                          stroke="#FFFFFF"
                          strokeWidth={INNER_WALL + 4}
                        />
                        <Arc
                          x={room.x + room.width * 0.32}
                          y={room.y + room.height}
                          innerRadius={0}
                          outerRadius={room.width * 0.34}
                          angle={90}
                          rotation={-90}
                          stroke={DIM_LINE_COLOR}
                          strokeWidth={0.8}
                        />
                        <Line
                          points={[room.x + room.width * 0.32, room.y + room.height, room.x + room.width * 0.32, room.y + room.height - room.width * 0.34]}
                          stroke={DIM_LINE_COLOR}
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                    {sharedWalls.has('east') && !sharedWalls.has('south') && (
                      <Group>
                        <Line
                          points={[room.x + room.width, room.y + room.height * 0.32, room.x + room.width, room.y + room.height * 0.68]}
                          stroke="#FFFFFF"
                          strokeWidth={INNER_WALL + 4}
                        />
                        <Arc
                          x={room.x + room.width}
                          y={room.y + room.height * 0.32}
                          innerRadius={0}
                          outerRadius={room.height * 0.34}
                          angle={90}
                          rotation={0}
                          stroke={DIM_LINE_COLOR}
                          strokeWidth={0.8}
                        />
                        <Line
                          points={[room.x + room.width, room.y + room.height * 0.32, room.x + room.width + room.height * 0.34, room.y + room.height * 0.32]}
                          stroke={DIM_LINE_COLOR}
                          strokeWidth={2}
                        />
                      </Group>
                    )}
                  </>
                )}

                {/* Windows from AI data */}
                {room.windows && room.windows.length > 0 ? (
                  room.windows.map((window, winIdx) => {
                    const winScale = room.scale || 10
                    const winWidthPx = window.width * winScale
                    const winPosPx = window.position * winScale

                    // Calculate window position based on wall
                    let winX = room.x
                    let winY = room.y
                    let isHorizontal = true
                    const isExteriorWall =
                      (window.wall === 'north' && isExteriorNorth) ||
                      (window.wall === 'south' && isExteriorSouth) ||
                      (window.wall === 'west' && isExteriorWest) ||
                      (window.wall === 'east' && isExteriorEast)

                    switch (window.wall) {
                      case 'north':
                        winX = room.x + winPosPx
                        winY = room.y
                        isHorizontal = true
                        break
                      case 'south':
                        winX = room.x + winPosPx
                        winY = room.y + room.height
                        isHorizontal = true
                        break
                      case 'west':
                        winX = room.x
                        winY = room.y + winPosPx
                        isHorizontal = false
                        break
                      case 'east':
                        winX = room.x + room.width
                        winY = room.y + winPosPx
                        isHorizontal = false
                        break
                    }

                    const wallThickness = isExteriorWall ? OUTER_WALL : INNER_WALL

                    return (
                      <Group key={`window-${winIdx}`}>
                        {/* Wall opening */}
                        {isHorizontal ? (
                          <Line
                            points={[winX, winY, winX + winWidthPx, winY]}
                            stroke="#FFFFFF"
                            strokeWidth={wallThickness}
                          />
                        ) : (
                          <Line
                            points={[winX, winY, winX, winY + winWidthPx]}
                            stroke="#FFFFFF"
                            strokeWidth={wallThickness}
                          />
                        )}

                        {/* Window frame - CAD style double line with mullion */}
                        {isHorizontal ? (
                          <>
                            <Line points={[winX, winY - 4, winX + winWidthPx, winY - 4]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                            <Line points={[winX, winY + 1, winX + winWidthPx, winY + 1]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                            <Line points={[winX, winY - 4, winX, winY + 1]} stroke={WINDOW_COLOR} strokeWidth={1} />
                            <Line points={[winX + winWidthPx, winY - 4, winX + winWidthPx, winY + 1]} stroke={WINDOW_COLOR} strokeWidth={1} />
                            {/* Center mullion */}
                            <Line points={[winX + winWidthPx / 2, winY - 4, winX + winWidthPx / 2, winY + 1]} stroke={WINDOW_COLOR} strokeWidth={0.5} />
                          </>
                        ) : (
                          <>
                            <Line points={[winX - 4, winY, winX - 4, winY + winWidthPx]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                            <Line points={[winX + 1, winY, winX + 1, winY + winWidthPx]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                            <Line points={[winX - 4, winY, winX + 1, winY]} stroke={WINDOW_COLOR} strokeWidth={1} />
                            <Line points={[winX - 4, winY + winWidthPx, winX + 1, winY + winWidthPx]} stroke={WINDOW_COLOR} strokeWidth={1} />
                            {/* Center mullion */}
                            <Line points={[winX - 4, winY + winWidthPx / 2, winX + 1, winY + winWidthPx / 2]} stroke={WINDOW_COLOR} strokeWidth={0.5} />
                          </>
                        )}
                      </Group>
                    )
                  })
                ) : (
                  // Fallback: Window on north exterior if no AI data
                  isExteriorNorth && !roomType.includes('bathroom') && !roomType.includes('toilet') && (
                    <Group>
                      <Line
                        points={[room.x + room.width * 0.2, room.y - OUTER_WALL/2, room.x + room.width * 0.8, room.y - OUTER_WALL/2]}
                        stroke="#FFFFFF"
                        strokeWidth={OUTER_WALL}
                      />
                      <Line points={[room.x + room.width * 0.2, room.y - 4, room.x + room.width * 0.8, room.y - 4]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                      <Line points={[room.x + room.width * 0.2, room.y + 1, room.x + room.width * 0.8, room.y + 1]} stroke={WINDOW_COLOR} strokeWidth={1.5} />
                      <Line points={[room.x + room.width * 0.2, room.y - 4, room.x + room.width * 0.2, room.y + 1]} stroke={WINDOW_COLOR} strokeWidth={1} />
                      <Line points={[room.x + room.width * 0.8, room.y - 4, room.x + room.width * 0.8, room.y + 1]} stroke={WINDOW_COLOR} strokeWidth={1} />
                      <Line points={[room.x + room.width * 0.5, room.y - 4, room.x + room.width * 0.5, room.y + 1]} stroke={WINDOW_COLOR} strokeWidth={0.5} />
                    </Group>
                  )
                )}

                {/* Furniture */}
                <Shape
                  sceneFunc={(context, shape) => {
                    const ctx = context._context as CanvasRenderingContext2D

                    if (roomType.includes('master') || roomType.includes('bedroom')) {
                      drawBedCAD(ctx, room.x, room.y, room.width, room.height, roomType.includes('master'))
                      drawWardrobeCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('bathroom') || roomType.includes('en-suite')) {
                      drawToiletCAD(ctx, room.x, room.y, room.width, room.height)
                      drawSinkCAD(ctx, room.x, room.y, room.width, room.height)
                      if (room.width > 90 && room.height > 90) {
                        drawBathtubCAD(ctx, room.x, room.y, room.width, room.height)
                      } else if (room.width > 70 && room.height > 70) {
                        drawShowerCAD(ctx, room.x, room.y, room.width, room.height)
                      }
                    } else if (roomType.includes('toilet') || roomType.includes('w.c')) {
                      drawToiletCAD(ctx, room.x, room.y, room.width, room.height)
                      drawSinkCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('kitchen')) {
                      drawKitchenCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('dining')) {
                      drawDiningCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('living') || roomType.includes('lounge') || roomType.includes('drawing')) {
                      drawSofaCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('office') || roomType.includes('study')) {
                      drawDeskCAD(ctx, room.x, room.y, room.width, room.height)
                    } else if (roomType.includes('stair')) {
                      if (room.width > room.height * 1.2) {
                        drawSpiralStairsCAD(ctx, room.x, room.y, room.width, room.height)
                      } else {
                        drawStraightStairsCAD(ctx, room.x, room.y, room.width, room.height)
                      }
                    }

                    context.fillStrokeShape(shape)
                  }}
                />

                {/* Room dimension lines */}
                <Line
                  points={[room.x + 8, room.y + room.height + 15, room.x + room.width - 8, room.y + room.height + 15]}
                  stroke={DIM_LINE_COLOR}
                  strokeWidth={0.5}
                />
                <Line points={[room.x + 8, room.y + room.height + 10, room.x + 8, room.y + room.height + 20]} stroke={DIM_LINE_COLOR} strokeWidth={0.5} />
                <Line points={[room.x + room.width - 8, room.y + room.height + 10, room.x + room.width - 8, room.y + room.height + 20]} stroke={DIM_LINE_COLOR} strokeWidth={0.5} />

                <Line
                  points={[room.x + room.width + 15, room.y + 8, room.x + room.width + 15, room.y + room.height - 8]}
                  stroke={DIM_LINE_COLOR}
                  strokeWidth={0.5}
                />
                <Line points={[room.x + room.width + 10, room.y + 8, room.x + room.width + 20, room.y + 8]} stroke={DIM_LINE_COLOR} strokeWidth={0.5} />
                <Line points={[room.x + room.width + 10, room.y + room.height - 8, room.x + room.width + 20, room.y + room.height - 8]} stroke={DIM_LINE_COLOR} strokeWidth={0.5} />
              </Group>
            )
          })}

          {/* Room Labels - Rendered separately on top of all rooms to prevent overlap */}
          {layoutRooms.map((room, index) => {
            const minDim = Math.min(room.width, room.height)
            const labelFontSize = Math.max(7, Math.min(11, minDim / 9))
            const dimFontSize = Math.max(6, Math.min(9, minDim / 11))
            const areaFontSize = Math.max(5, Math.min(8, minDim / 13))

            const labelHeight = labelFontSize + dimFontSize + areaFontSize + 16
            const labelWidth = Math.min(room.width - 16, 100)
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
                  fill="rgba(255, 255, 255, 0.97)"
                  stroke="#D0D0D0"
                  strokeWidth={0.5}
                  cornerRadius={2}
                />
                {/* Room name */}
                <Text
                  x={labelX}
                  y={labelY + 5}
                  width={labelWidth}
                  text={displayName}
                  fontSize={labelFontSize}
                  fontStyle="bold"
                  fontFamily="Arial"
                  fill={TEXT_COLOR}
                  align="center"
                  wrap="none"
                  ellipsis={true}
                />
                {/* Room dimensions */}
                <Text
                  x={labelX}
                  y={labelY + labelFontSize + 9}
                  width={labelWidth}
                  text={`${formatFeetInches(roomWidthFt)}x${formatFeetInches(roomHeightFt)}`}
                  fontSize={dimFontSize}
                  fontFamily="Arial"
                  fill="#333"
                  align="center"
                  wrap="none"
                />
                {/* Room area */}
                <Text
                  x={labelX}
                  y={labelY + labelFontSize + dimFontSize + 13}
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
        </Layer>
      </Stage>
    </div>
  )
})

PreviewTechnical.displayName = 'PreviewTechnical'
