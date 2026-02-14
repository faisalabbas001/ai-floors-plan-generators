/**
 * Brand Manual API Service
 * Handles brand manual management and validation operations
 */

import { apiClient, type ApiResponse } from './client';

// Types
export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    headingFont: string;
    bodyFont: string;
    sizes: Record<string, string>;
  };
  spacing: Record<string, number>;
}

export interface LayoutRule {
  zones: Array<{
    id: string;
    name: string;
    position: string;
    priority: number;
    adjacentTo?: string[];
  }>;
  adjacencyRules: Array<{
    zone1: string;
    zone2: string;
    required: boolean;
  }>;
}

export interface TierTemplate {
  id: string;
  name: string;
  tier: number;
  hasMorcha: boolean;
  totalArea: number;
  unit: string;
  rooms: Array<{
    id: string;
    name: string;
    area: number;
    [key: string]: unknown;
  }>;
}

export interface FurnitureSpec {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  material: string;
  zone: string;
}

export interface MaterialSpec {
  id: string;
  name: string;
  code: string;
  type: string;
  size?: string;
  color: string;
  zone: string;
}

export interface BrandManual {
  id: number | string;
  user_id?: number;
  name: string;
  bank_name: string;
  description: string;
  design_tokens: DesignTokens;
  components: Record<string, unknown>;
  layout_rules: LayoutRule;
  tier_templates: TierTemplate[];
  furniture_specs: FurnitureSpec[];
  material_specs: MaterialSpec[];
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandManualSummary {
  id: number;
  name: string;
  bank_name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BrandManualPreset {
  id: string;
  name: string;
  bank_name: string;
  description: string;
  tiers: number;
  furnitureCount: number;
  materialCount: number;
}

export interface BrandValidationResult {
  manual_id: string;
  manual_name: string;
  bank_name: string;
  score: number;
  totalChecks: number;
  passed: number;
  failed: number;
  violations: Array<{
    rule: string;
    severity: string;
    message: string;
    [key: string]: unknown;
  }>;
  passes: Array<{
    rule: string;
    message: string;
    [key: string]: unknown;
  }>;
  recommendations: string[];
}

export interface CreateBrandManualData {
  name: string;
  bank_name: string;
  description?: string;
  design_tokens?: Partial<DesignTokens>;
  components?: Record<string, unknown>;
  layout_rules?: Partial<LayoutRule>;
  tier_templates?: TierTemplate[];
  furniture_specs?: FurnitureSpec[];
  material_specs?: MaterialSpec[];
  status?: string;
}

// API Functions
export const brandManualApi = {
  /**
   * Get built-in brand manual presets
   */
  getPresets: async (): Promise<ApiResponse<{ presets: BrandManualPreset[] }>> => {
    return apiClient.get('/api/brand-manual/presets');
  },

  /**
   * Create a new brand manual
   */
  createManual: async (data: CreateBrandManualData): Promise<ApiResponse<{ manual: BrandManual }>> => {
    return apiClient.post('/api/brand-manual', data);
  },

  /**
   * Get user's brand manuals
   */
  getUserManuals: async (): Promise<ApiResponse<{ manuals: BrandManualSummary[]; count: number }>> => {
    return apiClient.get('/api/brand-manual');
  },

  /**
   * Get brand manual by ID (user-created or preset)
   */
  getManualById: async (id: string | number): Promise<ApiResponse<{ manual: BrandManual }>> => {
    return apiClient.get(`/api/brand-manual/${id}`);
  },

  /**
   * Update brand manual
   */
  updateManual: async (
    id: number,
    data: Partial<CreateBrandManualData>
  ): Promise<ApiResponse<{ manual: BrandManual }>> => {
    return apiClient.put(`/api/brand-manual/${id}`, data);
  },

  /**
   * Delete brand manual
   */
  deleteManual: async (id: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/brand-manual/${id}`);
  },

  /**
   * Validate a floor plan against a brand manual
   */
  validatePlan: async (
    manualId: string | number,
    planData: unknown,
    projectId?: number
  ): Promise<ApiResponse<{ validation: BrandValidationResult }>> => {
    return apiClient.post(`/api/brand-manual/${manualId}/validate`, {
      plan_data: planData,
      project_id: projectId,
    });
  },

  /**
   * Upload a PDF and parse it into brand manual data using AI
   */
  parsePdf: async (
    file: File,
    bankName: string,
    manualName?: string
  ): Promise<ApiResponse<{ parsed: CreateBrandManualData & { _extraction_meta?: Record<string, unknown> } }>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank_name', bankName);
    if (manualName) formData.append('name', manualName);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-floors-plan-backed-production.up.railway.app';

    try {
      const response = await fetch(
        `${baseUrl}/api/brand-manual/parse-pdf`,
        {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        return {
          success: false,
          message: errorData.message || `Upload failed with status ${response.status}`,
        };
      }

      return response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error during PDF upload',
      };
    }
  },
};
