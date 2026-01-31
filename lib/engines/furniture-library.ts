/**
 * Furniture Library
 * SVG-based furniture icons for professional floor plan rendering
 */

export interface FurnitureItem {
  id: string
  name: string
  category: 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'dining' | 'office' | 'other'
  defaultWidth: number // in feet
  defaultHeight: number // in feet
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, scale: number) => void
}

// Furniture drawing functions
export const furnitureLibrary: Record<string, FurnitureItem> = {
  // BEDROOM FURNITURE
  singleBed: {
    id: 'singleBed',
    name: 'Single Bed',
    category: 'bedroom',
    defaultWidth: 3.5,
    defaultHeight: 7,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Bed frame outline
      ctx.strokeRect(sx, sy, sw, sh)

      // Headboard
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx, sy + sh * 0.08)
      ctx.lineTo(sx + sw, sy + sh * 0.08)
      ctx.stroke()

      // Pillow outline
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(sx + 4, sy + sh * 0.12, sw - 8, sh * 0.12, 2)
      ctx.stroke()

      // Blanket fold line
      ctx.beginPath()
      ctx.moveTo(sx + 2, sy + sh * 0.32)
      ctx.lineTo(sx + sw - 2, sy + sh * 0.32)
      ctx.stroke()

      // Footboard
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx, sy + sh - 4)
      ctx.lineTo(sx + sw, sy + sh - 4)
      ctx.stroke()
    },
  },

  doubleBed: {
    id: 'doubleBed',
    name: 'Double Bed',
    category: 'bedroom',
    defaultWidth: 5,
    defaultHeight: 7,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Bed frame outline
      ctx.strokeRect(sx, sy, sw, sh)

      // Headboard
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx, sy + sh * 0.1)
      ctx.lineTo(sx + sw, sy + sh * 0.1)
      ctx.stroke()

      // Two pillows
      const pillowWidth = (sw - 12) / 2
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(sx + 4, sy + sh * 0.14, pillowWidth, sh * 0.1, 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.roundRect(sx + 8 + pillowWidth, sy + sh * 0.14, pillowWidth, sh * 0.1, 2)
      ctx.stroke()

      // Blanket fold line
      ctx.beginPath()
      ctx.moveTo(sx + 2, sy + sh * 0.32)
      ctx.lineTo(sx + sw - 2, sy + sh * 0.32)
      ctx.stroke()

      // Footboard
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx, sy + sh - 4)
      ctx.lineTo(sx + sw, sy + sh - 4)
      ctx.stroke()
    },
  },

  wardrobe: {
    id: 'wardrobe',
    name: 'Wardrobe',
    category: 'bedroom',
    defaultWidth: 6,
    defaultHeight: 2,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Outer frame
      ctx.fillStyle = '#d4a574'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.strokeStyle = '#8b6914'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy, sw, sh)

      // Door divisions
      const doors = 3
      const doorWidth = sw / doors
      for (let i = 1; i < doors; i++) {
        ctx.beginPath()
        ctx.moveTo(sx + i * doorWidth, sy)
        ctx.lineTo(sx + i * doorWidth, sy + sh)
        ctx.strokeStyle = '#8b6914'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Door handles
      for (let i = 0; i < doors; i++) {
        ctx.fillStyle = '#666'
        ctx.fillRect(sx + (i + 0.5) * doorWidth - 2, sy + sh / 2 - 5, 4, 10)
      }
    },
  },

  // LIVING ROOM FURNITURE
  sofa3Seater: {
    id: 'sofa3Seater',
    name: '3-Seater Sofa',
    category: 'living',
    defaultWidth: 7,
    defaultHeight: 3,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Outer frame
      ctx.beginPath()
      ctx.roundRect(sx, sy, sw, sh, 4)
      ctx.fill()
      ctx.stroke()

      // Back rest line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx + 4, sy + sh * 0.25)
      ctx.lineTo(sx + sw - 4, sy + sh * 0.25)
      ctx.stroke()

      // Left armrest
      ctx.strokeRect(sx, sy + sh * 0.15, sw * 0.1, sh * 0.7)

      // Right armrest
      ctx.strokeRect(sx + sw - sw * 0.1, sy + sh * 0.15, sw * 0.1, sh * 0.7)

      // Seat cushion divisions (3 seats)
      const seatAreaWidth = sw - sw * 0.2
      const cushionWidth = seatAreaWidth / 3

      for (let i = 1; i < 3; i++) {
        const cx = sx + sw * 0.1 + i * cushionWidth
        ctx.beginPath()
        ctx.moveTo(cx, sy + sh * 0.3)
        ctx.lineTo(cx, sy + sh - 4)
        ctx.stroke()
      }
    },
  },

  coffeeTable: {
    id: 'coffeeTable',
    name: 'Coffee Table',
    category: 'living',
    defaultWidth: 4,
    defaultHeight: 2,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Table top
      ctx.fillStyle = '#d4a574'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.strokeStyle = '#8b6914'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy, sw, sh)

      // Inner rectangle
      ctx.strokeStyle = '#a0845c'
      ctx.lineWidth = 1
      ctx.strokeRect(sx + 5, sy + 5, sw - 10, sh - 10)
    },
  },

  tvUnit: {
    id: 'tvUnit',
    name: 'TV Unit',
    category: 'living',
    defaultWidth: 5,
    defaultHeight: 1.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Cabinet
      ctx.fillStyle = '#4a5568'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.strokeStyle = '#2d3748'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy, sw, sh)

      // TV
      ctx.fillStyle = '#1a202c'
      ctx.fillRect(sx + sw * 0.1, sy - sh * 0.6, sw * 0.8, sh * 0.5)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.strokeRect(sx + sw * 0.1, sy - sh * 0.6, sw * 0.8, sh * 0.5)
    },
  },

  // DINING FURNITURE
  diningTable6: {
    id: 'diningTable6',
    name: '6-Seater Dining Table',
    category: 'dining',
    defaultWidth: 6,
    defaultHeight: 3.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Table outline
      ctx.beginPath()
      ctx.roundRect(sx + sw * 0.15, sy + sh * 0.22, sw * 0.7, sh * 0.56, 2)
      ctx.fill()
      ctx.stroke()

      // Chairs - simple rectangles with backs
      const chairW = sw * 0.1
      const chairH = sh * 0.12

      ctx.lineWidth = 1

      // Top row chairs (3 chairs)
      for (let i = 0; i < 3; i++) {
        const cx = sx + sw * 0.22 + i * sw * 0.22
        // Chair seat
        ctx.strokeRect(cx, sy + sh * 0.08, chairW, chairH)
        // Chair back line
        ctx.beginPath()
        ctx.moveTo(cx + 2, sy + sh * 0.04)
        ctx.lineTo(cx + chairW - 2, sy + sh * 0.04)
        ctx.stroke()
      }

      // Bottom row chairs (3 chairs)
      for (let i = 0; i < 3; i++) {
        const cx = sx + sw * 0.22 + i * sw * 0.22
        // Chair seat
        ctx.strokeRect(cx, sy + sh - sh * 0.2, chairW, chairH)
        // Chair back line
        ctx.beginPath()
        ctx.moveTo(cx + 2, sy + sh - sh * 0.04)
        ctx.lineTo(cx + chairW - 2, sy + sh - sh * 0.04)
        ctx.stroke()
      }
    },
  },

  // KITCHEN FURNITURE
  kitchenCounter: {
    id: 'kitchenCounter',
    name: 'Kitchen Counter',
    category: 'kitchen',
    defaultWidth: 8,
    defaultHeight: 2,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Counter outline
      ctx.strokeRect(sx, sy, sw, sh)

      // Sink - double rectangle
      ctx.lineWidth = 1
      ctx.strokeRect(sx + sw * 0.35, sy + sh * 0.2, sw * 0.15, sh * 0.6)
      ctx.strokeRect(sx + sw * 0.36, sy + sh * 0.25, sw * 0.13, sh * 0.5)

      // Stove/hob outline
      const stoveX = sx + sw * 0.6
      const stoveY = sy + sh * 0.15
      const stoveW = sw * 0.25
      const stoveH = sh * 0.7
      ctx.strokeRect(stoveX, stoveY, stoveW, stoveH)

      // Burners - circles
      const burnerR = Math.min(stoveW, stoveH) * 0.12
      ctx.beginPath()
      ctx.arc(stoveX + stoveW * 0.3, stoveY + stoveH * 0.3, burnerR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(stoveX + stoveW * 0.7, stoveY + stoveH * 0.3, burnerR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(stoveX + stoveW * 0.3, stoveY + stoveH * 0.7, burnerR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(stoveX + stoveW * 0.7, stoveY + stoveH * 0.7, burnerR, 0, Math.PI * 2)
      ctx.stroke()
    },
  },

  refrigerator: {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: 'kitchen',
    defaultWidth: 3,
    defaultHeight: 2.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Main body
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.strokeStyle = '#718096'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy, sw, sh)

      // Freezer line
      ctx.beginPath()
      ctx.moveTo(sx, sy + sh * 0.3)
      ctx.lineTo(sx + sw, sy + sh * 0.3)
      ctx.strokeStyle = '#a0aec0'
      ctx.lineWidth = 1
      ctx.stroke()

      // Handles
      ctx.fillStyle = '#4a5568'
      ctx.fillRect(sx + sw - 8, sy + sh * 0.1, 4, sh * 0.15)
      ctx.fillRect(sx + sw - 8, sy + sh * 0.4, 4, sh * 0.2)
    },
  },

  // BATHROOM FURNITURE
  toilet: {
    id: 'toilet',
    name: 'Toilet',
    category: 'bathroom',
    defaultWidth: 1.5,
    defaultHeight: 2.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1

      // Tank
      ctx.strokeRect(sx + sw * 0.1, sy, sw * 0.8, sh * 0.25)

      // Bowl (oval)
      ctx.beginPath()
      ctx.ellipse(sx + sw / 2, sy + sh * 0.6, sw * 0.4, sh * 0.32, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Inner bowl
      ctx.beginPath()
      ctx.ellipse(sx + sw / 2, sy + sh * 0.6, sw * 0.25, sh * 0.18, 0, 0, Math.PI * 2)
      ctx.stroke()
    },
  },

  washBasin: {
    id: 'washBasin',
    name: 'Wash Basin',
    category: 'bathroom',
    defaultWidth: 2,
    defaultHeight: 1.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1

      // Counter outline
      ctx.strokeRect(sx, sy, sw, sh)

      // Basin (oval)
      ctx.beginPath()
      ctx.ellipse(sx + sw / 2, sy + sh / 2, sw * 0.35, sh * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Faucet indicator
      ctx.beginPath()
      ctx.moveTo(sx + sw / 2, sy + 3)
      ctx.lineTo(sx + sw / 2, sy + sh * 0.2)
      ctx.stroke()
    },
  },

  bathtub: {
    id: 'bathtub',
    name: 'Bathtub',
    category: 'bathroom',
    defaultWidth: 2.5,
    defaultHeight: 5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Outer tub
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(sx, sy, sw, sh, 10)
      ctx.fill()
      ctx.strokeStyle = '#a0aec0'
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner tub
      ctx.beginPath()
      ctx.roundRect(sx + 6, sy + 6, sw - 12, sh - 12, 8)
      ctx.strokeStyle = '#cbd5e0'
      ctx.lineWidth = 1
      ctx.stroke()

      // Drain
      ctx.fillStyle = '#718096'
      ctx.beginPath()
      ctx.arc(sx + sw / 2, sy + sh - 20, 5, 0, Math.PI * 2)
      ctx.fill()

      // Faucet area
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(sx + sw / 2 - 10, sy + 5, 20, 15)
    },
  },

  shower: {
    id: 'shower',
    name: 'Shower',
    category: 'bathroom',
    defaultWidth: 3,
    defaultHeight: 3,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Base
      ctx.fillStyle = '#f7fafc'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.strokeStyle = '#a0aec0'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy, sw, sh)

      // Shower head
      ctx.fillStyle = '#718096'
      ctx.beginPath()
      ctx.arc(sx + sw / 2, sy + 15, 8, 0, Math.PI * 2)
      ctx.fill()

      // Drain
      ctx.beginPath()
      ctx.arc(sx + sw / 2, sy + sh / 2, 6, 0, Math.PI * 2)
      ctx.strokeStyle = '#a0aec0'
      ctx.lineWidth = 1
      ctx.stroke()

      // Glass door indication
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx, sy + sh)
      ctx.strokeStyle = '#90cdf4'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.setLineDash([])
    },
  },

  // OFFICE FURNITURE
  desk: {
    id: 'desk',
    name: 'Office Desk',
    category: 'office',
    defaultWidth: 5,
    defaultHeight: 2.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale

      // Desk top
      ctx.fillStyle = '#d4a574'
      ctx.fillRect(sx, sy + sh * 0.3, sw, sh * 0.7)
      ctx.strokeStyle = '#8b6914'
      ctx.lineWidth = 2
      ctx.strokeRect(sx, sy + sh * 0.3, sw, sh * 0.7)

      // Chair
      ctx.fillStyle = '#4a5568'
      const chairW = sw * 0.25
      const chairH = sh * 0.3
      ctx.fillRect(sx + sw / 2 - chairW / 2, sy, chairW, chairH)
      ctx.strokeStyle = '#2d3748'
      ctx.lineWidth = 1
      ctx.strokeRect(sx + sw / 2 - chairW / 2, sy, chairW, chairH)

      // Drawers indication
      ctx.strokeStyle = '#a0845c'
      ctx.lineWidth = 1
      ctx.strokeRect(sx + 5, sy + sh * 0.4, sw * 0.25, sh * 0.5)
      ctx.strokeRect(sx + sw - 5 - sw * 0.25, sy + sh * 0.4, sw * 0.25, sh * 0.5)
    },
  },

  // OTHER
  plant: {
    id: 'plant',
    name: 'Plant',
    category: 'other',
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const cx = sx + sw / 2
      const cy = sy + sh / 2

      // Pot
      ctx.fillStyle = '#d4a574'
      ctx.beginPath()
      ctx.moveTo(cx - sw * 0.3, cy + sh * 0.1)
      ctx.lineTo(cx - sw * 0.2, cy + sh * 0.4)
      ctx.lineTo(cx + sw * 0.2, cy + sh * 0.4)
      ctx.lineTo(cx + sw * 0.3, cy + sh * 0.1)
      ctx.closePath()
      ctx.fill()

      // Plant
      ctx.fillStyle = '#48bb78'
      ctx.beginPath()
      ctx.arc(cx, cy - sh * 0.1, sw * 0.35, 0, Math.PI * 2)
      ctx.fill()
    },
  },

  // CAR / PARKING - Professional line drawing style (like architectural reference)
  car: {
    id: 'car',
    name: 'Car',
    category: 'other',
    defaultWidth: 6,
    defaultHeight: 16,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Car body outline - main shape
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.15, sy + sh * 0.02)
      ctx.lineTo(sx + sw * 0.85, sy + sh * 0.02)
      ctx.quadraticCurveTo(sx + sw * 0.95, sy + sh * 0.02, sx + sw * 0.95, sy + sh * 0.1)
      ctx.lineTo(sx + sw * 0.95, sy + sh * 0.9)
      ctx.quadraticCurveTo(sx + sw * 0.95, sy + sh * 0.98, sx + sw * 0.85, sy + sh * 0.98)
      ctx.lineTo(sx + sw * 0.15, sy + sh * 0.98)
      ctx.quadraticCurveTo(sx + sw * 0.05, sy + sh * 0.98, sx + sw * 0.05, sy + sh * 0.9)
      ctx.lineTo(sx + sw * 0.05, sy + sh * 0.1)
      ctx.quadraticCurveTo(sx + sw * 0.05, sy + sh * 0.02, sx + sw * 0.15, sy + sh * 0.02)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Hood line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.1, sy + sh * 0.18)
      ctx.lineTo(sx + sw * 0.9, sy + sh * 0.18)
      ctx.stroke()

      // Front windshield
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.15, sy + sh * 0.2)
      ctx.lineTo(sx + sw * 0.85, sy + sh * 0.2)
      ctx.lineTo(sx + sw * 0.8, sy + sh * 0.32)
      ctx.lineTo(sx + sw * 0.2, sy + sh * 0.32)
      ctx.closePath()
      ctx.stroke()

      // Roof outline
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.18, sy + sh * 0.32)
      ctx.lineTo(sx + sw * 0.82, sy + sh * 0.32)
      ctx.lineTo(sx + sw * 0.82, sy + sh * 0.58)
      ctx.lineTo(sx + sw * 0.18, sy + sh * 0.58)
      ctx.closePath()
      ctx.stroke()

      // Rear windshield
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.2, sy + sh * 0.58)
      ctx.lineTo(sx + sw * 0.8, sy + sh * 0.58)
      ctx.lineTo(sx + sw * 0.85, sy + sh * 0.68)
      ctx.lineTo(sx + sw * 0.15, sy + sh * 0.68)
      ctx.closePath()
      ctx.stroke()

      // Trunk line
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.1, sy + sh * 0.82)
      ctx.lineTo(sx + sw * 0.9, sy + sh * 0.82)
      ctx.stroke()

      // Front wheels
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.08, sy + sh * 0.12, sw * 0.06, sh * 0.035, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.92, sy + sh * 0.12, sw * 0.06, sh * 0.035, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Rear wheels
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.08, sy + sh * 0.75, sw * 0.06, sh * 0.035, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.92, sy + sh * 0.75, sw * 0.06, sh * 0.035, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Wheel inner circles
      ctx.lineWidth = 0.75
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.08, sy + sh * 0.12, sw * 0.03, sh * 0.018, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.92, sy + sh * 0.12, sw * 0.03, sh * 0.018, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.08, sy + sh * 0.75, sw * 0.03, sh * 0.018, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.92, sy + sh * 0.75, sw * 0.03, sh * 0.018, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Side mirrors
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.02, sy + sh * 0.28)
      ctx.lineTo(sx + sw * 0.02, sy + sh * 0.32)
      ctx.lineTo(sx + sw * 0.08, sy + sh * 0.31)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.98, sy + sh * 0.28)
      ctx.lineTo(sx + sw * 0.98, sy + sh * 0.32)
      ctx.lineTo(sx + sw * 0.92, sy + sh * 0.31)
      ctx.stroke()

      // Headlights
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.25, sy + sh * 0.05, sw * 0.08, sh * 0.015, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.75, sy + sh * 0.05, sw * 0.08, sh * 0.015, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Taillights
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.25, sy + sh * 0.95, sw * 0.07, sh * 0.012, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.75, sy + sh * 0.95, sw * 0.07, sh * 0.012, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Center line detail
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.5, sy + sh * 0.05)
      ctx.lineTo(sx + sw * 0.5, sy + sh * 0.15)
      ctx.stroke()
    },
  },

  // Horizontal car (for wider parking spots) - Line drawing style
  carHorizontal: {
    id: 'carHorizontal',
    name: 'Car (Horizontal)',
    category: 'other',
    defaultWidth: 16,
    defaultHeight: 6,
    draw: (ctx, x, y, w, h, scale) => {
      const sw = w * scale
      const sh = h * scale
      const sx = x * scale
      const sy = y * scale
      const lineColor = '#1a1a1a'

      ctx.strokeStyle = lineColor
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 1.5

      // Car body outline
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.02, sy + sh * 0.15)
      ctx.lineTo(sx + sw * 0.02, sy + sh * 0.85)
      ctx.quadraticCurveTo(sx + sw * 0.02, sy + sh * 0.95, sx + sw * 0.1, sy + sh * 0.95)
      ctx.lineTo(sx + sw * 0.9, sy + sh * 0.95)
      ctx.quadraticCurveTo(sx + sw * 0.98, sy + sh * 0.95, sx + sw * 0.98, sy + sh * 0.85)
      ctx.lineTo(sx + sw * 0.98, sy + sh * 0.15)
      ctx.quadraticCurveTo(sx + sw * 0.98, sy + sh * 0.05, sx + sw * 0.9, sy + sh * 0.05)
      ctx.lineTo(sx + sw * 0.1, sy + sh * 0.05)
      ctx.quadraticCurveTo(sx + sw * 0.02, sy + sh * 0.05, sx + sw * 0.02, sy + sh * 0.15)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Hood
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.18, sy + sh * 0.1)
      ctx.lineTo(sx + sw * 0.18, sy + sh * 0.9)
      ctx.stroke()

      // Front windshield
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.2, sy + sh * 0.15)
      ctx.lineTo(sx + sw * 0.2, sy + sh * 0.85)
      ctx.lineTo(sx + sw * 0.32, sy + sh * 0.8)
      ctx.lineTo(sx + sw * 0.32, sy + sh * 0.2)
      ctx.closePath()
      ctx.stroke()

      // Roof
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.32, sy + sh * 0.18)
      ctx.lineTo(sx + sw * 0.58, sy + sh * 0.18)
      ctx.lineTo(sx + sw * 0.58, sy + sh * 0.82)
      ctx.lineTo(sx + sw * 0.32, sy + sh * 0.82)
      ctx.closePath()
      ctx.stroke()

      // Rear windshield
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.58, sy + sh * 0.2)
      ctx.lineTo(sx + sw * 0.58, sy + sh * 0.8)
      ctx.lineTo(sx + sw * 0.68, sy + sh * 0.85)
      ctx.lineTo(sx + sw * 0.68, sy + sh * 0.15)
      ctx.closePath()
      ctx.stroke()

      // Trunk
      ctx.beginPath()
      ctx.moveTo(sx + sw * 0.82, sy + sh * 0.1)
      ctx.lineTo(sx + sw * 0.82, sy + sh * 0.9)
      ctx.stroke()

      // Wheels
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.12, sy + sh * 0.08, sw * 0.035, sh * 0.06, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.12, sy + sh * 0.92, sw * 0.035, sh * 0.06, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.75, sy + sh * 0.08, sw * 0.035, sh * 0.06, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(sx + sw * 0.75, sy + sh * 0.92, sw * 0.035, sh * 0.06, 0, 0, Math.PI * 2)
      ctx.stroke()
    },
  },
}

