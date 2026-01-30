'use client'

import { useRef, useEffect, useCallback, useState, useMemo, forwardRef, useImperativeHandle, Fragment } from 'react'
import { Stage, Layer, Rect, Text, Group, Transformer, Line, Arc, Circle, Shape } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'
import { useEditorStore, Room, DoorElement, WindowElement, WallSide, FurnitureElement, TextElement } from '@/lib/stores/editor-store'
import { ZoomIn, ZoomOut, Maximize, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Export handle type for parent components to use
export interface Canvas2DHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
  getStage: () => Konva.Stage | null
}

// Room colors - professional architectural palette
const ROOM_COLORS: Record<string, string> = {
  bedroom: '#FAFAF8',
  'master bedroom': '#FAF8F5',
  bathroom: '#F0F8FF',
  kitchen: '#FFFEF5',
  'living room': '#F5FAF5',
  living: '#F5FAF5',
  'dining room': '#FFF8F5',
  dining: '#FFF8F5',
  office: '#F8F5FA',
  garage: '#F0F0F0',
  hallway: '#FAFAFA',
  corridor: '#FAFAFA',
  closet: '#FAF9F5',
  laundry: '#F5FAFD',
  lobby: '#FDF5FA',
  reception: '#FFF5F8',
  default: '#FAFAFA',
}

const getRoomColor = (roomName: string): string => {
  const type = roomName.toLowerCase()
  for (const [key, color] of Object.entries(ROOM_COLORS)) {
    if (type.includes(key)) return color
  }
  return ROOM_COLORS.default
}

// Check if two rooms share a wall
interface SharedWallInfo {
  otherRoomId: string;
  wall: WallSide;
  start: number;
  end: number;
}

const getSharedWalls = (rooms: Room[]): Map<string, SharedWallInfo[]> => {
  const sharedWalls = new Map<string, SharedWallInfo[]>();
  const tolerance = 5; // pixels

  rooms.forEach(room => {
    sharedWalls.set(room.id, []);
  });

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const r1 = rooms[i];
      const r2 = rooms[j];

      // Check if r1's east wall touches r2's west wall
      if (Math.abs((r1.x + r1.width) - r2.x) < tolerance) {
        const overlapStart = Math.max(r1.y, r2.y);
        const overlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
        if (overlapEnd > overlapStart) {
          sharedWalls.get(r1.id)?.push({ otherRoomId: r2.id, wall: 'east', start: overlapStart - r1.y, end: overlapEnd - r1.y });
          sharedWalls.get(r2.id)?.push({ otherRoomId: r1.id, wall: 'west', start: overlapStart - r2.y, end: overlapEnd - r2.y });
        }
      }

      // Check if r1's west wall touches r2's east wall
      if (Math.abs(r1.x - (r2.x + r2.width)) < tolerance) {
        const overlapStart = Math.max(r1.y, r2.y);
        const overlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
        if (overlapEnd > overlapStart) {
          sharedWalls.get(r1.id)?.push({ otherRoomId: r2.id, wall: 'west', start: overlapStart - r1.y, end: overlapEnd - r1.y });
          sharedWalls.get(r2.id)?.push({ otherRoomId: r1.id, wall: 'east', start: overlapStart - r2.y, end: overlapEnd - r2.y });
        }
      }

      // Check if r1's south wall touches r2's north wall
      if (Math.abs((r1.y + r1.height) - r2.y) < tolerance) {
        const overlapStart = Math.max(r1.x, r2.x);
        const overlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
        if (overlapEnd > overlapStart) {
          sharedWalls.get(r1.id)?.push({ otherRoomId: r2.id, wall: 'south', start: overlapStart - r1.x, end: overlapEnd - r1.x });
          sharedWalls.get(r2.id)?.push({ otherRoomId: r1.id, wall: 'north', start: overlapStart - r2.x, end: overlapEnd - r2.x });
        }
      }

      // Check if r1's north wall touches r2's south wall
      if (Math.abs(r1.y - (r2.y + r2.height)) < tolerance) {
        const overlapStart = Math.max(r1.x, r2.x);
        const overlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
        if (overlapEnd > overlapStart) {
          sharedWalls.get(r1.id)?.push({ otherRoomId: r2.id, wall: 'north', start: overlapStart - r1.x, end: overlapEnd - r1.x });
          sharedWalls.get(r2.id)?.push({ otherRoomId: r1.id, wall: 'south', start: overlapStart - r2.x, end: overlapEnd - r2.x });
        }
      }
    }
  }

  return sharedWalls;
}

// Get building bounds from rooms
const getBuildingBounds = (rooms: Room[]) => {
  if (rooms.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  rooms.forEach(room => {
    minX = Math.min(minX, room.x);
    minY = Math.min(minY, room.y);
    maxX = Math.max(maxX, room.x + room.width);
    maxY = Math.max(maxY, room.y + room.height);
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// Professional furniture drawing functions - matching architectural standards
const drawBed = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isDouble: boolean = true) => {
  const bedW = Math.min(w * 0.65, isDouble ? 60 : 38)
  const bedH = Math.min(h * 0.55, 75)
  const bx = x + (w - bedW) / 2
  const by = y + (h - bedH) / 2 + 5

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  // Bed frame outline
  ctx.beginPath()
  ctx.rect(bx, by, bedW, bedH)
  ctx.fill()
  ctx.stroke()

  // Headboard (thick line at top)
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + bedW, by)
  ctx.stroke()
  ctx.lineWidth = 1

  // Pillows with rounded corners
  ctx.fillStyle = '#fff'
  if (isDouble) {
    const pillowW = bedW / 2 - 6
    // Left pillow
    ctx.beginPath()
    ctx.roundRect(bx + 3, by + 5, pillowW, 14, 3)
    ctx.fill()
    ctx.stroke()
    // Right pillow
    ctx.beginPath()
    ctx.roundRect(bx + bedW / 2 + 3, by + 5, pillowW, 14, 3)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.roundRect(bx + 5, by + 5, bedW - 10, 14, 3)
    ctx.fill()
    ctx.stroke()
  }

  // Blanket fold line
  ctx.beginPath()
  ctx.moveTo(bx + 3, by + bedH * 0.6)
  ctx.lineTo(bx + bedW - 3, by + bedH * 0.6)
  ctx.stroke()
}

// Wardrobe / Closet symbol
const drawWardrobe = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const ww = Math.min(w * 0.35, 35)
  const wh = Math.min(h * 0.25, 25)
  const wx = x + 8
  const wy = y + 8

  ctx.beginPath()
  ctx.rect(wx, wy, ww, wh)
  ctx.fill()
  ctx.stroke()

  // Center line (doors)
  ctx.beginPath()
  ctx.moveTo(wx + ww / 2, wy)
  ctx.lineTo(wx + ww / 2, wy + wh)
  ctx.stroke()

  // Diagonal lines for hatch pattern
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(wx + 3 + i * 6, wy + 3)
    ctx.lineTo(wx + 3 + i * 6 + 5, wy + wh - 3)
  }
  ctx.stroke()
}

