import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Canvas } from '@/lib/types';
import {
  getCanvases,
  createIndependentCanvas,
  renameIndependentCanvas,
  deleteIndependentCanvas,
} from '@/lib/commands';

export interface CanvasListState {
  canvases: Canvas[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCanvases: () => Promise<void>;
  createCanvas: (name: string) => Promise<Canvas | null>;
  renameCanvas: (canvasId: string, newName: string) => Promise<void>;
  deleteCanvas: (canvasId: string) => Promise<void>;
}

export const useCanvasListStore = create<CanvasListState>()(
  subscribeWithSelector((set) => ({
    canvases: [],
    isLoading: true,
    error: null,

    fetchCanvases: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await getCanvases();
        set({ canvases: data, isLoading: false });
      } catch (e) {
        set({ error: 'Failed to fetch canvases', isLoading: false });
        console.error('Failed to fetch canvases:', e);
      }
    },

    createCanvas: async (name: string) => {
      try {
        const newCanvas = await createIndependentCanvas(name);
        if (newCanvas) {
          set((state) => ({ canvases: [...state.canvases, newCanvas] }));
        }
        return newCanvas;
      } catch (e) {
        console.error('Failed to create canvas:', e);
        throw e;
      }
    },

    renameCanvas: async (canvasId: string, newName: string) => {
      try {
        await renameIndependentCanvas(canvasId, newName);
        set((state) => ({
          canvases: state.canvases.map((c) =>
            c.id === canvasId
              ? { ...c, name: newName, updated_at: new Date().toISOString() }
              : c,
          ),
        }));
      } catch (e) {
        console.error('Failed to rename canvas:', e);
        throw e;
      }
    },

    deleteCanvas: async (canvasId: string) => {
      try {
        await deleteIndependentCanvas(canvasId);
        set((state) => ({
          canvases: state.canvases.filter((c) => c.id !== canvasId),
        }));
      } catch (e) {
        console.error('Failed to delete canvas:', e);
        throw e;
      }
    },
  })),
);

// Selector hooks
export const useCanvases = () => useCanvasListStore((state) => state.canvases);
export const useCanvasesLoading = () =>
  useCanvasListStore((state) => state.isLoading);

export const useCanvasById = (id: string | null) =>
  useCanvasListStore((state) =>
    id ? state.canvases.find((c) => c.id === id) : undefined,
  );

// Sort canvases by updated_at (most recent first)
export const useCanvasesSorted = () =>
  useCanvasListStore((state) =>
    [...state.canvases].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    ),
  );

// Initialize canvases store
export const initCanvasListStore = async () => {
  await useCanvasListStore.getState().fetchCanvases();
};
