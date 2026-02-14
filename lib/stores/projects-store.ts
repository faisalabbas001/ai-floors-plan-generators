import { create } from 'zustand';
import { toast } from 'sonner';
import {
  projectsApi,
  type Project,
  type ProjectVersion,
  type Collaborator,
  type CreateProjectData,
  type UpdateProjectData,
  type ProjectFilters,
} from '@/lib/api/projects';

interface ProjectsState {
  projects: Project[];
  sharedProjects: Project[];
  currentProject: Project | null;
  versions: ProjectVersion[];
  collaborators: Collaborator[];
  isLoading: boolean;
  error: string | null;

  fetchProjects: (filters?: ProjectFilters) => Promise<void>;
  fetchSharedProjects: () => Promise<void>;
  fetchAllProjects: (filters?: ProjectFilters) => Promise<void>;
  fetchProjectById: (id: number) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<number | null>;
  updateProject: (id: number, data: UpdateProjectData) => Promise<boolean>;
  deleteProject: (id: number) => Promise<boolean>;
  fetchVersions: (projectId: number) => Promise<void>;
  restoreVersion: (projectId: number, versionNumber: number) => Promise<boolean>;
  fetchCollaborators: (projectId: number) => Promise<void>;
  addCollaborator: (projectId: number, email: string, role?: string) => Promise<boolean>;
  removeCollaborator: (projectId: number, collaboratorId: number) => Promise<boolean>;
  clearError: () => void;
  clearCurrentProject: () => void;
}

export const useProjectsStore = create<ProjectsState>()((set, get) => ({
  projects: [],
  sharedProjects: [],
  currentProject: null,
  versions: [],
  collaborators: [],
  isLoading: false,
  error: null,

  fetchProjects: async (filters) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getUserProjects(filters);
    if (response.success && response.data) {
      set({ projects: response.data.projects, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  fetchSharedProjects: async () => {
    const response = await projectsApi.getSharedProjects();
    if (response.success && response.data) {
      // Mark shared projects with isShared flag
      const shared = (response.data.projects || []).map((p: Project) => ({
        ...p,
        isShared: true,
      }));
      set({ sharedProjects: shared });
    }
  },

  // Fetch both owned and shared projects in parallel
  fetchAllProjects: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const [ownedResponse, sharedResponse] = await Promise.all([
        projectsApi.getUserProjects(filters),
        projectsApi.getSharedProjects(),
      ]);

      const ownedProjects = ownedResponse.success && ownedResponse.data
        ? ownedResponse.data.projects
        : [];

      const sharedProjects = sharedResponse.success && sharedResponse.data
        ? (sharedResponse.data.projects || []).map((p: Project) => ({
            ...p,
            isShared: true,
          }))
        : [];

      set({
        projects: ownedProjects,
        sharedProjects,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch projects' });
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getProjectById(id);
    if (response.success && response.data) {
      set({ currentProject: response.data.project, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.createProject(data);
    if (response.success && response.data) {
      const newProject = response.data.project;
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }));
      toast.success('Project created successfully');
      return newProject.id;
    }
    const errorMsg = response.message || 'Failed to create project';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return null;
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.updateProject(id, data);
    if (response.success && response.data) {
      const updated = response.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        isLoading: false,
      }));
      toast.success('Project updated successfully');
      return true;
    }
    const errorMsg = response.message || 'Failed to update project';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return false;
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.deleteProject(id);
    if (response.success) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
      toast.success('Project deleted');
      return true;
    }
    const errorMsg = response.message || 'Failed to delete project';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return false;
  },

  fetchVersions: async (projectId) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getProjectVersions(projectId);
    if (response.success && response.data) {
      set({ versions: response.data.versions, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  restoreVersion: async (projectId, versionNumber) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.restoreVersion(projectId, versionNumber);
    if (response.success) {
      set({ isLoading: false });
      return true;
    }
    set({ isLoading: false, error: response.message });
    return false;
  },

  fetchCollaborators: async (projectId) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.getCollaborators(projectId);
    if (response.success && response.data) {
      set({ collaborators: response.data.collaborators, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  addCollaborator: async (projectId, email, role) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.addCollaborator(projectId, email, (role || 'viewer') as 'admin' | 'editor' | 'viewer');
    if (response.success) {
      // Refresh collaborators
      const collabResponse = await projectsApi.getCollaborators(projectId);
      if (collabResponse.success && collabResponse.data) {
        set({ collaborators: collabResponse.data.collaborators, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return true;
    }
    set({ isLoading: false, error: response.message });
    return false;
  },

  removeCollaborator: async (projectId, collaboratorId) => {
    set({ isLoading: true, error: null });
    const response = await projectsApi.removeCollaborator(projectId, collaboratorId);
    if (response.success) {
      set((state) => ({
        collaborators: state.collaborators.filter((c) => c.userId !== collaboratorId),
        isLoading: false,
      }));
      return true;
    }
    set({ isLoading: false, error: response.message });
    return false;
  },

  clearError: () => set({ error: null }),
  clearCurrentProject: () => set({ currentProject: null, versions: [], collaborators: [] }),
}));