const drawToilet = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const tx = x + w * 0.7
  const ty = y + h * 0.3

  // Tank
  ctx.beginPath()
  ctx.rect(tx - 10, ty - 5, 20, 12)
  ctx.fill()
  ctx.stroke()

  // Bowl (ellipse)
  ctx.beginPath()
  ctx.ellipse(tx, ty + 20, 12, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Inner bowl
  ctx.beginPath()
  ctx.ellipse(tx, ty + 22, 8, 12, 0, 0, Math.PI * 2)
  ctx.stroke()
}

const drawSink = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const sx = x + 10
  const sy = y + 10

  // Vanity rectangle
  ctx.beginPath()
  ctx.rect(sx, sy, 35, 25)
  ctx.fill()
  ctx.stroke()

  // Basin (oval)
  ctx.beginPath()
  ctx.ellipse(sx + 17.5, sy + 12.5, 12, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Faucet symbol
  ctx.beginPath()
  ctx.arc(sx + 17.5, sy + 5, 3, 0, Math.PI * 2)
  ctx.stroke()
}

// Bathtub
const drawBathtub = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const bx = x + w * 0.1
  const by = y + h * 0.55
  const bw = Math.min(w * 0.8, 60)
  const bh = 25

  // Outer tub
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 5)
  ctx.fill()
  ctx.stroke()

  // Inner tub
  ctx.beginPath()
  ctx.roundRect(bx + 3, by + 3, bw - 6, bh - 6, 3)
  ctx.stroke()

  // Drain
  ctx.beginPath()
  ctx.arc(bx + bw - 15, by + bh / 2, 4, 0, Math.PI * 2)
  ctx.stroke()
}

// Shower
const drawShower = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const size = Math.min(w * 0.4, h * 0.35, 35)
  const sx = x + w - size - 8
  const sy = y + 8

  // Shower base
  ctx.beginPath()
  ctx.rect(sx, sy, size, size)
  ctx.fill()
  ctx.stroke()

  // Diagonal lines for shower pattern
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(sx + 5 + i * 8, sy + 5)
    ctx.lineTo(sx + 5 + i * 8, sy + size - 5)
  }
  ctx.stroke()

  // Shower head symbol
  ctx.beginPath()
  ctx.arc(sx + size / 2, sy + 10, 6, 0, Math.PI * 2)
  ctx.stroke()
}

const drawKitchenCounter = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#f8f8f8'

  const counterDepth = 22

  // L-shaped counter
  // Bottom counter
  ctx.beginPath()
  ctx.rect(x + 5, y + h - counterDepth - 5, w - 10, counterDepth)
  ctx.fill()
  ctx.stroke()

  // Side counter
  ctx.beginPath()
  ctx.rect(x + 5, y + 5, counterDepth, h * 0.5)
  ctx.fill()
  ctx.stroke()

  // Stove burners (4 circles)
  ctx.fillStyle = '#fff'
  const stoveX = x + w * 0.55
  const stoveY = y + h - counterDepth / 2 - 2
  for (let i = 0; i < 4; i++) {
    const cx = stoveX + (i % 2) * 14 - 7
    const cy = stoveY + Math.floor(i / 2) * 10 - 5
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // Sink in counter
  ctx.beginPath()
  ctx.rect(x + counterDepth + 15, y + h - counterDepth, 25, 15)
  ctx.fill()
  ctx.stroke()

  // Fridge
  ctx.beginPath()
  ctx.rect(x + w - 35, y + 10, 28, 40)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + w - 35, y + 30)
  ctx.lineTo(x + w - 7, y + 30)
  ctx.stroke()
}

const drawDiningTable = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const tableW = Math.min(w * 0.5, 60)
  const tableH = Math.min(h * 0.35, 35)
  const tx = x + (w - tableW) / 2
  const ty = y + (h - tableH) / 2

  // Table
  ctx.beginPath()
  ctx.roundRect(tx, ty, tableW, tableH, 2)
  ctx.fill()
  ctx.stroke()

  // Chairs as rounded rectangles
  const chairSize = 10
  const chairPositions = [
    { x: tx + tableW / 3, y: ty - chairSize - 4 },
    { x: tx + tableW * 2 / 3, y: ty - chairSize - 4 },
    { x: tx + tableW / 3, y: ty + tableH + 4 },
    { x: tx + tableW * 2 / 3, y: ty + tableH + 4 },
    { x: tx - chairSize - 4, y: ty + tableH / 2 },
    { x: tx + tableW + 4, y: ty + tableH / 2 },
  ]

  chairPositions.forEach(pos => {
    ctx.beginPath()
    ctx.roundRect(pos.x - chairSize / 2, pos.y - chairSize / 2, chairSize, chairSize, 2)
    ctx.fill()
    ctx.stroke()
  })
}

