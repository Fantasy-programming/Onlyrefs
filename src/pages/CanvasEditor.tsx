import React, { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CanvasData,
  CanvasItem,
  CanvasFrame,
  CanvasAnnotation,
  CanvasViewport,
  CanvasSettings,
  CanvasPosition,
  CanvasSize,
  DEFAULT_CANVAS_DATA,
  CANVAS_CONSTRAINTS,
} from '@/lib/types';
import {
  loadIndependentCanvas,
  saveIndependentCanvas,
  generate_id,
} from '@/lib/commands';
import { debounce } from 'lodash-es';
import { useCanvasById } from '@/state/canvasliststore';
import { useRefs } from '@/state/refstore';
import { CanvasStoreProvider } from '@/components/Canvas/CanvasStoreContext';
import { CanvasViewport as CanvasViewportComponent } from '@/components/Canvas/CanvasViewport';
import { CanvasItem as CanvasItemComponent } from '@/components/Canvas/CanvasItem';
import { CanvasFrame as CanvasFrameComponent } from '@/components/Canvas/CanvasFrame';
import { CanvasAnnotation as CanvasAnnotationComponent } from '@/components/Canvas/CanvasAnnotation';
import { CanvasToolbar } from '@/components/Canvas/CanvasToolbar';
import { CanvasSelectionBox } from '@/components/Canvas/CanvasSelectionBox';
import { CanvasContextMenu } from '@/components/Canvas/CanvasContextMenu';

// ============================================
// Independent Canvas Store
// ============================================

export type CanvasTool = 'select' | 'pan' | 'text' | 'frame';

export interface CanvasSelection {
  itemIds: string[];
  frameIds: string[];
  annotationIds: string[];
}

interface HistoryEntry {
  items: CanvasItem[];
  frames: CanvasFrame[];
  annotations: CanvasAnnotation[];
}

export interface IndependentCanvasState {
  canvasId: string | null;
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;

  items: CanvasItem[];
  frames: CanvasFrame[];
  annotations: CanvasAnnotation[];
  viewport: CanvasViewport;
  settings: CanvasSettings;

  tool: CanvasTool;
  selection: CanvasSelection;
  isPanning: boolean;

  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  initCanvas: (canvasId: string) => Promise<void>;
  saveCanvasData: () => Promise<void>;
  resetCanvas: () => void;

  addItem: (refId: string, position: CanvasPosition, size: CanvasSize) => void;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;

  addFrame: (
    position: CanvasPosition,
    size: CanvasSize,
    title?: string,
  ) => void;
  updateFrame: (id: string, updates: Partial<CanvasFrame>) => void;
  removeFrame: (id: string) => void;

  addAnnotation: (position: CanvasPosition) => void;
  updateAnnotation: (id: string, updates: Partial<CanvasAnnotation>) => void;
  removeAnnotation: (id: string) => void;

  setViewport: (viewport: Partial<CanvasViewport>) => void;
  zoomTo: (zoom: number, center?: CanvasPosition) => void;
  zoomToFit: (containerWidth: number, containerHeight: number) => void;
  panTo: (x: number, y: number) => void;

  select: (ids: Partial<CanvasSelection>) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addToSelection: (ids: Partial<CanvasSelection>) => void;
  removeFromSelection: (ids: Partial<CanvasSelection>) => void;

  setTool: (tool: CanvasTool) => void;
  setIsPanning: (isPanning: boolean) => void;

  updateSettings: (settings: Partial<CanvasSettings>) => void;

  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  duplicateSelection: () => void;
  deleteSelection: () => void;
  lockSelection: () => void;
  unlockSelection: () => void;
}

const getNextZIndex = (state: IndependentCanvasState): number => {
  const maxItem = Math.max(0, ...state.items.map((i) => i.zIndex));
  const maxFrame = Math.max(0, ...state.frames.map((f) => f.zIndex));
  const maxAnnotation = Math.max(0, ...state.annotations.map((a) => a.zIndex));
  return Math.max(maxItem, maxFrame, maxAnnotation) + 1;
};

