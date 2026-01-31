/**
 * Layout Engine
 * Converts structured plan data into accurate geometric coordinates
 * This is the CRITICAL layer for accuracy - rooms positioned exactly as specified
 */

export interface LayoutConstraint {
  roomId: string;
  adjacentTo?: string[];
  position?: 'left' | 'right' | 'center' | 'front' | 'back';
  minArea?: number;
  maxArea?: number;
  aspectRatio?: { min: number; max: number };
}

export interface RoomLayout {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  doors: DoorLayout[];
  windows: WindowLayout[];
}

export interface DoorLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'single' | 'double' | 'sliding';
  connectsTo?: string;
}

export interface WindowLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'single' | 'double' | 'bay';
}

export interface WallLayout {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  type: 'exterior' | 'interior' | 'partition';
}

export interface FloorLayout {
  level: string;
  rooms: RoomLayout[];
  walls: WallLayout[];
  boundingBox: { width: number; height: number };
  circulation: {
    corridors: Array<{ x: number; y: number; width: number; height: number }>;
    stairs?: { x: number; y: number; width: number; height: number };
  };
}

export interface LayoutResult {
  success: boolean;
  floors: FloorLayout[];
  plotDimensions: { width: number; height: number };
  errors?: string[];
  warnings?: string[];
}

// Room type standard dimensions (in feet)
const ROOM_STANDARDS: Record<string, { minArea: number; idealArea: number; aspectRatio: { min: number; max: number } }> = {
  'bedroom': { minArea: 100, idealArea: 150, aspectRatio: { min: 0.7, max: 1.4 } },
  'master bedroom': { minArea: 180, idealArea: 250, aspectRatio: { min: 0.6, max: 1.2 } },
  'living room': { minArea: 150, idealArea: 250, aspectRatio: { min: 0.5, max: 1.5 } },
  'lounge': { minArea: 150, idealArea: 250, aspectRatio: { min: 0.5, max: 1.5 } },
  'kitchen': { minArea: 80, idealArea: 120, aspectRatio: { min: 0.6, max: 1.4 } },
  'bathroom': { minArea: 35, idealArea: 50, aspectRatio: { min: 0.6, max: 1.2 } },
  'toilet': { minArea: 20, idealArea: 30, aspectRatio: { min: 0.5, max: 1.0 } },
  'dining': { minArea: 100, idealArea: 150, aspectRatio: { min: 0.7, max: 1.4 } },
  'office': { minArea: 80, idealArea: 120, aspectRatio: { min: 0.6, max: 1.4 } },
  'garage': { minArea: 200, idealArea: 300, aspectRatio: { min: 0.4, max: 0.8 } },
  'store': { minArea: 30, idealArea: 50, aspectRatio: { min: 0.5, max: 1.5 } },
  'lobby': { minArea: 50, idealArea: 100, aspectRatio: { min: 0.5, max: 2.0 } },
  'corridor': { minArea: 30, idealArea: 60, aspectRatio: { min: 0.1, max: 0.3 } },
  'staircase': { minArea: 40, idealArea: 60, aspectRatio: { min: 0.4, max: 0.8 } },
};

// Wall thickness constants
const WALL_THICKNESS = {
  exterior: 1.0, // 1 foot = 12 inches (brick wall)
  interior: 0.5, // 6 inches
  partition: 0.33, // 4 inches
};

/**
 * Main Layout Engine Class
 */
export class LayoutEngine {
  private plotWidth: number;
  private plotHeight: number;
  private constraints: LayoutConstraint[] = [];
  private warnings: string[] = [];

  constructor(plotWidth: number, plotHeight: number) {
    this.plotWidth = plotWidth;
    this.plotHeight = plotHeight;
  }