const drawSofa = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const sofaW = Math.min(w * 0.65, 80)
  const sofaH = 28
  const sx = x + (w - sofaW) / 2
  const sy = y + h * 0.5

  // Main sofa body (L-shape or straight)
  ctx.beginPath()
  ctx.roundRect(sx, sy, sofaW, sofaH, 3)
  ctx.fill()
  ctx.stroke()

  // Back cushion line
  ctx.beginPath()
  ctx.moveTo(sx + 3, sy + 6)
  ctx.lineTo(sx + sofaW - 3, sy + 6)
  ctx.stroke()

  // Armrests
  ctx.beginPath()
  ctx.roundRect(sx - 5, sy + 2, 5, sofaH - 4, 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.roundRect(sx + sofaW, sy + 2, 5, sofaH - 4, 2)
  ctx.fill()
  ctx.stroke()

  // Coffee table in front
  const tableW = sofaW * 0.45
  const tableH = 20
  ctx.beginPath()
  ctx.roundRect(sx + (sofaW - tableW) / 2, sy - tableH - 12, tableW, tableH, 2)
  ctx.fill()
  ctx.stroke()

  // TV/entertainment center
  ctx.beginPath()
  ctx.rect(sx + sofaW * 0.15, sy + sofaH + 30, sofaW * 0.7, 8)
  ctx.fill()
  ctx.stroke()
}

const drawDesk = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  ctx.fillStyle = '#fff'

  const deskW = Math.min(w * 0.55, 50)
  const deskH = 22
  const dx = x + (w - deskW) / 2
  const dy = y + h * 0.25

  // Desk
  ctx.beginPath()
  ctx.rect(dx, dy, deskW, deskH)
  ctx.fill()
  ctx.stroke()

  // Computer monitor
  ctx.beginPath()
  ctx.rect(dx + deskW / 2 - 12, dy + 3, 24, 15)
  ctx.stroke()

  // Chair (circular)
  ctx.beginPath()
  ctx.arc(dx + deskW / 2, dy + deskH + 18, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Chair back (arc)
  ctx.beginPath()
  ctx.arc(dx + deskW / 2, dy + deskH + 18, 10, -Math.PI * 0.3, Math.PI * 0.3)
  ctx.stroke()

  // Bookshelf on side
  ctx.beginPath()
  ctx.rect(dx - 20, dy, 15, 35)
  ctx.fill()
  ctx.stroke()
  // Shelf lines
  ctx.beginPath()
  ctx.moveTo(dx - 20, dy + 12)
  ctx.lineTo(dx - 5, dy + 12)
  ctx.moveTo(dx - 20, dy + 24)
  ctx.lineTo(dx - 5, dy + 24)
  ctx.stroke()
}

// Porch/Entrance area
const drawPorch = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1

  // Steps pattern
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.rect(x + 10, y + h - 25 + i * 8, w - 20, 6)
    ctx.stroke()
  }

  // Railing posts
  ctx.beginPath()
  ctx.rect(x + 10, y + 10, 4, h - 40)
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(x + w - 14, y + 10, 4, h - 40)
  ctx.stroke()
}

// Helper: Get door position on wall
const getDoorPosition = (room: Room, door: DoorElement): { x: number; y: number; rotation: number } => {
  const wallLength = door.wall === 'north' || door.wall === 'south' ? room.width : room.height
  const pos = door.position * wallLength

  switch (door.wall) {
    case 'north':
      return { x: pos - door.width / 2, y: -2, rotation: 0 }
    case 'south':
      return { x: pos - door.width / 2, y: room.height - 2, rotation: 180 }
    case 'east':
      return { x: room.width - 2, y: pos - door.width / 2, rotation: 90 }
    case 'west':
      return { x: -2, y: pos - door.width / 2, rotation: 270 }
    default:
      return { x: 0, y: 0, rotation: 0 }
  }
}

// Helper: Get window position on wall
const getWindowPosition = (room: Room, window: WindowElement): { x: number; y: number; isHorizontal: boolean } => {
  const wallLength = window.wall === 'north' || window.wall === 'south' ? room.width : room.height
  const pos = window.position * wallLength

  switch (window.wall) {
    case 'north':
      return { x: pos - window.width / 2, y: -2, isHorizontal: true }
    case 'south':
      return { x: pos - window.width / 2, y: room.height - 2, isHorizontal: true }
    case 'east':
      return { x: room.width - 2, y: pos - window.width / 2, isHorizontal: false }
    case 'west':
      return { x: -2, y: pos - window.width / 2, isHorizontal: false }
    default:
      return { x: 0, y: 0, isHorizontal: true }
  }
}

interface Canvas2DProps {
  width?: number
  height?: number
}