const debouncedSave = debounce(async (canvasId: string, data: CanvasData) => {
  try {
    await saveIndependentCanvas(canvasId, data);
  } catch (e) {
    console.error('Failed to auto-save canvas:', e);
  }
}, 1000);

export const useIndependentCanvasStore = create<IndependentCanvasState>()(
  subscribeWithSelector((set, get) => ({
    canvasId: null,
    isLoading: false,
    isDirty: false,
    error: null,
    items: [],
    frames: [],
    annotations: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    settings: DEFAULT_CANVAS_DATA.settings,
    tool: 'select',
    selection: { itemIds: [], frameIds: [], annotationIds: [] },
    isPanning: false,
    history: [],
    historyIndex: -1,

    initCanvas: async (canvasId: string) => {
      set({ isLoading: true, error: null, canvasId });
      try {
        const data = await loadIndependentCanvas(canvasId);
        set({
          items: data.items,
          frames: data.frames,
          annotations: data.annotations,
          viewport: data.viewport,
          settings: data.settings,
          isLoading: false,
          isDirty: false,
          selection: { itemIds: [], frameIds: [], annotationIds: [] },
          history: [],
          historyIndex: -1,
        });
      } catch (e) {
        console.error('Failed to load canvas:', e);
        set({
          error: 'Failed to load canvas',
          isLoading: false,
        });
      }
    },

    saveCanvasData: async () => {
      const state = get();
      if (!state.canvasId) return;

      const data: CanvasData = {
        version: 1,
        items: state.items,
        frames: state.frames,
        annotations: state.annotations,
        viewport: state.viewport,
        settings: state.settings,
      };

      try {
        await saveIndependentCanvas(state.canvasId, data);
        set({ isDirty: false });
      } catch (e) {
        console.error('Failed to save canvas:', e);
        set({ error: 'Failed to save canvas' });
      }
    },

    resetCanvas: () => {
      set({
        canvasId: null,
        isLoading: false,
        isDirty: false,
        error: null,
        items: [],
        frames: [],
        annotations: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        settings: DEFAULT_CANVAS_DATA.settings,
        tool: 'select',
        selection: { itemIds: [], frameIds: [], annotationIds: [] },
        isPanning: false,
        history: [],
        historyIndex: -1,
      });
    },

    addItem: (refId, position, size) => {
      const state = get();
      const newItem: CanvasItem = {
        id: generate_id({ length: 13 }),
        refId,
        position,
        size: {
          width: Math.max(
            CANVAS_CONSTRAINTS.item.minWidth,
            Math.min(size.width, CANVAS_CONSTRAINTS.item.maxWidth),
          ),
          height: Math.max(
            CANVAS_CONSTRAINTS.item.minHeight,
            Math.min(size.height, CANVAS_CONSTRAINTS.item.maxHeight),
          ),
        },
        rotation: 0,
        zIndex: getNextZIndex(state),
        locked: false,
      };

      state.pushHistory();
      set((s) => ({ items: [...s.items, newItem], isDirty: true }));

      if (state.canvasId) {
        debouncedSave(state.canvasId, {
          version: 1,
          items: [...state.items, newItem],
          frames: state.frames,
          annotations: state.annotations,
          viewport: state.viewport,
          settings: state.settings,
        });
      }
    },

    updateItem: (id, updates) => {
      const state = get();
      set((s) => ({
        items: s.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    removeItem: (id) => {
      const state = get();
      state.pushHistory();
      set((s) => ({
        items: s.items.filter((item) => item.id !== id),
        selection: {
          ...s.selection,
          itemIds: s.selection.itemIds.filter((i) => i !== id),
        },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    removeItems: (ids) => {
      const state = get();
      state.pushHistory();
      set((s) => ({
        items: s.items.filter((item) => !ids.includes(item.id)),
        selection: {
          ...s.selection,
          itemIds: s.selection.itemIds.filter((i) => !ids.includes(i)),
        },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    addFrame: (position, size, title = 'Frame') => {
      const state = get();
      const newFrame: CanvasFrame = {
        id: generate_id({ length: 13 }),
        title,
        position,
        size,
        color: '#f5f5f5',
        zIndex: 0,
        locked: false,
      };

      state.pushHistory();
      set((s) => ({ frames: [...s.frames, newFrame], isDirty: true }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    updateFrame: (id, updates) => {
      const state = get();
      set((s) => ({
        frames: s.frames.map((frame) =>
          frame.id === id ? { ...frame, ...updates } : frame,
        ),
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    removeFrame: (id) => {
      const state = get();
      state.pushHistory();

      set((s) => ({
        frames: s.frames.filter((frame) => frame.id !== id),
        items: s.items.map((item) =>
          item.frameId === id ? { ...item, frameId: undefined } : item,
        ),
        annotations: s.annotations.map((ann) =>
          ann.frameId === id ? { ...ann, frameId: undefined } : ann,
        ),
        selection: {
          ...s.selection,
          frameIds: s.selection.frameIds.filter((f) => f !== id),
        },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    addAnnotation: (position) => {
      const state = get();
      const newAnnotation: CanvasAnnotation = {
        id: generate_id({ length: 13 }),
        type: 'text',
        position,
        size: { width: 200, height: 100 },
        rotation: 0,
        zIndex: getNextZIndex(state),
        locked: false,
        content: '',
        style: {
          fontSize: 'md',
        },
      };

      state.pushHistory();
      set((s) => ({
        annotations: [...s.annotations, newAnnotation],
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    updateAnnotation: (id, updates) => {
      const state = get();
      set((s) => ({
        annotations: s.annotations.map((ann) =>
          ann.id === id ? { ...ann, ...updates } : ann,
        ),
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    removeAnnotation: (id) => {
      const state = get();
      state.pushHistory();
      set((s) => ({
        annotations: s.annotations.filter((ann) => ann.id !== id),
        selection: {
          ...s.selection,
          annotationIds: s.selection.annotationIds.filter((a) => a !== id),
        },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    setViewport: (viewport) => {
      set((s) => ({
        viewport: {
          ...s.viewport,
          ...viewport,
          zoom: Math.max(
            CANVAS_CONSTRAINTS.zoom.min,
            Math.min(
              viewport.zoom ?? s.viewport.zoom,
              CANVAS_CONSTRAINTS.zoom.max,
            ),
          ),
        },
      }));
    },

    zoomTo: (zoom, center) => {
      const state = get();
      const clampedZoom = Math.max(
        CANVAS_CONSTRAINTS.zoom.min,
        Math.min(zoom, CANVAS_CONSTRAINTS.zoom.max),
      );

      if (center) {
        const scale = clampedZoom / state.viewport.zoom;
        set({
          viewport: {
            x: center.x - (center.x - state.viewport.x) * scale,
            y: center.y - (center.y - state.viewport.y) * scale,
            zoom: clampedZoom,
          },
        });
      } else {
        set((s) => ({
          viewport: { ...s.viewport, zoom: clampedZoom },
        }));
      }
    },

    zoomToFit: (containerWidth, containerHeight) => {
      const state = get();
      if (state.items.length === 0 && state.frames.length === 0) {
        set({ viewport: { x: 0, y: 0, zoom: 1 } });
        return;
      }

      const allElements = [
        ...state.items.map((i) => ({
          x: i.position.x,
          y: i.position.y,
          width: i.size.width,
          height: i.size.height,
        })),
        ...state.frames.map((f) => ({
          x: f.position.x,
          y: f.position.y,
          width: f.size.width,
          height: f.size.height,
        })),
        ...state.annotations.map((a) => ({
          x: a.position.x,
          y: a.position.y,
          width: a.size.width,
          height: a.size.height,
        })),
      ];

      if (allElements.length === 0) {
        set({ viewport: { x: 0, y: 0, zoom: 1 } });
        return;
      }

      const minX = Math.min(...allElements.map((e) => e.x));
      const minY = Math.min(...allElements.map((e) => e.y));
      const maxX = Math.max(...allElements.map((e) => e.x + e.width));
      const maxY = Math.max(...allElements.map((e) => e.y + e.height));

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      const padding = 50;
      const availableWidth = containerWidth - padding * 2;
      const availableHeight = containerHeight - padding * 2;

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      const zoom = Math.max(
        CANVAS_CONSTRAINTS.zoom.min,
        Math.min(Math.min(scaleX, scaleY), 1),
      );

      const centerX = minX + contentWidth / 2;
      const centerY = minY + contentHeight / 2;

      set({
        viewport: {
          x: containerWidth / 2 - centerX * zoom,
          y: containerHeight / 2 - centerY * zoom,
          zoom,
        },
      });
    },

    panTo: (x, y) => {
      set((s) => ({
        viewport: { ...s.viewport, x, y },
      }));
    },

    select: (ids) => {
      set({
        selection: {
          itemIds: ids.itemIds ?? [],
          frameIds: ids.frameIds ?? [],
          annotationIds: ids.annotationIds ?? [],
        },
      });
    },

    selectAll: () => {
      set((s) => ({
        selection: {
          itemIds: s.items.filter((i) => !i.locked).map((i) => i.id),
          frameIds: s.frames.filter((f) => !f.locked).map((f) => f.id),
          annotationIds: s.annotations
            .filter((a) => !a.locked)
            .map((a) => a.id),
        },
      }));
    },

    clearSelection: () => {
      set({
        selection: { itemIds: [], frameIds: [], annotationIds: [] },
      });
    },

    addToSelection: (ids) => {
      set((s) => ({
        selection: {
          itemIds: [
            ...new Set([...s.selection.itemIds, ...(ids.itemIds ?? [])]),
          ],
          frameIds: [
            ...new Set([...s.selection.frameIds, ...(ids.frameIds ?? [])]),
          ],
          annotationIds: [
            ...new Set([
              ...s.selection.annotationIds,
              ...(ids.annotationIds ?? []),
            ]),
          ],
        },
      }));
    },

    removeFromSelection: (ids) => {
      set((s) => ({
        selection: {
          itemIds: s.selection.itemIds.filter(
            (i) => !(ids.itemIds ?? []).includes(i),
          ),
          frameIds: s.selection.frameIds.filter(
            (f) => !(ids.frameIds ?? []).includes(f),
          ),
          annotationIds: s.selection.annotationIds.filter(
            (a) => !(ids.annotationIds ?? []).includes(a),
          ),
        },
      }));
    },

    setTool: (tool) => set({ tool }),
    setIsPanning: (isPanning) => set({ isPanning }),

    updateSettings: (settings) => {
      const state = get();
      set((s) => ({
        settings: { ...s.settings, ...settings },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    bringForward: (ids) => {
      const state = get();
      const allZIndices = [
        ...state.items.map((i) => i.zIndex),
        ...state.frames.map((f) => f.zIndex),
        ...state.annotations.map((a) => a.zIndex),
      ].sort((a, b) => a - b);

      set((s) => ({
        items: s.items.map((item) => {
          if (ids.includes(item.id)) {
            const currentIdx = allZIndices.indexOf(item.zIndex);
            const nextIdx = Math.min(currentIdx + 1, allZIndices.length - 1);
            return { ...item, zIndex: allZIndices[nextIdx] + 1 };
          }
          return item;
        }),
        annotations: s.annotations.map((ann) => {
          if (ids.includes(ann.id)) {
            const currentIdx = allZIndices.indexOf(ann.zIndex);
            const nextIdx = Math.min(currentIdx + 1, allZIndices.length - 1);
            return { ...ann, zIndex: allZIndices[nextIdx] + 1 };
          }
          return ann;
        }),
        isDirty: true,
      }));
    },

    sendBackward: (ids) => {
      const state = get();
      const allZIndices = [
        ...state.items.map((i) => i.zIndex),
        ...state.frames.map((f) => f.zIndex),
        ...state.annotations.map((a) => a.zIndex),
      ].sort((a, b) => a - b);

      set((s) => ({
        items: s.items.map((item) => {
          if (ids.includes(item.id)) {
            const currentIdx = allZIndices.indexOf(item.zIndex);
            const prevIdx = Math.max(currentIdx - 1, 0);
            return { ...item, zIndex: allZIndices[prevIdx] - 1 };
          }
          return item;
        }),
        annotations: s.annotations.map((ann) => {
          if (ids.includes(ann.id)) {
            const currentIdx = allZIndices.indexOf(ann.zIndex);
            const prevIdx = Math.max(currentIdx - 1, 0);
            return { ...ann, zIndex: allZIndices[prevIdx] - 1 };
          }
          return ann;
        }),
        isDirty: true,
      }));
    },

    bringToFront: (ids) => {
      const state = get();
      const maxZ = getNextZIndex(state);

      set((s) => ({
        items: s.items.map((item) =>
          ids.includes(item.id) ? { ...item, zIndex: maxZ } : item,
        ),
        annotations: s.annotations.map((ann) =>
          ids.includes(ann.id) ? { ...ann, zIndex: maxZ } : ann,
        ),
        isDirty: true,
      }));
    },

    sendToBack: (ids) => {
      const state = get();
      const minZ = Math.min(
        ...state.items.map((i) => i.zIndex),
        ...state.frames.map((f) => f.zIndex),
        ...state.annotations.map((a) => a.zIndex),
        0,
      );

      set((s) => ({
        items: s.items.map((item) =>
          ids.includes(item.id) ? { ...item, zIndex: minZ - 1 } : item,
        ),
        annotations: s.annotations.map((ann) =>
          ids.includes(ann.id) ? { ...ann, zIndex: minZ - 1 } : ann,
        ),
        isDirty: true,
      }));
    },

    pushHistory: () => {
      set((s) => {
        const newHistory = s.history.slice(0, s.historyIndex + 1);
        newHistory.push({
          items: JSON.parse(JSON.stringify(s.items)),
          frames: JSON.parse(JSON.stringify(s.frames)),
          annotations: JSON.parse(JSON.stringify(s.annotations)),
        });

        if (newHistory.length > 50) {
          newHistory.shift();
        }

        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    undo: () => {
      set((s) => {
        if (s.historyIndex <= 0) return s;

        const prevEntry = s.history[s.historyIndex - 1];
        return {
          items: JSON.parse(JSON.stringify(prevEntry.items)),
          frames: JSON.parse(JSON.stringify(prevEntry.frames)),
          annotations: JSON.parse(JSON.stringify(prevEntry.annotations)),
          historyIndex: s.historyIndex - 1,
          isDirty: true,
        };
      });
    },

    redo: () => {
      set((s) => {
        if (s.historyIndex >= s.history.length - 1) return s;

        const nextEntry = s.history[s.historyIndex + 1];
        return {
          items: JSON.parse(JSON.stringify(nextEntry.items)),
          frames: JSON.parse(JSON.stringify(nextEntry.frames)),
          annotations: JSON.parse(JSON.stringify(nextEntry.annotations)),
          historyIndex: s.historyIndex + 1,
          isDirty: true,
        };
      });
    },

    duplicateSelection: () => {
      const state = get();
      const offset = 20;

      state.pushHistory();

      const newItems = state.selection.itemIds
        .map((id) => state.items.find((i) => i.id === id))
        .filter(Boolean)
        .map((item) => ({
          ...item!,
          id: generate_id({ length: 13 }),
          position: {
            x: item!.position.x + offset,
            y: item!.position.y + offset,
          },
          zIndex: getNextZIndex(state),
        }));

      const newAnnotations = state.selection.annotationIds
        .map((id) => state.annotations.find((a) => a.id === id))
        .filter(Boolean)
        .map((ann) => ({
          ...ann!,
          id: generate_id({ length: 13 }),
          position: {
            x: ann!.position.x + offset,
            y: ann!.position.y + offset,
          },
          zIndex: getNextZIndex(state),
        }));

      set((s) => ({
        items: [...s.items, ...newItems],
        annotations: [...s.annotations, ...newAnnotations],
        selection: {
          itemIds: newItems.map((i) => i.id),
          frameIds: [],
          annotationIds: newAnnotations.map((a) => a.id),
        },
        isDirty: true,
      }));
    },

    deleteSelection: () => {
      const state = get();
      state.pushHistory();

      set((s) => ({
        items: s.items.filter((i) => !s.selection.itemIds.includes(i.id)),
        frames: s.frames.filter((f) => !s.selection.frameIds.includes(f.id)),
        annotations: s.annotations.filter(
          (a) => !s.selection.annotationIds.includes(a.id),
        ),
        selection: { itemIds: [], frameIds: [], annotationIds: [] },
        isDirty: true,
      }));

      if (state.canvasId) {
        const newState = get();
        debouncedSave(state.canvasId, {
          version: 1,
          items: newState.items,
          frames: newState.frames,
          annotations: newState.annotations,
          viewport: newState.viewport,
          settings: newState.settings,
        });
      }
    },

    lockSelection: () => {
      set((s) => ({
        items: s.items.map((item) =>
          s.selection.itemIds.includes(item.id)
            ? { ...item, locked: true }
            : item,
        ),
        frames: s.frames.map((frame) =>
          s.selection.frameIds.includes(frame.id)
            ? { ...frame, locked: true }
            : frame,
        ),
        annotations: s.annotations.map((ann) =>
          s.selection.annotationIds.includes(ann.id)
            ? { ...ann, locked: true }
            : ann,
        ),
        isDirty: true,
      }));
    },

    unlockSelection: () => {
      set((s) => ({
        items: s.items.map((item) =>
          s.selection.itemIds.includes(item.id)
            ? { ...item, locked: false }
            : item,
        ),
        frames: s.frames.map((frame) =>
          s.selection.frameIds.includes(frame.id)
            ? { ...frame, locked: false }
            : frame,
        ),
        annotations: s.annotations.map((ann) =>
          s.selection.annotationIds.includes(ann.id)
            ? { ...ann, locked: false }
            : ann,
        ),
        isDirty: true,
      }));
    },
  })),
);

// Selector hooks
export const useIndependentCanvasItems = () =>
  useIndependentCanvasStore((s) => s.items);
export const useIndependentCanvasFrames = () =>
  useIndependentCanvasStore((s) => s.frames);
export const useIndependentCanvasAnnotations = () =>
  useIndependentCanvasStore((s) => s.annotations);
export const useIndependentCanvasViewport = () =>
  useIndependentCanvasStore((s) => s.viewport);
export const useIndependentCanvasSettings = () =>
  useIndependentCanvasStore((s) => s.settings);
export const useIndependentCanvasIsLoading = () =>
  useIndependentCanvasStore((s) => s.isLoading);

// ============================================
// Canvas Editor Page Component
// ============================================

const CanvasGrid: React.FC<{ gridSize: number; zoom: number }> = ({
  gridSize,
  zoom,
}) => {
  const scaledSize = gridSize * zoom;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.2) 1px, transparent 1px)`,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
      }}
    />
  );
};

const ZoomIndicator: React.FC<{ zoom: number }> = ({ zoom }) => {
  return (
    <div className="bg-background/80 text-muted-foreground absolute right-4 bottom-4 rounded-md border px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
      {Math.round(zoom * 100)}%
    </div>
  );
};

const CanvasEmptyState: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 px-4 text-center">
        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-2xl">
          <Layers className="text-muted-foreground h-8 w-8" />
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">Canvas is empty</h3>
          <p className="text-muted-foreground text-sm">
            Drag refs from the sidebar or use the toolbar to add frames and text
            annotations.
          </p>
        </div>
      </div>
    </div>
  );
};

const CanvasLoading: React.FC = () => {
  return (
    <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        <span className="text-muted-foreground text-sm">Loading canvas...</span>
      </div>
    </div>
  );
};

const CanvasEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasMetadata = useCanvasById(id || null);
  const initCanvas = useIndependentCanvasStore((s) => s.initCanvas);
  const resetCanvas = useIndependentCanvasStore((s) => s.resetCanvas);
  const items = useIndependentCanvasItems();
  const frames = useIndependentCanvasFrames();
  const annotations = useIndependentCanvasAnnotations();
  const isLoading = useIndependentCanvasIsLoading();
  const settings = useIndependentCanvasSettings();
  const viewport = useIndependentCanvasViewport();
  const deleteSelection = useIndependentCanvasStore((s) => s.deleteSelection);
  const selectAll = useIndependentCanvasStore((s) => s.selectAll);
  const undo = useIndependentCanvasStore((s) => s.undo);
  const redo = useIndependentCanvasStore((s) => s.redo);
  const duplicateSelection = useIndependentCanvasStore(
    (s) => s.duplicateSelection,
  );
  const zoomToFit = useIndependentCanvasStore((s) => s.zoomToFit);
  const setViewport = useIndependentCanvasStore((s) => s.setViewport);

  const allRefs = useRefs();

  const refsMap = useMemo(() => {
    const map = new Map<string, (typeof allRefs)[0]>();
    allRefs.forEach((ref) => {
      map.set(ref.metadata.id, ref);
    });
    return map;
  }, [allRefs]);

  // Initialize canvas on mount
  useEffect(() => {
    if (id) {
      initCanvas(id);
    }

    return () => {
      resetCanvas();
    };
  }, [id, initCanvas, resetCanvas]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            useIndependentCanvasStore.getState().setTool('select');
            return;
          case 't':
            e.preventDefault();
            useIndependentCanvasStore.getState().setTool('text');
            return;
          case 'f':
            e.preventDefault();
            useIndependentCanvasStore.getState().setTool('frame');
            return;
          case 'h':
            e.preventDefault();
            useIndependentCanvasStore.getState().setTool('pan');
            return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelection();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        const container = document.querySelector('[data-canvas-viewport]');
        if (container) {
          const rect = container.getBoundingClientRect();
          zoomToFit(rect.width, rect.height);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setViewport({ zoom: 1 });
      }

      if (e.key === 'Escape') {
        useIndependentCanvasStore.getState().clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deleteSelection,
    selectAll,
    undo,
    redo,
    duplicateSelection,
    zoomToFit,
    setViewport,
  ]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.zIndex - b.zIndex);
  }, [items]);

  const sortedFrames = useMemo(() => {
    return [...frames].sort((a, b) => a.zIndex - b.zIndex);
  }, [frames]);

  const sortedAnnotations = useMemo(() => {
    return [...annotations].sort((a, b) => a.zIndex - b.zIndex);
  }, [annotations]);

  const hasContent =
    items.length > 0 || frames.length > 0 || annotations.length > 0;

  const handleBack = () => {
    navigate('/canvases');
  };

  if (!id) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No canvas selected</p>
      </div>
    );
  }

  return (
    <CanvasStoreProvider store={useIndependentCanvasStore as any}>
      <motion.div
        animate={{ opacity: [0, 1] }}
        className="flex h-full flex-col"
      >
        {/* Header */}
        <header className="bg-background/95 border-border flex h-14 items-center gap-4 border-b px-4 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-primary-foreground text-lg font-medium">
            {canvasMetadata?.name || 'Canvas'}
          </h1>
        </header>

        {/* Canvas area */}
        <div ref={containerRef} className="relative flex-1 overflow-hidden">
          {settings.showGrid && (
            <CanvasGrid gridSize={settings.gridSize} zoom={viewport.zoom} />
          )}

          <CanvasContextMenu canvasId={id}>
            <CanvasViewportComponent data-canvas-viewport>
              {sortedFrames.map((frame) => (
                <CanvasFrameComponent key={frame.id} frame={frame} />
              ))}

              {sortedItems.map((item) => (
                <CanvasItemComponent
                  key={item.id}
                  item={item}
                  ref_data={refsMap.get(item.refId)}
                />
              ))}

              {sortedAnnotations.map((annotation) => (
                <CanvasAnnotationComponent
                  key={annotation.id}
                  annotation={annotation}
                />
              ))}

              <CanvasSelectionBox containerRef={containerRef} />
            </CanvasViewportComponent>
          </CanvasContextMenu>

          {isLoading && <CanvasLoading />}

          {!isLoading && !hasContent && <CanvasEmptyState />}

          {!isLoading && <CanvasToolbar />}

          <ZoomIndicator zoom={viewport.zoom} />
        </div>
      </motion.div>
    </CanvasStoreProvider>
  );
};

export default CanvasEditorPage;
