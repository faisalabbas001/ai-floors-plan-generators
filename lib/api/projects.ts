/**
 * Projects API Service
 * Handles project persistence, versioning, and collaboration
 */

import { apiClient, type ApiResponse } from './client';
import type { GeneratedPlan } from './planner';

// Types
export interface ProjectAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  buildingType: string;
  clientName: string;
  address: ProjectAddress;
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'completed';
  plan: GeneratedPlan;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  versionCount?: number;
  collaboratorCount?: number;
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  // Shared project fields
  isShared?: boolean;
  role?: 'admin' | 'editor' | 'viewer';
  permissions?: Record<string, boolean>;
  owner?: { name: string; email: string };
}

export interface ProjectVersion {
  id: number;
  versionNumber: number;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  note: string;
  plan?: GeneratedPlan;
}

export interface Collaborator {
  userId: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: Record<string, boolean>;
  addedAt: string;
}

export interface ProjectFilters {
  status?: string;
  buildingType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  buildingType?: string;
  clientName?: string;
  address?: ProjectAddress;
  status?: Project['status'];
  plan?: GeneratedPlan;
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  versionNote?: string;
}

export interface VersionDiff {
  version1: { number: number; createdAt: string; note: string };
  version2: { number: number; createdAt: string; note: string };
  diff: {
    buildingDimensions: { changed: boolean; before: unknown; after: unknown };
    totalArea: { changed: boolean; before: number; after: number };
    floors: { added: string[]; removed: string[]; modified: string[] };
    rooms: { added: string[]; removed: string[]; modified: string[] };
  };
}

export interface ProjectWithDetails extends Project {
  versions: ProjectVersion[];
  collaborators: Collaborator[];
}

// API Functions
export const projectsApi = {
  // ============================================
  // Project CRUD
  // ============================================

  /**
   * Create a new project
   */
  createProject: async (data: CreateProjectData): Promise<ApiResponse<{ project: Project }>> => {
    return apiClient.post('/api/projects', data);
  },

  /**
   * Get user's projects
   */
  getUserProjects: async (
    filters?: ProjectFilters
  ): Promise<ApiResponse<{ projects: Project[]; count: number }>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.buildingType) params.set('buildingType', filters.buildingType);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const query = params.toString();
    return apiClient.get(`/api/projects${query ? `?${query}` : ''}`);
  },

  /**
   * Get shared projects
   */
  getSharedProjects: async (): Promise<ApiResponse<{ projects: Project[]; count: number }>> => {
    return apiClient.get('/api/projects/shared');
  },

  /**
   * Get project by ID
   */
  getProjectById: async (projectId: number): Promise<ApiResponse<{ project: ProjectWithDetails }>> => {
    return apiClient.get(`/api/projects/${projectId}`);
  },

  /**
   * Update project
   */
  updateProject: async (
    projectId: number,
    data: UpdateProjectData
  ): Promise<ApiResponse<{ project: Project }>> => {
    return apiClient.put(`/api/projects/${projectId}`, data);
  },

  /**
   * Delete project
   */
  deleteProject: async (projectId: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/projects/${projectId}`);
  },

  // ============================================
  // Versioning
  // ============================================

  /**
   * Get project versions
   */
  getProjectVersions: async (
    projectId: number,
    limit?: number
  ): Promise<ApiResponse<{ versions: ProjectVersion[] }>> => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/api/projects/${projectId}/versions${query}`);
  },

  /**
   * Get specific version
   */
  getVersion: async (
    projectId: number,
    versionNumber: number
  ): Promise<ApiResponse<{ version: ProjectVersion }>> => {
    return apiClient.get(`/api/projects/${projectId}/versions/${versionNumber}`);
  },

  /**
   * Restore version
   */
  restoreVersion: async (
    projectId: number,
    versionNumber: number
  ): Promise<ApiResponse<{ restored: boolean; newVersion: ProjectVersion }>> => {
    return apiClient.post(`/api/projects/${projectId}/versions/${versionNumber}/restore`);
  },

  /**
   * Compare two versions
   */
  compareVersions: async (
    projectId: number,
    v1: number,
    v2: number
  ): Promise<ApiResponse<VersionDiff>> => {
    return apiClient.get(`/api/projects/${projectId}/versions/compare?v1=${v1}&v2=${v2}`);
  },

  // ============================================
  // Collaborators
  // ============================================

  /**
   * Get project collaborators
   */
  getCollaborators: async (
    projectId: number
  ): Promise<ApiResponse<{ collaborators: Collaborator[] }>> => {
    return apiClient.get(`/api/projects/${projectId}/collaborators`);
  },

  /**
   * Add collaborator
   */
  addCollaborator: async (
    projectId: number,
    email: string,
    role?: 'admin' | 'editor' | 'viewer',
    permissions?: Record<string, boolean>
  ): Promise<ApiResponse<{ added: boolean; collaboratorId: number; role: string }>> => {
    return apiClient.post(`/api/projects/${projectId}/collaborators`, {
      email,
      role: role || 'viewer',
      permissions,
    });
  },

  /**
   * Update collaborator
   */
  updateCollaborator: async (
    projectId: number,
    collaboratorId: number,
    updates: { role?: 'admin' | 'editor' | 'viewer'; permissions?: Record<string, boolean> }
  ): Promise<ApiResponse<{ updated: boolean }>> => {
    return apiClient.put(`/api/projects/${projectId}/collaborators/${collaboratorId}`, updates);
  },

  /**
   * Remove collaborator
   */
  removeCollaborator: async (
    projectId: number,
    collaboratorId: number
  ): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/projects/${projectId}/collaborators/${collaboratorId}`);
  },
};
