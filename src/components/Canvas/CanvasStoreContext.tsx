import React, { createContext, useContext } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';
import {
  CanvasItem,
  CanvasFrame,
  CanvasAnnotation,
  CanvasViewport,
  CanvasSettings,
  CanvasPosition,
  CanvasSize,
} from '@/lib/types';

// Tool modes for the canvas
export type CanvasTool = 'select' | 'pan' | 'text' | 'frame';

// Selection state
export interface CanvasSelection {
  itemIds: string[];
  frameIds: string[];
  annotationIds: string[];
}

// History entry for undo/redo
interface HistoryEntry {
  items: CanvasItem[];
  frames: CanvasFrame[];
  annotations: CanvasAnnotation[];
}

/**
 * Common interface for canvas stores (both board-based and independent).
 * This defines the shared properties and methods that canvas components depend on.
 */
export interface BaseCanvasState {
  // Loading state
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;

  // Canvas data
  items: CanvasItem[];
  frames: CanvasFrame[];
  annotations: CanvasAnnotation[];
  viewport: CanvasViewport;
  settings: CanvasSettings;

  // UI state
  tool: CanvasTool;
  selection: CanvasSelection;
  isPanning: boolean;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Actions - Items
  addItem: (refId: string, position: CanvasPosition, size: CanvasSize) => void;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;

  // Actions - Frames
  addFrame: (
    position: CanvasPosition,
    size: CanvasSize,
    title?: string,
  ) => void;
  updateFrame: (id: string, updates: Partial<CanvasFrame>) => void;
  removeFrame: (id: string) => void;

  // Actions - Annotations
  addAnnotation: (position: CanvasPosition) => void;
  updateAnnotation: (id: string, updates: Partial<CanvasAnnotation>) => void;
  removeAnnotation: (id: string) => void;

  // Actions - Viewport
  setViewport: (viewport: Partial<CanvasViewport>) => void;
  zoomTo: (zoom: number, center?: CanvasPosition) => void;
  zoomToFit: (containerWidth: number, containerHeight: number) => void;
  panTo: (x: number, y: number) => void;

  // Actions - Selection
  select: (ids: Partial<CanvasSelection>) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addToSelection: (ids: Partial<CanvasSelection>) => void;
  removeFromSelection: (ids: Partial<CanvasSelection>) => void;

  // Actions - Tools
  setTool: (tool: CanvasTool) => void;
  setIsPanning: (isPanning: boolean) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<CanvasSettings>) => void;

  // Actions - Z-Index
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Actions - Batch operations
  duplicateSelection: () => void;
  deleteSelection: () => void;
  lockSelection: () => void;
  unlockSelection: () => void;
}

// The context holds a reference to a canvas store
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CanvasStoreType = UseBoundStore<StoreApi<BaseCanvasState>>;

const CanvasStoreContext = createContext<CanvasStoreType | null>(null);

interface CanvasStoreProviderProps {
  store: CanvasStoreType;
  children: React.ReactNode;
}

/**
 * Provider that wraps canvas components with a specific store instance.
 * Use this to provide either the board-based useCanvasStore or
 * the independent useIndependentCanvasStore to child components.
 */
export const CanvasStoreProvider: React.FC<CanvasStoreProviderProps> = ({
  store,
  children,
}) => {
  return (
    <CanvasStoreContext.Provider value={store}>
      {children}
    </CanvasStoreContext.Provider>
  );
};

/**
 * Hook to access the canvas store from context.
 * Throws an error if used outside of CanvasStoreProvider.
 */
export function useCanvasStoreContext(): CanvasStoreType {
  const contextStore = useContext(CanvasStoreContext);
  if (!contextStore) {
    throw new Error(
      'useCanvasStoreContext must be used within a CanvasStoreProvider',
    );
  }
  return contextStore;
}

// Re-export selector hooks that use the context
export const useContextCanvasItems = () =>
  useCanvasStoreContext()((s) => s.items);
export const useContextCanvasFrames = () =>
  useCanvasStoreContext()((s) => s.frames);
export const useContextCanvasAnnotations = () =>
  useCanvasStoreContext()((s) => s.annotations);
export const useContextCanvasViewport = () =>
  useCanvasStoreContext()((s) => s.viewport);
export const useContextCanvasSettings = () =>
  useCanvasStoreContext()((s) => s.settings);
export const useContextCanvasSelection = () =>
  useCanvasStoreContext()((s) => s.selection);
export const useContextCanvasTool = () =>
  useCanvasStoreContext()((s) => s.tool);
export const useContextCanvasIsLoading = () =>
  useCanvasStoreContext()((s) => s.isLoading);
export const useContextCanvasIsPanning = () =>
  useCanvasStoreContext()((s) => s.isPanning);
export const useContextHasSelection = () =>
  useCanvasStoreContext()(
    (s) =>
      s.selection.itemIds.length > 0 ||
      s.selection.frameIds.length > 0 ||
      s.selection.annotationIds.length > 0,
  );
export const useContextSelectionCount = () =>
  useCanvasStoreContext()(
    (s) =>
      s.selection.itemIds.length +
      s.selection.frameIds.length +
      s.selection.annotationIds.length,
  );
