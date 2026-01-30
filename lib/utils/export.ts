import { saveAs } from 'file-saver'
import Konva from 'konva'
import type { GeneratedPlan, RoomDoor, RoomWindow } from '../api/planner'

export interface ExportOptions {
  filename?: string
  quality?: number
  pixelRatio?: number
  scale?: number // Scale factor for DXF (1 foot = X units)
}

// DXF Layer definitions
const DXF_LAYERS = {
  WALLS: 'A-WALL',
  DOORS: 'A-DOOR',
  WINDOWS: 'A-GLAZ',
  ROOMS: 'A-AREA',
  LABELS: 'A-ANNO-TEXT',
  DIMENSIONS: 'A-ANNO-DIMS',
  FURNITURE: 'A-FURN',
}

/**
 * Export Konva stage to PNG
 */
export async function exportToPNG(
  stage: Konva.Stage,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'floor-plan', pixelRatio = 2 } = options

  try {
    const dataURL = stage.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
    })

    // Convert data URL to blob
    const response = await fetch(dataURL)
    const blob = await response.blob()

    saveAs(blob, `${filename}.png`)
  } catch (error) {
    console.error('Failed to export PNG:', error)
    throw new Error('Failed to export PNG')
  }
}

/**
 * Export Konva stage to SVG
 */
export function exportToSVG(
  stage: Konva.Stage,
  options: ExportOptions = {}
): void {
  const { filename = 'floor-plan' } = options

  try {
    // Get all layers and convert to SVG
    const width = stage.width()
    const height = stage.height()

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .room-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1f2937; }
      .room-area { font-family: Arial, sans-serif; font-size: 12px; fill: #6b7280; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#fafafa"/>
`

    // Get rooms from stage
    stage.find('Group').forEach((group) => {
      const groupNode = group as Konva.Group
      const rect = groupNode.findOne('Rect') as Konva.Rect | undefined
      const texts = groupNode.find('Text') as Konva.Text[]

      if (rect) {
        const x = groupNode.x()
        const y = groupNode.y()
        const rectWidth = rect.width()
        const rectHeight = rect.height()
        const fill = rect.fill() as string
        const stroke = rect.stroke() as string

        svgContent += `  <g transform="translate(${x}, ${y})">
    <rect width="${rectWidth}" height="${rectHeight}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="2"/>
`

        texts.forEach((textNode: Konva.Text, idx: number) => {
          const textX = textNode.x()
          const textY = textNode.y() + textNode.fontSize()
          const textContent = textNode.text()
          const className = idx === 0 ? 'room-label' : 'room-area'

          svgContent += `    <text x="${textX}" y="${textY}" class="${className}">${textContent}</text>
`
        })

        svgContent += `  </g>
`
      }
    })

    svgContent += `</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    saveAs(blob, `${filename}.svg`)
  } catch (error) {
    console.error('Failed to export SVG:', error)
    throw new Error('Failed to export SVG')
  }
}

/**
 * Export floor plan to SVG from plan data (without Konva stage)
 */
