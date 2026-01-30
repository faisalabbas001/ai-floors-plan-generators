import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { plannerApi, GeneratedPlan, PlannerMeta } from '@/lib/api';

// Preview mode type
export type PreviewMode = '2d' | '3d' | 'technical';

// History item interface
export interface PlanHistoryItem {
  id: string;
  prompt: string;
  meta: PlannerMeta;
  plan: GeneratedPlan;
  style: string;
  aspectRatio: string;
  viewMode: PreviewMode;
  createdAt: string;
}

interface PlannerState {
  prompt: string;
  meta: PlannerMeta;
  generatedPlan: GeneratedPlan | null;
  isGenerating: boolean;
  error: string | null;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;

  // Style and view settings
  selectedStyle: string;
  selectedRatio: string;
  previewMode: PreviewMode;

  // History
  history: PlanHistoryItem[];

  // Actions
  setPrompt: (prompt: string) => void;
  setMeta: (meta: Partial<PlannerMeta>) => void;
  resetMeta: () => void;
  setSelectedStyle: (style: string) => void;
  setSelectedRatio: (ratio: string) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  generatePlan: () => Promise<boolean>;
  clearPlan: () => void;
  clearError: () => void;

  // History actions
  addToHistory: (item: Omit<PlanHistoryItem, 'id' | 'createdAt'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => void;
}

const defaultMeta: PlannerMeta = {
  buildingType: '',
  city: '',
  authority: '',
  plotArea: undefined,
  floors: [],
  budget: '',
  style: '',
  specialRequirements: [],
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      prompt: '',
      meta: { ...defaultMeta },
      generatedPlan: null,
      isGenerating: false,
      error: null,
      usage: null,
      selectedStyle: 'technical',
      selectedRatio: '16:9',
      previewMode: '2d',
      history: [],

      setPrompt: (prompt: string) => set({ prompt }),

      setMeta: (meta: Partial<PlannerMeta>) =>
        set((state) => ({
          meta: { ...state.meta, ...meta },
        })),

      resetMeta: () => set({ meta: { ...defaultMeta } }),

      setSelectedStyle: (style: string) => set({ selectedStyle: style }),

      setSelectedRatio: (ratio: string) => set({ selectedRatio: ratio }),

      setPreviewMode: (mode: PreviewMode) => set({ previewMode: mode }),

      generatePlan: async () => {
        const { prompt, meta, selectedStyle, selectedRatio, previewMode } = get();

        if (!prompt || prompt.length < 10) {
          set({ error: 'Please enter a prompt with at least 10 characters' });
          return false;
        }

        set({ isGenerating: true, error: null });

        const cleanMeta: PlannerMeta = {};
        if (meta.buildingType) cleanMeta.buildingType = meta.buildingType;
        if (meta.city) cleanMeta.city = meta.city;
        if (meta.authority) cleanMeta.authority = meta.authority;
        if (meta.plotArea) cleanMeta.plotArea = meta.plotArea;
        if (meta.floors && meta.floors.length > 0) cleanMeta.floors = meta.floors;
        if (meta.budget) cleanMeta.budget = meta.budget;
        if (meta.style) cleanMeta.style = meta.style;
        if (meta.specialRequirements && meta.specialRequirements.length > 0) {
          cleanMeta.specialRequirements = meta.specialRequirements;
        }

        const response = await plannerApi.generate({
          prompt,
          meta: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
        });

        if (response.success && response.data) {
          const plan = response.data.plan;

          // Add to history
          get().addToHistory({
            prompt,
            meta: { ...meta },
            plan,
            style: selectedStyle,
            aspectRatio: selectedRatio,
            viewMode: previewMode,
          });

          set({
            generatedPlan: plan,
            usage: response.data.usage,
            isGenerating: false,
            error: null,
          });
          return true;
        }

        set({
          isGenerating: false,
          error: response.message || 'Failed to generate plan',
        });

        return false;
      },

      clearPlan: () =>
        set({
          generatedPlan: null,
          usage: null,
          error: null,
        }),

      clearError: () => set({ error: null }),

      // History actions
      addToHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.history,
          ].slice(0, 50), // Keep max 50 items
        })),

      removeFromHistory: (id: string) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      loadFromHistory: (id: string) => {
        const { history } = get();
        const item = history.find((h) => h.id === id);
        if (item) {
          set({
            prompt: item.prompt,
            meta: item.meta,
            generatedPlan: item.plan,
            selectedStyle: item.style,
            selectedRatio: item.aspectRatio,
            previewMode: item.viewMode,
          });
        }
      },
    }),
    {
      name: 'planner-storage',
      partialize: (state) => ({
        history: state.history,
        selectedStyle: state.selectedStyle,
        selectedRatio: state.selectedRatio,
        previewMode: state.previewMode,
      }),
    }
  )
);
