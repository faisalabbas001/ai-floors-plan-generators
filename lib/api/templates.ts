/**
 * Templates API Service
 * Handles template library operations
 */

import { apiClient, type ApiResponse } from './client';
import type { GeneratedPlan } from './planner';

// Types
export interface TemplateRoomSummary {
  id: string;
  name: string;
  type: string;
  areaSqft: number;
  dimensions: { width: number; length: number };
  position: { x: number; y: number };
  features: string[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  minArea: number;
  maxArea: number;
  floors: number;
  thumbnail?: string;
  buildingDimensions?: { width: number; depth: number };
  roomCount?: number;
  roomSummary?: TemplateRoomSummary[];
  highlights?: string[];
}

export interface FullTemplate extends TemplateInfo {
  template: GeneratedPlan;
}

export interface TemplateCategory {
  id: string;
  name: string;
  count: number;
}

export interface ApplyTemplateResult {
  templateId: string;
  templateName: string;
  plan: GeneratedPlan;
  customizations: TemplateCustomizations;
}

export interface TemplateCustomizations {
  buildingDimensions?: { width: number; depth: number };
  rooms?: Array<{ id: string; [key: string]: unknown }>;
  style?: string;
}

export interface TemplateSearchFilters {
  category?: string;
  minArea?: number;
  maxArea?: number;
  floors?: number;
}

export interface CustomTemplate {
  id: number;
  name: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullCustomTemplate extends CustomTemplate {
  template: GeneratedPlan;
}

// API Functions
export const templatesApi = {
  /**
   * Get all available templates
   */
  getAllTemplates: async (): Promise<ApiResponse<{ templates: TemplateInfo[] }>> => {
    return apiClient.get('/api/templates');
  },

  /**
   * Get available categories
   */
  getCategories: async (): Promise<ApiResponse<{ categories: TemplateCategory[] }>> => {
    return apiClient.get('/api/templates/categories');
  },

  /**
   * Get templates by category
   */
  getTemplatesByCategory: async (
    category: string
  ): Promise<ApiResponse<{ templates: TemplateInfo[] }>> => {
    return apiClient.get(`/api/templates/category/${category}`);
  },

  /**
   * Search templates
   */
  searchTemplates: async (
    query?: string,
    filters?: TemplateSearchFilters
  ): Promise<ApiResponse<{ templates: TemplateInfo[]; count: number }>> => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.minArea) params.set('minArea', filters.minArea.toString());
    if (filters?.maxArea) params.set('maxArea', filters.maxArea.toString());
    if (filters?.floors) params.set('floors', filters.floors.toString());

    return apiClient.get(`/api/templates/search?${params.toString()}`);
  },

  /**
   * Get template by ID (full template with plan data)
   */
  getTemplateById: async (templateId: string): Promise<ApiResponse<{ template: FullTemplate }>> => {
    return apiClient.get(`/api/templates/builtin/${templateId}`);
  },

  /**
   * Apply template with optional customizations
   */
  applyTemplate: async (
    templateId: string,
    customizations?: TemplateCustomizations
  ): Promise<ApiResponse<ApplyTemplateResult>> => {
    return apiClient.post('/api/templates/apply', { templateId, customizations });
  },

  // ============================================
  // Custom Templates (User-created)
  // ============================================

  /**
   * Save custom template
   */
  saveCustomTemplate: async (
    name: string,
    plan: GeneratedPlan,
    options?: { category?: string; description?: string; isPublic?: boolean }
  ): Promise<ApiResponse<CustomTemplate>> => {
    return apiClient.post('/api/templates/custom', {
      name,
      plan,
      category: options?.category,
      description: options?.description,
      isPublic: options?.isPublic,
    });
  },

  /**
   * Get user's custom templates
   */
  getUserTemplates: async (): Promise<ApiResponse<{ templates: CustomTemplate[] }>> => {
    return apiClient.get('/api/templates/custom');
  },

  /**
   * Get custom template by ID
   */
  getCustomTemplateById: async (
    templateId: number
  ): Promise<ApiResponse<{ template: FullCustomTemplate }>> => {
    return apiClient.get(`/api/templates/custom/${templateId}`);
  },

  /**
   * Delete custom template
   */
  deleteCustomTemplate: async (templateId: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/templates/custom/${templateId}`);
  },
};
