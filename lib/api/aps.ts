/**
 * Autodesk Platform Services (APS) API
 * Handles Revit integration and model generation
 */

import { apiClient, type ApiResponse } from './client';
import type { GeneratedPlan } from './planner';

// Types
export interface APSStatus {
  configured: boolean;
  hasValidToken: boolean;
  tokenExpiresIn: number;
  nickname: string;
}

export interface WorkItemStatus {
  id: string;
  status: 'pending' | 'inprogress' | 'success' | 'failed' | 'cancelled';
  progress?: string;
  reportUrl?: string;
  stats?: {
    timeQueued?: number;
    timeDownloadStarted?: number;
    timeInstructionsStarted?: number;
    timeInstructionsEnded?: number;
    timeUploadEnded?: number;
  };
}

export interface RevitGenerationResult {
  success: boolean;
  workItemId: string;
  status: string;
  message?: string;
  files?: {
    rvt?: string;
    pdf?: string;
  };
  reportUrl?: string;
}

export interface TranslationResult {
  urn: string;
  status: string;
  progress?: string;
  derivatives?: Array<{
    name: string;
    hasThumbnail: string;
    status: string;
    outputType: string;
  }>;
}

export interface UploadedTemplate {
  id?: number;
  objectKey: string;
  bucketKey: string;
  urn: string;
  size: number;
  templateName?: string;
  buildingType?: string;
}

export interface RevitTemplate {
  id: number;
  template_name: string;
  building_type: string;
  file_name: string;
  oss_urn: string;
  file_size: number;
  created_at: string;
  is_active: boolean;
  user_id: number;
}

// API Functions
export const apsApi = {
  /**
   * Get APS service status
   */
  getStatus: async (): Promise<ApiResponse<APSStatus>> => {
    return apiClient.get('/api/aps/status');
  },

  /**
   * Authenticate with APS
   */
  authenticate: async (): Promise<
    ApiResponse<{ authenticated: boolean; tokenExpiresIn: number }>
  > => {
    return apiClient.post('/api/aps/authenticate');
  },

  /**
   * Generate Revit model from plan
   * @param plan The floor plan data
   * @param templateUrn Optional Revit template URN
   * @param callbackUrl Optional callback URL for async processing
   */
  generateRevitModel: async (
    plan: GeneratedPlan,
    templateUrn?: string,
    callbackUrl?: string
  ): Promise<ApiResponse<RevitGenerationResult>> => {
    return apiClient.post('/api/aps/generate-revit', {
      plan,
      templateUrn,
      callbackUrl,
    });
  },

  /**
   * Check work item status
   */
  getWorkItemStatus: async (workItemId: string): Promise<ApiResponse<WorkItemStatus>> => {
    return apiClient.get(`/api/aps/workitem/${workItemId}`);
  },

  /**
   * Poll for work item completion
   * @param workItemId The work item ID to poll
   * @param maxAttempts Maximum number of polling attempts
   * @param intervalMs Polling interval in milliseconds
   */
  pollWorkItemStatus: async (
    workItemId: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<WorkItemStatus> => {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await apsApi.getWorkItemStatus(workItemId);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get work item status');
      }

      const status = response.data;

      if (status.status === 'success' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Work item polling timed out');
  },

  /**
   * Upload Revit template
   */
  uploadTemplate: async (
    file: File,
    name: string,
    buildingType?: string
  ): Promise<ApiResponse<UploadedTemplate>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (buildingType) formData.append('buildingType', buildingType);

    // Use raw fetch for FormData
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://ai-floors-plan-backed-production.up.railway.app'}/api/aps/templates`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    );

    return response.json();
  },

  /**
   * Get all uploaded templates
   */
  getTemplates: async (): Promise<ApiResponse<{ templates: RevitTemplate[] }>> => {
    return apiClient.get('/api/aps/templates');
  },

  /**
   * Translate file for web viewing
   */
  translateForViewing: async (urn: string): Promise<ApiResponse<TranslationResult>> => {
    return apiClient.post('/api/aps/translate', { urn });
  },

  /**
   * Get translation status
   */
  getTranslationStatus: async (urn: string): Promise<ApiResponse<TranslationResult>> => {
    const base64Urn = btoa(urn).replace(/=/g, '');
    return apiClient.get(`/api/aps/translation/${base64Urn}`);
  },
};