  /**
   * Parse natural language constraints from prompt
   */
  parseConstraints(prompt: string): LayoutConstraint[] {
    const constraints: LayoutConstraint[] = [];

    // Parse "kitchen near lounge" type constraints
    const nearPattern = /(\w+(?:\s+\w+)?)\s+(?:near|beside|next to|adjacent to)\s+(\w+(?:\s+\w+)?)/gi;
    let match;
    while ((match = nearPattern.exec(prompt)) !== null) {
      constraints.push({
        roomId: match[1].toLowerCase(),
        adjacentTo: [match[2].toLowerCase()],
      });
    }

    // Parse "stairs on right" type constraints
    const positionPattern = /(\w+(?:\s+\w+)?)\s+(?:on|at|in)\s+(left|right|front|back|center)/gi;
    while ((match = positionPattern.exec(prompt)) !== null) {
      constraints.push({
        roomId: match[1].toLowerCase(),
        position: match[2].toLowerCase() as any,
      });
    }

    return constraints;
  }

  /**
   * Generate layout for a single floor
   */
  generateFloorLayout(
    floorData: {
      level: string;
      rooms: Array<{
        name: string;
        type?: string;
        areaSqft: number;
        dimensions?: { length: number; width: number };
        position?: { x: number; y: number };
      }>;
    },
    constraints: LayoutConstraint[] = []
  ): FloorLayout {
    const rooms: RoomLayout[] = [];
    const walls: WallLayout[] = [];

    // Calculate usable area (inside walls)
    const usableWidth = this.plotWidth - 2 * WALL_THICKNESS.exterior;
    const usableHeight = this.plotHeight - 2 * WALL_THICKNESS.exterior;

    // Sort rooms by priority (larger rooms first, then by constraints)
    const sortedRooms = [...floorData.rooms].sort((a, b) => {
      const aHasConstraint = constraints.some(c => c.roomId === a.name.toLowerCase());
      const bHasConstraint = constraints.some(c => c.roomId === b.name.toLowerCase());
      if (aHasConstraint !== bHasConstraint) return bHasConstraint ? 1 : -1;
      return b.areaSqft - a.areaSqft;
    });

    // Grid-based placement algorithm
    const grid = this.createPlacementGrid(usableWidth, usableHeight);
    let currentX = WALL_THICKNESS.exterior;
    let currentY = WALL_THICKNESS.exterior;
    let rowHeight = 0;

    for (const room of sortedRooms) {
      const roomConstraint = constraints.find(c => c.roomId === room.name.toLowerCase());

      // Calculate room dimensions
      let width: number;
      let height: number;

      if (room.dimensions) {
        width = room.dimensions.length;
        height = room.dimensions.width;
      } else {
        // Calculate from area with standard aspect ratio
        const standards = ROOM_STANDARDS[room.type?.toLowerCase() || room.name.toLowerCase()] || ROOM_STANDARDS['bedroom'];
        const aspectRatio = (standards.aspectRatio.min + standards.aspectRatio.max) / 2;
        width = Math.sqrt(room.areaSqft * aspectRatio);
        height = room.areaSqft / width;
      }

      // Round to nearest 0.5 feet for clean dimensions
      width = Math.round(width * 2) / 2;
      height = Math.round(height * 2) / 2;

      // Apply position constraints
      let roomX = currentX;
      let roomY = currentY;

      if (roomConstraint?.position) {
        switch (roomConstraint.position) {
          case 'left':
            roomX = WALL_THICKNESS.exterior;
            break;
          case 'right':
            roomX = this.plotWidth - WALL_THICKNESS.exterior - width;
            break;
          case 'front':
            roomY = WALL_THICKNESS.exterior;
            break;
          case 'back':
            roomY = this.plotHeight - WALL_THICKNESS.exterior - height;
            break;
          case 'center':
            roomX = (this.plotWidth - width) / 2;
            roomY = (this.plotHeight - height) / 2;
            break;
        }
      } else if (room.position) {
        // Use provided position
        roomX = room.position.x;
        roomY = room.position.y;
      } else {
        // Auto-place: check if room fits in current row
        if (currentX + width > usableWidth + WALL_THICKNESS.exterior) {
          // Move to next row
          currentX = WALL_THICKNESS.exterior;
          currentY += rowHeight + WALL_THICKNESS.interior;
          rowHeight = 0;
        }
        roomX = currentX;
        roomY = currentY;

        // Update position for next room
        currentX += width + WALL_THICKNESS.interior;
        rowHeight = Math.max(rowHeight, height);
      }

      // Generate doors for this room
      const doors = this.generateDoors(room.name, roomX, roomY, width, height);

      // Generate windows (exterior walls only)
      const windows = this.generateWindows(room.name, roomX, roomY, width, height);

      rooms.push({
        id: `room-${rooms.length}`,
        name: room.name,
        type: room.type || this.inferRoomType(room.name),
        x: roomX,
        y: roomY,
        width,
        height,
        doors,
        windows,
      });
    }

    // Generate walls
    const generatedWalls = this.generateWalls(rooms);
    walls.push(...generatedWalls);

    // Generate exterior walls
    walls.push(
      // Bottom wall
      { x1: 0, y1: 0, x2: this.plotWidth, y2: 0, thickness: WALL_THICKNESS.exterior, type: 'exterior' },
      // Top wall
      { x1: 0, y1: this.plotHeight, x2: this.plotWidth, y2: this.plotHeight, thickness: WALL_THICKNESS.exterior, type: 'exterior' },
      // Left wall
      { x1: 0, y1: 0, x2: 0, y2: this.plotHeight, thickness: WALL_THICKNESS.exterior, type: 'exterior' },
      // Right wall
      { x1: this.plotWidth, y1: 0, x2: this.plotWidth, y2: this.plotHeight, thickness: WALL_THICKNESS.exterior, type: 'exterior' },
    );

    return {
      level: floorData.level,
      rooms,
      walls,
      boundingBox: { width: this.plotWidth, height: this.plotHeight },
      circulation: {
        corridors: this.generateCorridors(rooms),
        stairs: floorData.level !== 'Ground' ? this.generateStairs() : undefined,
      },
    };
  }

