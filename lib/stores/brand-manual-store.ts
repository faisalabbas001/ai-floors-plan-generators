import { create } from 'zustand';
import { toast } from 'sonner';
import {
  brandManualApi,
  type BrandManual,
  type BrandManualSummary,
  type BrandManualPreset,
  type BrandValidationResult,
  type CreateBrandManualData,
} from '@/lib/api/brand-manual';

interface BrandManualState {
  manuals: BrandManualSummary[];
  presets: BrandManualPreset[];
  selectedManual: BrandManual | null;
  validationResult: BrandValidationResult | null;
  isLoading: boolean;
  error: string | null;

  fetchPresets: () => Promise<void>;
  fetchManuals: () => Promise<void>;
  fetchManualById: (id: string | number) => Promise<void>;
  createManual: (data: CreateBrandManualData) => Promise<boolean>;
  updateManual: (id: number, data: Partial<CreateBrandManualData>) => Promise<boolean>;
  deleteManual: (id: number) => Promise<boolean>;
  validatePlan: (manualId: string | number, planData: unknown, projectId?: number) => Promise<boolean>;
  parsePdf: (file: File, bankName: string, manualName?: string) => Promise<CreateBrandManualData | null>;
  clearValidation: () => void;
  clearError: () => void;
}

export const useBrandManualStore = create<BrandManualState>()((set) => ({
  manuals: [],
  presets: [],
  selectedManual: null,
  validationResult: null,
  isLoading: false,
  error: null,

  fetchPresets: async () => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.getPresets();
    if (response.success && response.data) {
      set({ presets: response.data.presets, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  fetchManuals: async () => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.getUserManuals();
    if (response.success && response.data) {
      set({ manuals: response.data.manuals, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  fetchManualById: async (id) => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.getManualById(id);
    if (response.success && response.data) {
      set({ selectedManual: response.data.manual, isLoading: false });
    } else {
      set({ isLoading: false, error: response.message });
    }
  },

  createManual: async (data) => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.createManual(data);
    if (response.success) {
      const listResponse = await brandManualApi.getUserManuals();
      if (listResponse.success && listResponse.data) {
        set({ manuals: listResponse.data.manuals, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      toast.success('Brand manual created successfully');
      return true;
    }
    const errorMsg = response.message || 'Failed to create brand manual';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return false;
  },

  updateManual: async (id, data) => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.updateManual(id, data);
    if (response.success && response.data) {
      set({ selectedManual: response.data.manual, isLoading: false });
      return true;
    }
    set({ isLoading: false, error: response.message });
    return false;
  },

  deleteManual: async (id) => {
    set({ isLoading: true, error: null });
    const response = await brandManualApi.deleteManual(id);
    if (response.success) {
      set((state) => ({
        manuals: state.manuals.filter((m) => m.id !== id),
        isLoading: false,
      }));
      toast.success('Brand manual deleted');
      return true;
    }
    const errorMsg = response.message || 'Failed to delete brand manual';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return false;
  },

  validatePlan: async (manualId, planData, projectId) => {
    set({ isLoading: true, error: null, validationResult: null });
    const response = await brandManualApi.validatePlan(manualId, planData, projectId);
    if (response.success && response.data) {
      set({ validationResult: response.data.validation, isLoading: false });
      toast.success('Validation complete');
      return true;
    }
    const errorMsg = response.message || 'Validation failed';
    set({ isLoading: false, error: errorMsg });
    toast.error(errorMsg);
    return false;
  },

  parsePdf: async (file, bankName, manualName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await brandManualApi.parsePdf(file, bankName, manualName);
      if (response.success && response.data) {
        set({ isLoading: false });
        toast.success('PDF parsed successfully! Review the extracted data.');
        return response.data.parsed as CreateBrandManualData;
      }
      const errorMsg = response.message || 'Failed to parse PDF';
      set({ isLoading: false, error: errorMsg });
      toast.error(errorMsg);
      return null;
    } catch {
      set({ isLoading: false, error: 'Failed to parse PDF' });
      toast.error('Failed to parse PDF');
      return null;
    }
  },

  clearValidation: () => set({ validationResult: null }),
  clearError: () => set({ error: null }),
}));
