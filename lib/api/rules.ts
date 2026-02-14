/**
 * Rules API Service
 * Handles building codes and plan validation
 */

import { apiClient, type ApiResponse } from './client';
import type { GeneratedPlan } from './planner';

// Types
export interface BuildingCodeInfo {
  id: string;
  name: string;
  jurisdiction: string;
  region: string;
  version: string;
}

export interface RoomSizeRule {
  min: number;
  recommended: number;
}

export interface DoorRule {
  minWidth: number;
  maxWidth: number;
  height: number;
}

export interface BuildingCodeRules {
  minRoomSizes: Record<string, RoomSizeRule>;
  minDimensions: Record<string, number>;
  ceilingHeights: Record<string, { min: number; recommended: number }>;
  doors: Record<string, DoorRule>;
  windows: {
    minGlazingRatio: number;
    maxGlazingRatio: number;
    minSillHeight: number;
    maxSillHeight: number;
    bathroomSillHeight: number;
    egressWidth: number;
    egressHeight: number;
  };
  stairs: {
    minWidth: number;
    maxRise: number;
    minRun: number;
    maxFlight: number;
    handrailHeight: number;
    guardrailHeight: number;
  };
  fireSafety: {
    minExits: number;
    maxTravelDistance: number;
    exitWidth: number;
    sprinklerRequired: number;
    smokeDetectorSpacing: number;
  };
  accessibility: {
    doorWidth: number;
    corridorWidth: number;
    turningRadius: number;
    rampSlope: number;
    grabBarHeight: number;
  };
  structural: {
    maxColumnSpacing: number;
    minColumnSpacing: number;
    loadBearingWallThickness: number;
    partitionWallThickness: number;
    exteriorWallThickness: number;
  };
  setbacks: {
    front: number;
    rear: number;
    side: number;
    corner: number;
  };
  occupancy: Record<string, number>;
}

export interface BuildingCode extends BuildingCodeInfo {
  rules: BuildingCodeRules;
}

export interface RoomRules {
  minSize?: RoomSizeRule;
  minDimensions: { width?: number; length?: number };
  doors?: DoorRule;
  windows?: BuildingCodeRules['windows'];
  ceilingHeight?: { min: number; recommended: number };
}

export interface BuildingTypeRules {
  roomRequirements: {
    required: string[];
    optional: string[];
  };
  adjacencyRules?: Array<{
    room1: string;
    room2: string;
    required?: boolean;
    preferred?: boolean;
    forbidden?: boolean;
    maxDistance?: number;
  }>;
  circulationRules?: {
    maxCorridorLength?: number;
    minCorridorWidth?: number;
    deadEndMaxLength?: number;
  };
  securityRules?: Record<string, unknown>;
  classroomRules?: Record<string, unknown>;
  kitchenRules?: Record<string, unknown>;
}

export interface ValidationError {
  type: string;
  message: string;
  floor?: string;
  room?: string;
  actual?: number | string;
  required?: number | string;
  recommended?: number | string;
  rooms?: string[];
}

export interface ValidationResult {
  valid: boolean;
  codeUsed?: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    roomsChecked?: number;
  };
}

export interface CompanyStandard {
  id: number;
  name: string;
  buildingType: string | null;
  rules: Partial<BuildingCodeRules>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Functions
export const rulesApi = {
  // ============================================
  // Building Codes
  // ============================================

  /**
   * Get available building codes
   */
  getAvailableCodes: async (): Promise<ApiResponse<{ codes: BuildingCodeInfo[] }>> => {
    return apiClient.get('/api/rules/codes');
  },

  /**
   * Get building code details
   */
  getBuildingCode: async (codeId: string): Promise<ApiResponse<{ code: BuildingCode }>> => {
    return apiClient.get(`/api/rules/codes/${codeId}`);
  },

  /**
   * Get rules for a specific room type
   */
  getRoomRules: async (
    roomType: string,
    codeId?: string
  ): Promise<ApiResponse<{ roomType: string; rules: RoomRules }>> => {
    const query = codeId ? `?code=${codeId}` : '';
    return apiClient.get(`/api/rules/room/${roomType}${query}`);
  },

  /**
   * Get building type specific rules
   */
  getBuildingTypeRules: async (
    buildingType: string
  ): Promise<ApiResponse<{ buildingType: string; rules: BuildingTypeRules }>> => {
    return apiClient.get(`/api/rules/building-type/${buildingType}`);
  },

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate plan against building code
   */
  validatePlan: async (
    plan: GeneratedPlan,
    codeId?: string
  ): Promise<ApiResponse<ValidationResult>> => {
    return apiClient.post('/api/rules/validate', { plan, code: codeId || 'IBC_2021' });
  },

  /**
   * Validate plan with company standard
   */
  validateWithCompanyStandard: async (
    plan: GeneratedPlan,
    standardId: number
  ): Promise<ApiResponse<ValidationResult>> => {
    return apiClient.post('/api/rules/validate/custom', { plan, standardId });
  },

  // ============================================
  // Company Standards
  // ============================================

  /**
   * Get user's company standards
   */
  getCompanyStandards: async (): Promise<ApiResponse<{ standards: CompanyStandard[] }>> => {
    return apiClient.get('/api/rules/standards');
  },

  /**
   * Save company standard
   */
  saveCompanyStandard: async (
    name: string,
    rules: Partial<BuildingCodeRules>,
    options?: { buildingType?: string; isDefault?: boolean }
  ): Promise<ApiResponse<{ standard: CompanyStandard }>> => {
    return apiClient.post('/api/rules/standards', {
      name,
      rules,
      buildingType: options?.buildingType,
      isDefault: options?.isDefault,
    });
  },

  /**
   * Delete company standard
   */
  deleteCompanyStandard: async (standardId: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/rules/standards/${standardId}`);
  },
};