  private createPlacementGrid(width: number, height: number): boolean[][] {
    const cellSize = 1; // 1 foot cells
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  private inferRoomType(name: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bed')) return 'bedroom';
    if (nameLower.includes('bath') || nameLower.includes('toilet')) return 'bathroom';
    if (nameLower.includes('kitchen')) return 'kitchen';
    if (nameLower.includes('living') || nameLower.includes('lounge')) return 'living room';
    if (nameLower.includes('dining')) return 'dining';
    if (nameLower.includes('office')) return 'office';
    if (nameLower.includes('garage')) return 'garage';
    if (nameLower.includes('store')) return 'store';
    return 'room';
  }

  private generateDoors(
    roomName: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): DoorLayout[] {
    const doors: DoorLayout[] = [];
    const doorWidth = 3; // 3 feet standard door
    const doorHeight = 0.5;

    // Add door at the bottom wall (most common entry point)
    doors.push({
      x: x + width / 2 - doorWidth / 2,
      y: y,
      width: doorWidth,
      height: doorHeight,
      rotation: 0,
      type: roomName.toLowerCase().includes('main') ? 'double' : 'single',
    });

    return doors;
  }

  private generateWindows(
    roomName: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): WindowLayout[] {
    const windows: WindowLayout[] = [];
    const windowWidth = 4;
    const windowHeight = 0.5;

    // Rooms that typically have windows
    const roomsWithWindows = ['bedroom', 'living', 'lounge', 'dining', 'kitchen', 'office'];
    const needsWindow = roomsWithWindows.some(type => roomName.toLowerCase().includes(type));

    if (needsWindow) {
      // Check if room is on exterior (simplified check)
      if (x <= WALL_THICKNESS.exterior + 1 || x + width >= this.plotWidth - WALL_THICKNESS.exterior - 1) {
        windows.push({
          x: x + width / 2 - windowWidth / 2,
          y: y + height - windowHeight,
          width: windowWidth,
          height: windowHeight,
          rotation: 0,
          type: 'double',
        });
      }
    }

    return windows;
  }

  private generateWalls(rooms: RoomLayout[]): WallLayout[] {
    const walls: WallLayout[] = [];

    for (const room of rooms) {
      // Bottom wall
      walls.push({
        x1: room.x,
        y1: room.y,
        x2: room.x + room.width,
        y2: room.y,
        thickness: WALL_THICKNESS.interior,
        type: 'interior',
      });
      // Top wall
      walls.push({
        x1: room.x,
        y1: room.y + room.height,
        x2: room.x + room.width,
        y2: room.y + room.height,
        thickness: WALL_THICKNESS.interior,
        type: 'interior',
      });
      // Left wall
      walls.push({
        x1: room.x,
        y1: room.y,
        x2: room.x,
        y2: room.y + room.height,
        thickness: WALL_THICKNESS.interior,
        type: 'interior',
      });
      // Right wall
      walls.push({
        x1: room.x + room.width,
        y1: room.y,
        x2: room.x + room.width,
        y2: room.y + room.height,
        thickness: WALL_THICKNESS.interior,
        type: 'interior',
      });
    }

    return walls;
  }

  private generateCorridors(rooms: RoomLayout[]): Array<{ x: number; y: number; width: number; height: number }> {
    // Simple corridor generation - central corridor if multiple rooms
    if (rooms.length < 3) return [];

    const corridorWidth = 4; // 4 feet corridor
    return [{
      x: this.plotWidth / 2 - corridorWidth / 2,
      y: WALL_THICKNESS.exterior,
      width: corridorWidth,
      height: this.plotHeight - 2 * WALL_THICKNESS.exterior,
    }];
  }

  private generateStairs(): { x: number; y: number; width: number; height: number } {
    const stairWidth = 4;
    const stairHeight = 10;
    return {
      x: this.plotWidth - WALL_THICKNESS.exterior - stairWidth - 2,
      y: WALL_THICKNESS.exterior + 2,
      width: stairWidth,
      height: stairHeight,
    };
  }

  /**
   * Generate complete layout from generated plan
   */
  generateLayout(
    planData: {
      buildingType?: string;
      totalArea?: number;
      floors: Array<{
        level: string;
        rooms: Array<{
          name: string;
          type?: string;
          areaSqft: number;
          dimensions?: { length: number; width: number };
          position?: { x: number; y: number };
        }>;
      }>;
    },
    prompt?: string
  ): LayoutResult {
    this.warnings = [];

    // Parse constraints from prompt if provided
    const constraints = prompt ? this.parseConstraints(prompt) : [];

    // Generate layout for each floor
    const floors: FloorLayout[] = [];
    for (const floorData of planData.floors) {
      const floorLayout = this.generateFloorLayout(floorData, constraints);
      floors.push(floorLayout);
    }

    return {
      success: true,
      floors,
      plotDimensions: { width: this.plotWidth, height: this.plotHeight },
      warnings: this.warnings.length > 0 ? this.warnings : undefined,
    };
  }
}

/**
 * Helper function to create layout engine and generate layout
 */
export function generateAccurateLayout(
  planData: {
    buildingType?: string;
    totalArea?: number;
    plotDimensions?: { width: number; height: number };
    floors: Array<{
      level: string;
      rooms: Array<{
        name: string;
        type?: string;
        areaSqft: number;
        dimensions?: { length: number; width: number };
        position?: { x: number; y: number };
      }>;
    }>;
  },
  prompt?: string
): LayoutResult {
  // Calculate plot dimensions if not provided
  let plotWidth = planData.plotDimensions?.width || 40;
  let plotHeight = planData.plotDimensions?.height || 60;

  // If total area is provided, calculate dimensions
  if (planData.totalArea && !planData.plotDimensions) {
    // Assume standard 2:3 plot ratio
    const ratio = 2 / 3;
    plotWidth = Math.sqrt(planData.totalArea * ratio);
    plotHeight = planData.totalArea / plotWidth;
  }

  const engine = new LayoutEngine(plotWidth, plotHeight);
  return engine.generateLayout(planData, prompt);
}

export default LayoutEngine;
