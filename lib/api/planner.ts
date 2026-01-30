import { apiClient } from './client';

export interface PlannerMeta {
  buildingType?: string;
  city?: string;
  authority?: string;
  plotArea?: number;
  floors?: string[];
  budget?: string;
  style?: string;
  specialRequirements?: string[];
}

export interface GeneratePlanRequest {
  prompt: string;
  meta?: PlannerMeta;
}

// Enhanced Door interface with full specifications
export interface RoomDoor {
  id?: string;
  wall: 'north' | 'south' | 'east' | 'west';
  position: number; // Distance from wall LEFT edge in feet
  width: number; // Door width in feet (typically 2.5-3ft)
  height?: number; // Door height in feet (typically 7ft)
  type?: 'single' | 'double' | 'sliding' | 'pocket' | 'french';
  connectsTo?: string; // Room ID or 'exterior'
  swingDirection?: 'inward' | 'outward' | 'left' | 'right';
}

// Enhanced Window interface with full specifications
export interface RoomWindow {
  id?: string;
  wall: 'north' | 'south' | 'east' | 'west';
  position: number; // Distance from wall LEFT edge in feet
  width: number; // Window width in feet
  height?: number; // Window height in feet (typically 4ft)
  sillHeight?: number; // Height from floor to window bottom (typically 3ft)
  type?: 'fixed' | 'casement' | 'sliding' | 'double-hung';
}

// Electrical point interface
export interface ElectricalPoint {
  type: 'outlet' | 'switch' | 'light' | 'fan' | 'ac';
  position: { x: number; y: number };
  wall?: 'north' | 'south' | 'east' | 'west' | 'ceiling';
}

// Plumbing point interface
export interface PlumbingPoint {
  type: 'sink' | 'toilet' | 'shower' | 'tub' | 'washer' | 'dishwasher';
  position: { x: number; y: number };
}

// Column interface for structural elements
export interface Column {
  id: string;
  position: { x: number; y: number };
  size: number; // Column size in inches (typically 12-18)
}

// Enhanced Room interface with all specifications
export interface Room {
  id?: string;
  name: string;
  type: string;
  areaSqft: number;
  dimensions?: {
    length: number; // Y direction (depth)
    width: number; // X direction (width)
  };
  position?: {
    x: number; // From building left edge
    y: number; // From building top edge
  };
  ceilingHeight?: number; // Ceiling height in feet
  floorMaterial?: 'hardwood' | 'tile' | 'carpet' | 'concrete' | 'marble' | 'vinyl';
  wallMaterial?: 'drywall' | 'brick' | 'glass' | 'concrete';
  doors?: RoomDoor[];
  windows?: RoomWindow[];
  electricalPoints?: ElectricalPoint[];
  plumbingPoints?: PlumbingPoint[];
  features?: string[];
}

// Enhanced Floor interface
export interface Floor {
  level: string;
  totalArea?: number;
  floorHeight?: number; // Floor to ceiling height in feet
  rooms: Room[];
  columns?: Column[];
  circulation?: {
    type: 'central' | 'linear' | 'clustered' | 'radial';
    corridorWidth?: number;
    mainPath?: string;
  };
}

// Structural grid interface
export interface StructuralGrid {
  xSpacing: number; // Column grid spacing X direction
  ySpacing: number; // Column grid spacing Y direction
}

// Fire safety interface
export interface FireSafety {
  exitCount: number;
  exitLocations?: string[];
  sprinklerSystem?: boolean;
  fireExtinguisherLocations?: string[];
}

// Accessibility interface
export interface Accessibility {
  adaCompliant?: boolean;
  rampLocations?: string[];
  accessibleBathroom?: boolean;
  wideDoorways?: boolean;
}

// Enhanced GeneratedPlan interface
export interface GeneratedPlan {
  buildingType: string;
  totalArea?: number;
  buildingDimensions?: {
    width: number; // Total building width in feet (X-axis)
    depth: number; // Total building depth in feet (Y-axis)
  };
  structuralGrid?: StructuralGrid;
  floors: Floor[];
  exterior?: {
    mainEntrance?: {
      wall: string;
      position: number;
      type?: 'single' | 'double' | 'revolving';
      canopyDepth?: number;
    };
    secondaryEntrance?: {
      wall: string;
      position: number;
      purpose?: string;
    };
    style?: 'modern' | 'traditional' | 'contemporary' | 'colonial' | 'industrial';
  };
  fireSafety?: FireSafety;
  accessibility?: Accessibility;
  utilities?: {
    electricalPanel?: {
      location: string;
      capacity?: string;
    };
    waterHeater?: {
      location: string;
      type?: 'tank' | 'tankless';
    };
    hvac?: {
      type: string;
      unitLocations?: string[];
    };
    parking?: {
      type: string;
      capacity: number;
    };
  };
  compliance?: {
    authority?: string;
    setbacks?: {
      front?: number;
      rear?: number;
      left?: number;
      right?: number;
    };
    coverageRatio?: number;
    farRatio?: number;
    notes?: string[];
  };
  designNotes?: string[];
  validationWarnings?: string[]; // Warnings from geometry validation
}

export interface PlannerResponse {
  plan: GeneratedPlan;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export const plannerApi = {
  generate: (data: GeneratePlanRequest) =>
    apiClient.post<PlannerResponse>('/api/planner/generate', data),
};