// Get furniture for a room type
export function getFurnitureForRoom(roomType: string): FurnitureItem[] {
  const roomTypeLower = roomType.toLowerCase()

  if (roomTypeLower.includes('bed') || roomTypeLower.includes('master')) {
    return [furnitureLibrary.doubleBed, furnitureLibrary.wardrobe]
  }
  if (roomTypeLower.includes('living') || roomTypeLower.includes('lounge')) {
    return [furnitureLibrary.sofa3Seater, furnitureLibrary.coffeeTable, furnitureLibrary.tvUnit]
  }
  if (roomTypeLower.includes('dining')) {
    return [furnitureLibrary.diningTable6]
  }
  if (roomTypeLower.includes('kitchen')) {
    return [furnitureLibrary.kitchenCounter, furnitureLibrary.refrigerator]
  }
  if (roomTypeLower.includes('bath') || roomTypeLower.includes('toilet') || roomTypeLower.includes('wc')) {
    if (roomTypeLower.includes('attach') || roomTypeLower.includes('master')) {
      return [furnitureLibrary.toilet, furnitureLibrary.washBasin, furnitureLibrary.shower]
    }
    return [furnitureLibrary.toilet, furnitureLibrary.washBasin]
  }
  if (roomTypeLower.includes('office') || roomTypeLower.includes('study')) {
    return [furnitureLibrary.desk]
  }
  if (roomTypeLower.includes('garage') || roomTypeLower.includes('parking') || roomTypeLower.includes('car')) {
    return [furnitureLibrary.car]
  }

  return []
}

export default furnitureLibrary
