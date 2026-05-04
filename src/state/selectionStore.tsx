import { create } from 'zustand';

export interface SelectionState {
  selectedIds: string[];
  focusedId: string | null;

  // Actions
  toggleSelect: (id: string) => void;
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  setFocused: (id: string | null) => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  focusedId: null,

  toggleSelect: (id: string) => {
    set((state) => {
      const index = state.selectedIds.indexOf(id);
      if (index >= 0) {
        // Remove
        return { selectedIds: state.selectedIds.filter((i) => i !== id) };
      } else {
        // Add
        return { selectedIds: [...state.selectedIds, id] };
      }
    });
  },

  select: (id: string) => {
    set((state) => {
      if (state.selectedIds.includes(id)) return state;
      return { selectedIds: [...state.selectedIds, id] };
    });
  },

  deselect: (id: string) => {
    set((state) => {
      if (!state.selectedIds.includes(id)) return state;
      return { selectedIds: state.selectedIds.filter((i) => i !== id) };
    });
  },

  selectMultiple: (ids: string[]) => {
    set((state) => {
      const newIds = ids.filter((id) => !state.selectedIds.includes(id));
      if (newIds.length === 0) return state;
      return { selectedIds: [...state.selectedIds, ...newIds] };
    });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  setFocused: (id: string | null) => {
    set({ focusedId: id });
  },

  isSelected: (id: string) => {
    return get().selectedIds.includes(id);
  },
}));

// Helper hook for checking if any items are selected
export const useHasSelection = () => {
  return useSelectionStore((state) => state.selectedIds.length > 0);
};

// Helper hook for getting selected count
export const useSelectionCount = () => {
  return useSelectionStore((state) => state.selectedIds.length);
};

// Helper hook for getting selected IDs as array
export const useSelectedIds = () => {
  return useSelectionStore((state) => state.selectedIds);
};