export function exportPlanToSVG(
  plan: GeneratedPlan,
  floorIndex: number = 0,
  options: ExportOptions = {}
): void {
  const { filename = 'floor-plan', scale = 10 } = options
  const floor = plan.floors[floorIndex]
  if (!floor) {
    throw new Error('Floor not found')
  }

  try {
    const padding = 60
    const buildingWidth = (plan.buildingDimensions?.width || 50) * scale
    const buildingDepth = (plan.buildingDimensions?.depth || 40) * scale
    const svgWidth = buildingWidth + padding * 2
    const svgHeight = buildingDepth + padding * 2

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <style>
      .wall { fill: none; stroke: #000000; stroke-width: 3; }
      .inner-wall { fill: none; stroke: #000000; stroke-width: 1.5; }
      .room-fill { fill: #ffffff; stroke: #333333; stroke-width: 1; }
      .door { fill: none; stroke: #333333; stroke-width: 1.5; }
      .window { fill: none; stroke: #0066cc; stroke-width: 2; }
      .room-label { font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #1f2937; text-anchor: middle; }
      .room-dims { font-family: Arial, sans-serif; font-size: 9px; fill: #6b7280; text-anchor: middle; }
      .room-area { font-family: Arial, sans-serif; font-size: 8px; fill: #999999; text-anchor: middle; }
      .title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }
      .subtitle { font-family: Arial, sans-serif; font-size: 10px; fill: #666666; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Building Outline -->
  <rect x="${padding}" y="${padding}" width="${buildingWidth}" height="${buildingDepth}" class="wall"/>

  <!-- Title Block -->
  <text x="${svgWidth - 10}" y="20" class="title" text-anchor="end">${(plan.buildingType || 'Floor Plan').toUpperCase()}</text>
  <text x="${svgWidth - 10}" y="35" class="subtitle" text-anchor="end">${floor.level} - ${floor.totalArea || 0} SF</text>
`

    // Draw each room
    floor.rooms.forEach((room) => {
      const x = padding + (room.position?.x || 0) * scale
      const y = padding + (room.position?.y || 0) * scale
      const w = (room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale
      const h = (room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale

      // Room rectangle
      svgContent += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" class="room-fill"/>\n`

      // Room label
      svgContent += `  <text x="${x + w/2}" y="${y + h/2 - 8}" class="room-label">${room.name.toUpperCase()}</text>\n`

      // Room dimensions
      const dimW = room.dimensions?.width || Math.round(w / scale)
      const dimH = room.dimensions?.length || Math.round(h / scale)
      svgContent += `  <text x="${x + w/2}" y="${y + h/2 + 5}" class="room-dims">${dimW}' x ${dimH}'</text>\n`

      // Room area
      svgContent += `  <text x="${x + w/2}" y="${y + h/2 + 18}" class="room-area">${room.areaSqft} SF</text>\n`

      // Draw doors
      if (room.doors && room.doors.length > 0) {
        room.doors.forEach((door) => {
          const doorWidth = door.width * scale
          const doorPos = door.position * scale

          let dx = x, dy = y
          switch (door.wall) {
            case 'north':
              dx = x + doorPos
              dy = y
              svgContent += `  <path d="M${dx},${dy} A${doorWidth},${doorWidth} 0 0,1 ${dx},${dy + doorWidth}" class="door"/>\n`
              svgContent += `  <line x1="${dx}" y1="${dy}" x2="${dx}" y2="${dy + doorWidth}" class="door"/>\n`
              break
            case 'south':
              dx = x + doorPos
              dy = y + h
              svgContent += `  <path d="M${dx},${dy} A${doorWidth},${doorWidth} 0 0,0 ${dx},${dy - doorWidth}" class="door"/>\n`
              svgContent += `  <line x1="${dx}" y1="${dy}" x2="${dx}" y2="${dy - doorWidth}" class="door"/>\n`
              break
            case 'west':
              dx = x
              dy = y + doorPos
              svgContent += `  <path d="M${dx},${dy} A${doorWidth},${doorWidth} 0 0,1 ${dx + doorWidth},${dy}" class="door"/>\n`
              svgContent += `  <line x1="${dx}" y1="${dy}" x2="${dx + doorWidth}" y2="${dy}" class="door"/>\n`
              break
            case 'east':
              dx = x + w
              dy = y + doorPos
              svgContent += `  <path d="M${dx},${dy} A${doorWidth},${doorWidth} 0 0,0 ${dx - doorWidth},${dy}" class="door"/>\n`
              svgContent += `  <line x1="${dx}" y1="${dy}" x2="${dx - doorWidth}" y2="${dy}" class="door"/>\n`
              break
          }
        })
      }

      // Draw windows
      if (room.windows && room.windows.length > 0) {
        room.windows.forEach((window) => {
          const winWidth = window.width * scale
          const winPos = window.position * scale

          let wx = x, wy = y
          switch (window.wall) {
            case 'north':
              wx = x + winPos
              wy = y
              svgContent += `  <line x1="${wx}" y1="${wy - 3}" x2="${wx + winWidth}" y2="${wy - 3}" class="window"/>\n`
              svgContent += `  <line x1="${wx}" y1="${wy + 3}" x2="${wx + winWidth}" y2="${wy + 3}" class="window"/>\n`
              break
            case 'south':
              wx = x + winPos
              wy = y + h
              svgContent += `  <line x1="${wx}" y1="${wy - 3}" x2="${wx + winWidth}" y2="${wy - 3}" class="window"/>\n`
              svgContent += `  <line x1="${wx}" y1="${wy + 3}" x2="${wx + winWidth}" y2="${wy + 3}" class="window"/>\n`
              break
            case 'west':
              wx = x
              wy = y + winPos
              svgContent += `  <line x1="${wx - 3}" y1="${wy}" x2="${wx - 3}" y2="${wy + winWidth}" class="window"/>\n`
              svgContent += `  <line x1="${wx + 3}" y1="${wy}" x2="${wx + 3}" y2="${wy + winWidth}" class="window"/>\n`
              break
            case 'east':
              wx = x + w
              wy = y + winPos
              svgContent += `  <line x1="${wx - 3}" y1="${wy}" x2="${wx - 3}" y2="${wy + winWidth}" class="window"/>\n`
              svgContent += `  <line x1="${wx + 3}" y1="${wy}" x2="${wx + 3}" y2="${wy + winWidth}" class="window"/>\n`
              break
          }
        })
      }
    })

    svgContent += `</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    saveAs(blob, `${filename}.svg`)
  } catch (error) {
    console.error('Failed to export SVG:', error)
    throw new Error('Failed to export SVG')
  }
}

/**
 * Export floor plan data to JSON
 */
export function exportToJSON(data: any, options: ExportOptions = {}): void {
  const { filename = 'floor-plan' } = options

  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    saveAs(blob, `${filename}.json`)
  } catch (error) {
    console.error('Failed to export JSON:', error)
    throw new Error('Failed to export JSON')
  }
}

/**
 * Export to DXF format (AutoCAD compatible)
 * Enhanced with proper layers, doors, windows, and dimensions
 */
export function exportToDXF(
  plan: GeneratedPlan,
  floorIndex: number = 0,
  options: ExportOptions = {}
): void {
  const { filename = 'floor-plan', scale = 1 } = options
  const floor = plan.floors[floorIndex]
  if (!floor) {
    throw new Error('Floor not found')
  }

  try {
    // DXF Header with layer definitions
    let dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
1
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
7
0
LAYER
2
${DXF_LAYERS.WALLS}
70
0
62
7
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.DOORS}
70
0
62
3
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.WINDOWS}
70
0
62
5
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.ROOMS}
70
0
62
8
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.LABELS}
70
0
62
7
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.DIMENSIONS}
70
0
62
1
6
CONTINUOUS
0
LAYER
2
${DXF_LAYERS.FURNITURE}
70
0
62
8
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`

    // Building outline if dimensions are available
    if (plan.buildingDimensions) {
      const bw = plan.buildingDimensions.width * scale
      const bd = plan.buildingDimensions.depth * scale
      dxfContent += createDXFPolyline([
        [0, 0], [bw, 0], [bw, bd], [0, bd], [0, 0]
      ], DXF_LAYERS.WALLS, 0.5)
    }

    // Process each room
    floor.rooms.forEach((room) => {
      const x = (room.position?.x || 0) * scale
      const y = (room.position?.y || 0) * scale
      const w = (room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale
      const h = (room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale

      // Room outline
      dxfContent += createDXFPolyline([
        [x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]
      ], DXF_LAYERS.WALLS, 0.25)

      // Room label
      dxfContent += createDXFText(
        room.name.toUpperCase(),
        x + w / 2,
        y + h / 2,
        DXF_LAYERS.LABELS,
        8 * scale / 12
      )

      // Room area label
      dxfContent += createDXFText(
        `${room.areaSqft} SF`,
        x + w / 2,
        y + h / 2 - 12 * scale / 12,
        DXF_LAYERS.LABELS,
        6 * scale / 12
      )

      // Doors
      if (room.doors && room.doors.length > 0) {
        room.doors.forEach((door) => {
          dxfContent += createDXFDoor(x, y, w, h, door, scale)
        })
      }

      // Windows
      if (room.windows && room.windows.length > 0) {
        room.windows.forEach((window) => {
          dxfContent += createDXFWindow(x, y, w, h, window, scale)
        })
      }
    })

    // Close DXF file
    dxfContent += `0
ENDSEC
0
EOF
`

    const blob = new Blob([dxfContent], { type: 'application/dxf' })
    saveAs(blob, `${filename}.dxf`)
  } catch (error) {
    console.error('Failed to export DXF:', error)
    throw new Error('Failed to export DXF')
  }
}

/**
 * Create DXF polyline entity
 */
function createDXFPolyline(
  points: [number, number][],
  layer: string,
  lineWidth: number = 0
): string {
  let content = `0
LWPOLYLINE
8
${layer}
43
${lineWidth}
90
${points.length}
70
0
`
  points.forEach(([px, py]) => {
    content += `10
${px.toFixed(4)}
20
${py.toFixed(4)}
`
  })
  return content
}

/**
 * Create DXF text entity
 */
function createDXFText(
  text: string,
  x: number,
  y: number,
  layer: string,
  height: number = 10
): string {
  return `0
TEXT
8
${layer}
10
${x.toFixed(4)}
20
${y.toFixed(4)}
40
${height.toFixed(4)}
1
${text}
72
1
11
${x.toFixed(4)}
21
${y.toFixed(4)}
`
}

/**
 * Create DXF door representation
 */
function createDXFDoor(
  roomX: number,
  roomY: number,
  roomW: number,
  roomH: number,
  door: RoomDoor,
  scale: number
): string {
  const doorWidth = door.width * scale
  const doorPos = door.position * scale
  let content = ''

  let x1 = roomX, y1 = roomY, x2 = roomX, y2 = roomY

  switch (door.wall) {
    case 'north':
      x1 = roomX + doorPos
      y1 = roomY
      x2 = x1 + doorWidth
      y2 = y1
      // Door swing arc (90 degrees)
      content += createDXFArc(x1, y1, doorWidth, 0, 90, DXF_LAYERS.DOORS)
      // Door panel
      content += createDXFLine(x1, y1, x1, y1 + doorWidth, DXF_LAYERS.DOORS)
      break
    case 'south':
      x1 = roomX + doorPos
      y1 = roomY + roomH
      x2 = x1 + doorWidth
      y2 = y1
      content += createDXFArc(x1, y1, doorWidth, 270, 360, DXF_LAYERS.DOORS)
      content += createDXFLine(x1, y1, x1, y1 - doorWidth, DXF_LAYERS.DOORS)
      break
    case 'west':
      x1 = roomX
      y1 = roomY + doorPos
      x2 = x1
      y2 = y1 + doorWidth
      content += createDXFArc(x1, y1, doorWidth, 270, 360, DXF_LAYERS.DOORS)
      content += createDXFLine(x1, y1, x1 + doorWidth, y1, DXF_LAYERS.DOORS)
      break
    case 'east':
      x1 = roomX + roomW
      y1 = roomY + doorPos
      x2 = x1
      y2 = y1 + doorWidth
      content += createDXFArc(x1, y1, doorWidth, 180, 270, DXF_LAYERS.DOORS)
      content += createDXFLine(x1, y1, x1 - doorWidth, y1, DXF_LAYERS.DOORS)
      break
  }

  return content
}

/**
 * Create DXF window representation
 */
function createDXFWindow(
  roomX: number,
  roomY: number,
  roomW: number,
  roomH: number,
  window: RoomWindow,
  scale: number
): string {
  const winWidth = window.width * scale
  const winPos = window.position * scale
  let content = ''

  let x1 = roomX, y1 = roomY, x2 = roomX, y2 = roomY

  switch (window.wall) {
    case 'north':
      x1 = roomX + winPos
      y1 = roomY
      x2 = x1 + winWidth
      y2 = y1
      // Double line for window
      content += createDXFLine(x1, y1 - 0.25 * scale, x2, y2 - 0.25 * scale, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1, y1 + 0.25 * scale, x2, y2 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      // End caps
      content += createDXFLine(x1, y1 - 0.25 * scale, x1, y1 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x2, y2 - 0.25 * scale, x2, y2 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      break
    case 'south':
      x1 = roomX + winPos
      y1 = roomY + roomH
      x2 = x1 + winWidth
      y2 = y1
      content += createDXFLine(x1, y1 - 0.25 * scale, x2, y2 - 0.25 * scale, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1, y1 + 0.25 * scale, x2, y2 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1, y1 - 0.25 * scale, x1, y1 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x2, y2 - 0.25 * scale, x2, y2 + 0.25 * scale, DXF_LAYERS.WINDOWS)
      break
    case 'west':
      x1 = roomX
      y1 = roomY + winPos
      x2 = x1
      y2 = y1 + winWidth
      content += createDXFLine(x1 - 0.25 * scale, y1, x2 - 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1 + 0.25 * scale, y1, x2 + 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1 - 0.25 * scale, y1, x1 + 0.25 * scale, y1, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x2 - 0.25 * scale, y2, x2 + 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      break
    case 'east':
      x1 = roomX + roomW
      y1 = roomY + winPos
      x2 = x1
      y2 = y1 + winWidth
      content += createDXFLine(x1 - 0.25 * scale, y1, x2 - 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1 + 0.25 * scale, y1, x2 + 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x1 - 0.25 * scale, y1, x1 + 0.25 * scale, y1, DXF_LAYERS.WINDOWS)
      content += createDXFLine(x2 - 0.25 * scale, y2, x2 + 0.25 * scale, y2, DXF_LAYERS.WINDOWS)
      break
  }

  return content
}

/**
 * Create DXF line entity
 */
function createDXFLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  layer: string
): string {
  return `0
LINE
8
${layer}
10
${x1.toFixed(4)}
20
${y1.toFixed(4)}
11
${x2.toFixed(4)}
21
${y2.toFixed(4)}
`
}

/**
 * Create DXF arc entity
 */
function createDXFArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  layer: string
): string {
  return `0
ARC
8
${layer}
10
${x.toFixed(4)}
20
${y.toFixed(4)}
40
${radius.toFixed(4)}
50
${startAngle.toFixed(4)}
51
${endAngle.toFixed(4)}
`
}

/**
 * Legacy DXF export for simple room arrays (backward compatibility)
 */
export function exportToDXFSimple(
  rooms: Array<{
    name: string
    x: number
    y: number
    width: number
    height: number
    areaSqft: number
  }>,
  options: ExportOptions = {}
): void {
  const { filename = 'floor-plan' } = options

  try {
    let dxfContent = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
`

    rooms.forEach((room) => {
      // Add rectangle for room using polyline
      dxfContent += createDXFPolyline([
        [room.x, room.y],
        [room.x + room.width, room.y],
        [room.x + room.width, room.y + room.height],
        [room.x, room.y + room.height],
        [room.x, room.y]
      ], 'Rooms', 0)

      // Room label
      dxfContent += createDXFText(room.name, room.x + 10, room.y + 20, 'Labels', 10)
    })

    dxfContent += `0
ENDSEC
0
EOF
`

    const blob = new Blob([dxfContent], { type: 'application/dxf' })
    saveAs(blob, `${filename}.dxf`)
  } catch (error) {
    console.error('Failed to export DXF:', error)
    throw new Error('Failed to export DXF')
  }
}

/**
 * Get canvas reference from Three.js for export
 */
export async function export3DToPNG(
  canvas: HTMLCanvasElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'floor-plan-3d' } = options

  try {
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.png`)
      }
    }, 'image/png')
  } catch (error) {
    console.error('Failed to export 3D PNG:', error)
    throw new Error('Failed to export 3D view')
  }
}

/**
 * Generate PDF report (basic implementation using canvas)
 */
export async function exportToPDF(
  stage: Konva.Stage,
  planData: any,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = 'floor-plan-report' } = options

  // For a full PDF implementation, you would use a library like jsPDF
  // This is a placeholder that exports as PNG instead
  console.warn('PDF export requires jsPDF library. Exporting as PNG instead.')
  await exportToPNG(stage, { ...options, filename })
}