export const Canvas2D = forwardRef<Canvas2DHandle, Canvas2DProps>(function Canvas2D({ width = 1200, height = 800 }, ref) {
  const stageRef = useRef<Konva.Stage>(null)

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType = 'image/png', quality = 1) => {
      if (stageRef.current) {
        return stageRef.current.toDataURL({
          mimeType,
          quality,
          pixelRatio: 2
        })
      }
      return null
    },
    getStage: () => stageRef.current
  }))
  const transformerRef = useRef<Konva.Transformer>(null)
  const [stageSize, setStageSize] = useState({ width, height })
  const containerRef = useRef<HTMLDivElement>(null)
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })
  const [newTextValue, setNewTextValue] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)

  const {
    floorPlan,
    selectedFloorId,
    selectedRoomId,
    selectedElementId,
    selectedElementType,
    currentTool,
    zoom,
    showGrid,
    showLabels,
    scale,
    gridSnap,
    setZoom,
    selectRoom,
    selectElement,
    moveRoom,
    resizeRoom,
    addDoor,
    updateDoor,
    addWindow,
    updateWindow,
    addFurniture,
    updateFurniture,
    pendingFurnitureType,
    setPendingFurnitureType,
    setCurrentTool,
    toggleShowGrid,
    addText,
    updateText,
    selectText,
    selectedTextId,
  } = useEditorStore()

  // Get current floor's rooms and texts
  const currentFloor = floorPlan?.floors.find((f) => f.id === selectedFloorId)
  const rooms = currentFloor?.rooms || []
  const texts = currentFloor?.texts || []

  // Calculate shared walls and building bounds
  const sharedWalls = useMemo(() => getSharedWalls(rooms), [rooms])
  const buildingBounds = useMemo(() => getBuildingBounds(rooms), [rooms])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#room-${selectedRoomId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      } else {
        transformerRef.current.nodes([])
      }
    }
  }, [selectedRoomId])

  // Handle room drag
  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>, roomId: string) => {
      if (!selectedFloorId) return
      const node = e.target
      moveRoom(selectedFloorId, roomId, node.x(), node.y())
    },
    [selectedFloorId, moveRoom]
  )

  // Handle room transform (resize)
  const handleTransformEnd = useCallback(
    (e: KonvaEventObject<Event>, roomId: string) => {
      if (!selectedFloorId) return
      const node = e.target
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      node.scaleX(1)
      node.scaleY(1)

      const newWidth = Math.max(30, node.width() * scaleX)
      const newHeight = Math.max(30, node.height() * scaleY)

      resizeRoom(selectedFloorId, roomId, newWidth, newHeight)
      moveRoom(selectedFloorId, roomId, node.x(), node.y())
    },
    [selectedFloorId, resizeRoom, moveRoom]
  )

  // Handle stage click (deselect or add text)
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      if (e.target === stage) {
        if (currentTool === 'text' && selectedFloorId) {
          // Get click position for text placement
          const pos = stage?.getPointerPosition()
          if (pos) {
            const stagePos = stage.position()
            const x = (pos.x - stagePos.x) / (zoom / 100)
            const y = (pos.y - stagePos.y) / (zoom / 100)
            setTextInputPos({ x, y, show: true })
            setNewTextValue('')
            setTimeout(() => textInputRef.current?.focus(), 50)
          }
        } else {
          selectRoom(null)
          selectText(null)
        }
      }
    },
    [selectRoom, selectText, currentTool, selectedFloorId, zoom]
  )

  // Handle stage tap (deselect) - for touch events
  const handleStageTap = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      if (e.target === e.target.getStage()) {
        selectRoom(null)
      }
    },
    [selectRoom]
  )

  // Handle zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const scaleBy = 1.05
      const newZoom = e.evt.deltaY > 0 ? zoom / scaleBy : zoom * scaleBy
      setZoom(Math.round(newZoom))
    },
    [zoom, setZoom]
  )

  // Handle text submission
  const handleTextSubmit = useCallback(() => {
    if (newTextValue.trim() && selectedFloorId && textInputPos.show) {
      addText(selectedFloorId, {
        text: newTextValue.trim(),
        x: textInputPos.x,
        y: textInputPos.y,
        fontSize: 14,
        fontStyle: 'normal',
        fill: '#333333',
        rotation: 0,
      })
      setTextInputPos({ x: 0, y: 0, show: false })
      setNewTextValue('')
      setCurrentTool('select')
    }
  }, [newTextValue, selectedFloorId, textInputPos, addText, setCurrentTool])

  // Handle text input key press
  const handleTextKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextSubmit()
    } else if (e.key === 'Escape') {
      setTextInputPos({ x: 0, y: 0, show: false })
      setNewTextValue('')
    }
  }, [handleTextSubmit])

  // Generate grid lines
  const gridLines = []
  const gridSize = 25
  const gridWidth = 3000
  const gridHeight = 2000

  if (showGrid) {
    for (let i = 0; i <= gridWidth / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, gridHeight]}
          stroke="#E5E7EB"
          strokeWidth={i % 4 === 0 ? 0.8 : 0.3}
        />
      )
    }
    for (let i = 0; i <= gridHeight / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, gridWidth, i * gridSize]}
          stroke="#E5E7EB"
          strokeWidth={i % 4 === 0 ? 0.8 : 0.3}
        />
      )
    }
  }

  // Calculate drag bounds with snap
  const getDragBound = useCallback(
    (pos: { x: number; y: number }) => {
      const snapValue = gridSnap ? 10 : 1
      return {
        x: Math.round(pos.x / snapValue) * snapValue,
        y: Math.round(pos.y / snapValue) * snapValue,
      }
    },
    [gridSnap]
  )

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-white">
      {/* Zoom Controls */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 bg-background border border-border rounded-lg shadow-lg p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(zoom + 10)}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-xs font-medium text-center px-2">{zoom}%</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(zoom - 10)}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(100)}
          className="h-8 w-8 p-0"
        >
          <Maximize className="w-4 h-4" />
        </Button>
        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleShowGrid}
          className="h-8 w-8 p-0"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Floor indicator */}
      {currentFloor && (
        <div className="absolute left-4 top-4 z-10 bg-background border border-border rounded-lg shadow-lg px-3 py-2">
          <span className="text-sm font-medium">{currentFloor.level}</span>
          {currentFloor.totalArea && (
            <span className="text-xs text-muted-foreground ml-2">
              ({currentFloor.totalArea} sq ft)
            </span>
          )}
        </div>
      )}

      {/* Compass */}
      {rooms.length > 0 && (
        <div className="absolute left-4 bottom-4 z-10">
          <div className="w-10 h-10 border border-gray-400 rounded-full bg-white flex items-center justify-center relative">
            <div className="absolute -top-4 text-xs font-bold text-gray-600">N</div>
            <div className="w-px h-6 bg-gray-400"></div>
            <div className="absolute w-6 h-px bg-gray-400"></div>
          </div>
        </div>
      )}

      {/* Tool indicator when door/window tool is active */}
      {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && rooms.length > 0 && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Click on any wall to add a {currentTool.replace('-', ' ')}
          </p>
        </div>
      )}

      {/* Furniture placement indicator */}
      {currentTool === 'furniture' && pendingFurnitureType && rooms.length > 0 && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Click inside a room to place {pendingFurnitureType}
          </p>
        </div>
      )}

      {/* Text tool indicator */}
      {currentTool === 'text' && selectedFloorId && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Click anywhere to add a text label
          </p>
        </div>
      )}

      {/* Text input box */}
      {textInputPos.show && (
        <div
          className="absolute z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-2"
          style={{
            left: textInputPos.x * (zoom / 100) + 10,
            top: textInputPos.y * (zoom / 100) + 10,
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={newTextValue}
            onChange={(e) => setNewTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            onBlur={() => {
              if (newTextValue.trim()) {
                handleTextSubmit()
              } else {
                setTextInputPos({ x: 0, y: 0, show: false })
              }
            }}
            placeholder="Enter label text..."
            className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ minWidth: 150 }}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleTextSubmit}
              className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
            >
              Add
            </button>
            <button
              onClick={() => {
                setTextInputPos({ x: 0, y: 0, show: false })
                setNewTextValue('')
              }}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom / 100}
        scaleY={zoom / 100}
        draggable={currentTool === 'select'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageTap}
        style={{ cursor: (currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door' || currentTool === 'furniture' || currentTool === 'text') ? 'crosshair' : 'default' }}
      >
        {/* Background */}
        <Layer>
          <Rect x={0} y={0} width={gridWidth} height={gridHeight} fill="#FAFBFC" />
        </Layer>

        {/* Grid Layer */}
        <Layer>{gridLines}</Layer>

        {/* Rooms Layer */}
        <Layer>
          {/* Building shadow for connected rooms */}
          {rooms.length > 0 && (
            <Rect
              x={buildingBounds.minX + 8}
              y={buildingBounds.minY + 8}
              width={buildingBounds.width}
              height={buildingBounds.height}
              fill="rgba(0, 0, 0, 0.08)"
              cornerRadius={2}
            />
          )}

          {rooms.map((room) => {
            const roomColor = room.color || getRoomColor(room.name)
            const isSelected = selectedRoomId === room.id
            const exteriorWallColor = '#2C3E50'
            const interiorWallColor = '#5D6D7E'
            const roomSharedWalls = sharedWalls.get(room.id) || []

            // Determine which walls are exterior (not shared)
            const hasNorthShared = roomSharedWalls.some(w => w.wall === 'north')
            const hasSouthShared = roomSharedWalls.some(w => w.wall === 'south')
            const hasEastShared = roomSharedWalls.some(w => w.wall === 'east')
            const hasWestShared = roomSharedWalls.some(w => w.wall === 'west')

            return (
              <Group
                key={room.id}
                id={`room-${room.id}`}
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                rotation={room.rotation}
                draggable={currentTool === 'select'}
                dragBoundFunc={getDragBound}
                onDragEnd={(e) => handleDragEnd(e, room.id)}
                onTransformEnd={(e) => handleTransformEnd(e, room.id)}
                onClick={(e) => {
                  // Select room if using select tool
                  if (currentTool === 'select') {
                    selectRoom(room.id)
                  }
                  // Place furniture if using furniture tool
                  if (currentTool === 'furniture' && pendingFurnitureType && selectedFloorId) {
                    e.cancelBubble = true
                    const stage = e.target.getStage()
                    if (!stage) return
                    const pos = stage.getPointerPosition()
                    if (!pos) return
                    const stagePos = stage.position()
                    const localX = ((pos.x - stagePos.x) / (zoom / 100)) - room.x
                    const localY = ((pos.y - stagePos.y) / (zoom / 100)) - room.y

                    // Get default size for furniture type
                    const furnitureSizes: Record<string, { width: number; height: number }> = {
                      bed: { width: 60, height: 75 },
                      sofa: { width: 80, height: 35 },
                      table: { width: 60, height: 40 },
                      chair: { width: 20, height: 20 },
                      desk: { width: 50, height: 28 },
                      cabinet: { width: 40, height: 25 },
                      wardrobe: { width: 45, height: 25 },
                      toilet: { width: 24, height: 30 },
                      sink: { width: 35, height: 25 },
                      bathtub: { width: 65, height: 30 },
                      shower: { width: 40, height: 40 },
                      stove: { width: 30, height: 30 },
                      fridge: { width: 35, height: 45 },
                    }
                    const size = furnitureSizes[pendingFurnitureType] || { width: 30, height: 30 }

                    addFurniture(selectedFloorId, room.id, {
                      type: pendingFurnitureType,
                      x: Math.max(0, Math.min(room.width - size.width, localX - size.width / 2)),
                      y: Math.max(0, Math.min(room.height - size.height, localY - size.height / 2)),
                      width: size.width,
                      height: size.height,
                      rotation: 0,
                    })
                    setCurrentTool('select')
                    setPendingFurnitureType(null)
                  }
                }}
                onTap={(e) => {
                  // Only select room if using select tool
                  if (currentTool === 'select') {
                    selectRoom(room.id)
                  }
                }}
              >
                {/* Room fill - listen for furniture placement too */}
                <Rect
                  width={room.width}
                  height={room.height}
                  fill={roomColor}
                  listening={currentTool === 'select' || currentTool === 'furniture'}
                />

                {/* Draw individual walls with proper thickness */}
                {/* North wall line */}
                <Line
                  points={[0, 0, room.width, 0]}
                  stroke={isSelected ? '#3b82f6' : (hasNorthShared ? interiorWallColor : exteriorWallColor)}
                  strokeWidth={isSelected ? 4 : (hasNorthShared ? 2 : 5)}
                  listening={false}
                />
                {/* North wall clickable area for door/window placement */}
                {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && (
                  <Rect
                    x={0}
                    y={-8}
                    width={room.width}
                    height={16}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth={1}
                    dash={[4, 4]}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'crosshair'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.3)')
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.1)')
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true
                      if (!selectedFloorId) return
                      const stage = e.target.getStage()
                      if (!stage) return
                      const pos = stage.getPointerPosition()
                      if (!pos) return
                      const stagePos = stage.position()
                      const localX = ((pos.x - stagePos.x) / (zoom / 100)) - room.x
                      const wallPos = Math.max(0.1, Math.min(0.9, localX / room.width))

                      if (currentTool === 'door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'north',
                          position: wallPos,
                          width: 30,
                          type: 'single',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'double-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'north',
                          position: wallPos,
                          width: 50,
                          type: 'double',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'sliding-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'north',
                          position: wallPos,
                          width: 60,
                          type: 'sliding'
                        })
                      } else if (currentTool === 'window') {
                        addWindow(selectedFloorId, room.id, {
                          wall: 'north',
                          position: wallPos,
                          width: 36,
                          type: 'double'
                        })
                      }
                      setCurrentTool('select')
                    }}
                  />
                )}

                {/* South wall line */}
                <Line
                  points={[0, room.height, room.width, room.height]}
                  stroke={isSelected ? '#3b82f6' : (hasSouthShared ? interiorWallColor : exteriorWallColor)}
                  strokeWidth={isSelected ? 4 : (hasSouthShared ? 2 : 5)}
                  listening={false}
                />
                {/* South wall clickable area */}
                {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && (
                  <Rect
                    x={0}
                    y={room.height - 8}
                    width={room.width}
                    height={16}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth={1}
                    dash={[4, 4]}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'crosshair'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.3)')
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.1)')
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true
                      if (!selectedFloorId) return
                      const stage = e.target.getStage()
                      if (!stage) return
                      const pos = stage.getPointerPosition()
                      if (!pos) return
                      const stagePos = stage.position()
                      const localX = ((pos.x - stagePos.x) / (zoom / 100)) - room.x
                      const wallPos = Math.max(0.1, Math.min(0.9, localX / room.width))

                      if (currentTool === 'door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'south',
                          position: wallPos,
                          width: 30,
                          type: 'single',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'double-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'south',
                          position: wallPos,
                          width: 50,
                          type: 'double',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'sliding-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'south',
                          position: wallPos,
                          width: 60,
                          type: 'sliding'
                        })
                      } else if (currentTool === 'window') {
                        addWindow(selectedFloorId, room.id, {
                          wall: 'south',
                          position: wallPos,
                          width: 36,
                          type: 'double'
                        })
                      }
                      setCurrentTool('select')
                    }}
                  />
                )}

                {/* West wall line */}
                <Line
                  points={[0, 0, 0, room.height]}
                  stroke={isSelected ? '#3b82f6' : (hasWestShared ? interiorWallColor : exteriorWallColor)}
                  strokeWidth={isSelected ? 4 : (hasWestShared ? 2 : 5)}
                  listening={false}
                />
                {/* West wall clickable area */}
                {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && (
                  <Rect
                    x={-8}
                    y={0}
                    width={16}
                    height={room.height}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth={1}
                    dash={[4, 4]}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'crosshair'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.3)')
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.1)')
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true
                      if (!selectedFloorId) return
                      const stage = e.target.getStage()
                      if (!stage) return
                      const pos = stage.getPointerPosition()
                      if (!pos) return
                      const stagePos = stage.position()
                      const localY = ((pos.y - stagePos.y) / (zoom / 100)) - room.y
                      const wallPos = Math.max(0.1, Math.min(0.9, localY / room.height))

                      if (currentTool === 'door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'west',
                          position: wallPos,
                          width: 30,
                          type: 'single',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'double-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'west',
                          position: wallPos,
                          width: 50,
                          type: 'double',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'sliding-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'west',
                          position: wallPos,
                          width: 60,
                          type: 'sliding'
                        })
                      } else if (currentTool === 'window') {
                        addWindow(selectedFloorId, room.id, {
                          wall: 'west',
                          position: wallPos,
                          width: 36,
                          type: 'double'
                        })
                      }
                      setCurrentTool('select')
                    }}
                  />
                )}

                {/* East wall line */}
                <Line
                  points={[room.width, 0, room.width, room.height]}
                  stroke={isSelected ? '#3b82f6' : (hasEastShared ? interiorWallColor : exteriorWallColor)}
                  strokeWidth={isSelected ? 4 : (hasEastShared ? 2 : 5)}
                  listening={false}
                />
                {/* East wall clickable area */}
                {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && (
                  <Rect
                    x={room.width - 8}
                    y={0}
                    width={16}
                    height={room.height}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth={1}
                    dash={[4, 4]}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'crosshair'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.3)')
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                      const shape = e.target as Konva.Shape; shape.fill('rgba(59, 130, 246, 0.1)')
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true
                      if (!selectedFloorId) return
                      const stage = e.target.getStage()
                      if (!stage) return
                      const pos = stage.getPointerPosition()
                      if (!pos) return
                      const stagePos = stage.position()
                      const localY = ((pos.y - stagePos.y) / (zoom / 100)) - room.y
                      const wallPos = Math.max(0.1, Math.min(0.9, localY / room.height))

                      if (currentTool === 'door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'east',
                          position: wallPos,
                          width: 30,
                          type: 'single',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'double-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'east',
                          position: wallPos,
                          width: 50,
                          type: 'double',
                          swingDirection: 'inward',
                          swingSide: 'right'
                        })
                      } else if (currentTool === 'sliding-door') {
                        addDoor(selectedFloorId, room.id, {
                          wall: 'east',
                          position: wallPos,
                          width: 60,
                          type: 'sliding'
                        })
                      } else if (currentTool === 'window') {
                        addWindow(selectedFloorId, room.id, {
                          wall: 'east',
                          position: wallPos,
                          width: 36,
                          type: 'double'
                        })
                      }
                      setCurrentTool('select')
                    }}
                  />
                )}

                {/* Furniture */}
                <Shape
                  sceneFunc={(context, shape) => {
                    const ctx = context._context as CanvasRenderingContext2D
                    const roomType = room.name.toLowerCase()
                    const rx = room.x
                    const ry = room.y

                    // Draw furniture based on room type
                    if (roomType.includes('master') || roomType.includes('bedroom')) {
                      drawBed(ctx, rx, ry, room.width, room.height, roomType.includes('master'))
                      drawWardrobe(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('bathroom') || roomType.includes('en-suite')) {
                      drawToilet(ctx, rx, ry, room.width, room.height)
                      drawSink(ctx, rx, ry, room.width, room.height)
                      if (room.width > 70 && room.height > 70) {
                        if (roomType.includes('en-suite')) {
                          drawShower(ctx, rx, ry, room.width, room.height)
                        } else {
                          drawBathtub(ctx, rx, ry, room.width, room.height)
                        }
                      }
                    } else if (roomType.includes('toilet')) {
                      drawToilet(ctx, rx, ry, room.width, room.height)
                      drawSink(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('kitchen')) {
                      drawKitchenCounter(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('dining')) {
                      drawDiningTable(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('living')) {
                      drawSofa(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('office') || roomType.includes('study')) {
                      drawDesk(ctx, rx, ry, room.width, room.height)
                    } else if (roomType.includes('porch') || roomType.includes('entrance') || roomType.includes('foyer')) {
                      drawPorch(ctx, rx, ry, room.width, room.height)
                    }

                    context.fillStrokeShape(shape)
                  }}
                  x={-room.x}
                  y={-room.y}
                />

                {/* Doors */}
                {(room.doors || []).map((door) => {
                  const doorPos = getDoorPosition(room, door)
                  const isHorizontal = door.wall === 'north' || door.wall === 'south'
                  const isDoorSelected = selectedElementId === door.id && selectedElementType === 'door'
                  const doorColor = isDoorSelected ? '#3b82f6' : '#8B4513'
                  const arcRadius = door.width * 0.8

                  // Calculate swing arc position based on door wall and swing direction
                  let arcX = 0, arcY = 0, arcRotation = 0
                  const swingInward = door.swingDirection === 'inward'
                  const swingLeft = door.swingSide === 'left'

                  if (isHorizontal) {
                    arcX = swingLeft ? 0 : door.width
                    arcY = door.wall === 'north' ? (swingInward ? 4 : 0) : (swingInward ? 0 : 4)
                    if (door.wall === 'north') {
                      arcRotation = swingInward ? (swingLeft ? 0 : 270) : (swingLeft ? 90 : 180)
                    } else {
                      arcRotation = swingInward ? (swingLeft ? 270 : 180) : (swingLeft ? 0 : 90)
                    }
                  } else {
                    arcX = door.wall === 'east' ? (swingInward ? 0 : 4) : (swingInward ? 4 : 0)
                    arcY = swingLeft ? 0 : door.width
                    if (door.wall === 'east') {
                      arcRotation = swingInward ? (swingLeft ? 270 : 180) : (swingLeft ? 0 : 90)
                    } else {
                      arcRotation = swingInward ? (swingLeft ? 0 : 90) : (swingLeft ? 180 : 270)
                    }
                  }

                  return (
                    <Group
                      key={door.id}
                      x={doorPos.x}
                      y={doorPos.y}
                      onClick={(e) => {
                        e.cancelBubble = true
                        selectElement(door.id, 'door')
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true
                        selectElement(door.id, 'door')
                      }}
                      draggable={isDoorSelected}
                      onDragEnd={(e) => {
                        if (!selectedFloorId) return
                        const node = e.target
                        const wallLength = isHorizontal ? room.width : room.height
                        let newPos: number
                        if (isHorizontal) {
                          newPos = Math.max(0.1, Math.min(0.9, (node.x() + door.width / 2) / wallLength))
                        } else {
                          newPos = Math.max(0.1, Math.min(0.9, (node.y() + door.width / 2) / wallLength))
                        }
                        updateDoor(selectedFloorId, room.id, door.id, { position: newPos })
                      }}
                    >
                      {/* Door frame background (gap in wall) */}
                      <Rect
                        width={isHorizontal ? door.width : 6}
                        height={isHorizontal ? 6 : door.width}
                        fill={roomColor}
                        stroke="none"
                      />
                      {/* Door leaf */}
                      <Line
                        points={isHorizontal ? [0, 2, door.width, 2] : [2, 0, 2, door.width]}
                        stroke={doorColor}
                        strokeWidth={isDoorSelected ? 4 : 3}
                      />
                      {/* Door swing arc */}
                      <Arc
                        x={arcX}
                        y={arcY}
                        innerRadius={0}
                        outerRadius={arcRadius}
                        angle={90}
                        rotation={arcRotation}
                        stroke={doorColor}
                        strokeWidth={1}
                        dash={[3, 3]}
                      />
                    </Group>
                  )
                })}

                {/* Windows */}
                {(room.windows || []).map((window) => {
                  const windowPos = getWindowPosition(room, window)
                  const isWindowSelected = selectedElementId === window.id && selectedElementType === 'window'
                  const windowColor = isWindowSelected ? '#3b82f6' : '#4A90D9'
                  const isHorizontal = windowPos.isHorizontal

                  return (
                    <Group
                      key={window.id}
                      x={windowPos.x}
                      y={windowPos.y}
                      onClick={(e) => {
                        e.cancelBubble = true
                        selectElement(window.id, 'window')
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true
                        selectElement(window.id, 'window')
                      }}
                      draggable={isWindowSelected}
                      onDragEnd={(e) => {
                        if (!selectedFloorId) return
                        const node = e.target
                        const wallLength = isHorizontal ? room.width : room.height
                        let newPos: number
                        if (isHorizontal) {
                          newPos = Math.max(0.1, Math.min(0.9, (node.x() + window.width / 2) / wallLength))
                        } else {
                          newPos = Math.max(0.1, Math.min(0.9, (node.y() + window.width / 2) / wallLength))
                        }
                        updateWindow(selectedFloorId, room.id, window.id, { position: newPos })
                      }}
                    >
                      {/* Window frame background (gap in wall) */}
                      <Rect
                        width={isHorizontal ? window.width : 6}
                        height={isHorizontal ? 6 : window.width}
                        fill="#E8F4FD"
                        stroke={windowColor}
                        strokeWidth={isWindowSelected ? 2 : 1}
                      />
                      {/* Window center line (double pane indicator) */}
                      <Line
                        points={isHorizontal
                          ? [window.width / 2, 0, window.width / 2, 6]
                          : [0, window.width / 2, 6, window.width / 2]
                        }
                        stroke={windowColor}
                        strokeWidth={1}
                      />
                      {/* Window glass lines */}
                      {window.type !== 'single' && (
                        <>
                          <Line
                            points={isHorizontal
                              ? [window.width / 4, 1, window.width / 4, 5]
                              : [1, window.width / 4, 5, window.width / 4]
                            }
                            stroke={windowColor}
                            strokeWidth={0.5}
                          />
                          <Line
                            points={isHorizontal
                              ? [window.width * 3 / 4, 1, window.width * 3 / 4, 5]
                              : [1, window.width * 3 / 4, 5, window.width * 3 / 4]
                            }
                            stroke={windowColor}
                            strokeWidth={0.5}
                          />
                        </>
                      )}
                    </Group>
                  )
                })}

                {/* Legacy door arc for backward compatibility - draw on shared walls if no explicit doors */}
                {(!room.doors || room.doors.length === 0) && hasSouthShared && (
                  <Arc
                    x={room.width / 2 - 12}
                    y={room.height}
                    innerRadius={0}
                    outerRadius={22}
                    angle={90}
                    rotation={180}
                    stroke="#666"
                    strokeWidth={1}
                  />
                )}
                {(!room.doors || room.doors.length === 0) && !hasSouthShared && hasEastShared && (
                  <Arc
                    x={room.width}
                    y={room.height / 2}
                    innerRadius={0}
                    outerRadius={22}
                    angle={90}
                    rotation={90}
                    stroke="#666"
                    strokeWidth={1}
                  />
                )}

                {/* Room Label */}
                {showLabels && (
                  <>
                    <Text
                      text={room.name}
                      x={0}
                      y={room.height / 2 - 14}
                      width={room.width}
                      fontSize={11}
                      fontStyle="bold"
                      fill="#333"
                      align="center"
                    />
                    <Text
                      text={`${room.areaSqft} sq ft`}
                      x={0}
                      y={room.height / 2}
                      width={room.width}
                      fontSize={10}
                      fill="#666"
                      align="center"
                    />
                  </>
                )}

                {/* Dimension labels when selected */}
                {showLabels && isSelected && (
                  <>
                    <Text
                      text={`${(room.width / scale).toFixed(1)} ft`}
                      x={room.width / 2 - 25}
                      y={room.height + 12}
                      fontSize={11}
                      fill="#3b82f6"
                      fontStyle="bold"
                    />
                    <Text
                      text={`${room.length.toFixed(1)} ft`}
                      x={room.width + 12}
                      y={room.height / 2 - 6}
                      fontSize={11}
                      fill="#3b82f6"
                      fontStyle="bold"
                    />
                  </>
                )}
              </Group>
            )
          })}

          {/* Text labels */}
          {texts.map((textEl) => {
            const isSelected = selectedTextId === textEl.id
            return (
              <Text
                key={textEl.id}
                id={`text-${textEl.id}`}
                x={textEl.x}
                y={textEl.y}
                text={textEl.text}
                fontSize={textEl.fontSize}
                fontStyle={textEl.fontStyle === 'bold' ? 'bold' : textEl.fontStyle === 'italic' ? 'italic' : 'normal'}
                fill={isSelected ? '#3b82f6' : textEl.fill}
                rotation={textEl.rotation}
                draggable={currentTool === 'select'}
                onClick={(e) => {
                  e.cancelBubble = true
                  selectText(textEl.id)
                }}
                onTap={(e) => {
                  e.cancelBubble = true
                  selectText(textEl.id)
                }}
                onDragEnd={(e) => {
                  if (!selectedFloorId) return
                  const node = e.target
                  updateText(selectedFloorId, textEl.id, {
                    x: node.x(),
                    y: node.y(),
                  })
                }}
                onDblClick={() => {
                  // Double click to edit text
                  setTextInputPos({ x: textEl.x, y: textEl.y, show: true })
                  setNewTextValue(textEl.text)
                  setTimeout(() => textInputRef.current?.focus(), 50)
                }}
              />
            )
          })}

          {/* Transformer for resize */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 30 || newBox.height < 30) {
                return oldBox
              }
              return newBox
            }}
            rotateEnabled={true}
            keepRatio={false}
            anchorSize={8}
            anchorCornerRadius={4}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
          />
        </Layer>
      </Stage>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No floor plan loaded</p>
            <p className="text-sm">Generate a plan or load one to start editing</p>
          </div>
        </div>
      )}
    </div>
  )
})
