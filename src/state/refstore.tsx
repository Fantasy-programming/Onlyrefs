import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useMemo } from 'react';
import { NoteRef, Ref, StackRef, StackMetadata } from '@/lib/types';
import { getUpdatedAtTimestamp } from '@/lib/helper';
import {
  renameRef,
  mutateNoteText,
  addTag,
  removeTag,
  setBoardId,
} from '@/lib/commands';

export interface RefState {
  refs: Ref[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRefs: () => Promise<void>;
  addRef: (ref: Ref) => void;
  deleteRef: (id: string) => void;
  mutateTag: (id: string, tag: string, type: 'add' | 'remove') => void;
  mutateName: (id: string, name: string) => void;
  mutateNote: (id: string, note: string) => void;
  mutateNoteText: (id: string, note: string) => void;
  mutateBoardId: (id: string, boardId: string | null) => void;

  // Stack actions
  updateStack: (
    stackId: string,
    updates: Partial<StackMetadata>,
    newItems?: Ref[],
  ) => void;
  removeRefsFromDisplay: (refIds: string[]) => void;
}

// Use subscribeWithSelector for granular updates
export const useRefStore = create<RefState>()(
  subscribeWithSelector((set) => ({
    refs: [],
    isLoading: true,
    error: null,

    fetchRefs: async () => {
      set({ isLoading: true, error: null });
      try {
        let data: Ref[] = await invoke('get_all_refs');
        data = data.sort((a, b) => {
          const aUpdatedAt = getUpdatedAtTimestamp(a);
          const bUpdatedAt = getUpdatedAtTimestamp(b);
          return bUpdatedAt - aUpdatedAt;
        });
        set({ refs: data, isLoading: false });
      } catch (e) {
        set({ error: 'Failed to fetch refs', isLoading: false });
        console.error('Failed to fetch refs:', e);
      }
    },

    addRef: (ref: Ref) => {
      set((state) => ({ refs: [ref, ...state.refs] }));
    },

    deleteRef: (id: string) => {
      set((state) => ({
        refs: state.refs.filter((r) => r.metadata.id !== id),
      }));
    },

    mutateTag: (id: string, tagname: string, type: 'add' | 'remove') => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === id);
        if (refIndex === -1) return state;

        const newRefs = [...state.refs];
        const ref = { ...newRefs[refIndex] };
        const metadata = { ...ref.metadata };
        const tags = metadata.tags ? [...metadata.tags] : [];

        if (type === 'add') {
          if (!tags.includes(tagname)) tags.push(tagname);
        } else if (type === 'remove') {
          const index = tags.indexOf(tagname);
          if (index !== -1) tags.splice(index, 1);
        }

        metadata.tags = tags;
        ref.metadata = metadata;
        newRefs[refIndex] = ref as Ref;

        return { refs: newRefs };
      });
    },

    mutateName: (id: string, name: string) => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === id);
        if (refIndex === -1) return state;

        const newRefs = [...state.refs];
        const ref = { ...newRefs[refIndex] };
        ref.metadata = { ...ref.metadata, name };
        newRefs[refIndex] = ref as Ref;

        return { refs: newRefs };
      });
    },

    mutateNote: (id: string, note: string) => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === id);
        if (refIndex === -1) return state;

        const newRefs = [...state.refs];
        const ref = newRefs[refIndex];

        if (ref.metadata.ref_type === 'note') {
          newRefs[refIndex] = { ...(ref as NoteRef), content: note } as Ref;
        }

        return { refs: newRefs };
      });
    },

    mutateNoteText: (id: string, note: string) => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === id);
        if (refIndex === -1) return state;

        const newRefs = [...state.refs];
        const ref = { ...newRefs[refIndex] };
        ref.metadata = { ...ref.metadata, note_text: note };
        newRefs[refIndex] = ref as Ref;

        return { refs: newRefs };
      });
    },

    mutateBoardId: (id: string, boardId: string | null) => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === id);
        if (refIndex === -1) return state;

        const newRefs = [...state.refs];
        const ref = { ...newRefs[refIndex] };
        ref.metadata = { ...ref.metadata, board_id: boardId };
        newRefs[refIndex] = ref as Ref;

        return { refs: newRefs };
      });
    },

    updateStack: (
      stackId: string,
      updates: Partial<StackMetadata>,
      newItems?: Ref[],
    ) => {
      set((state) => {
        const refIndex = state.refs.findIndex((r) => r.metadata.id === stackId);
        if (refIndex === -1) return state;

        const ref = state.refs[refIndex];
        if (ref.metadata.ref_type !== 'stack') return state;

        const newRefs = [...state.refs];
        const stackRef = ref as StackRef;
        newRefs[refIndex] = {
          ...stackRef,
          metadata: { ...stackRef.metadata, ...updates },
          items: newItems !== undefined ? newItems : stackRef.items,
        } as Ref;

        return { refs: newRefs };
      });
    },

    removeRefsFromDisplay: (refIds: string[]) => {
      set((state) => ({
        refs: state.refs.filter((r) => !refIds.includes(r.metadata.id)),
      }));
    },
  })),
);

// Event listener management with proper cleanup
class RefStoreListeners {
  private static instance: RefStoreListeners | null = null;
  private unlistenFunctions: UnlistenFn[] = [];
  private isInitialized = false;

  static getInstance(): RefStoreListeners {
    if (!RefStoreListeners.instance) {
      RefStoreListeners.instance = new RefStoreListeners();
    }
    return RefStoreListeners.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('[RefStore] Listeners already initialized, fetching refs...');
      await useRefStore.getState().fetchRefs();
      return;
    }

    console.log('[RefStore] Initializing listeners...');
    this.isInitialized = true;

    try {
      const unlisten1 = await listen<Ref>('ref_added', (event) => {
        console.log('Ref added event received:', event.payload);
        useRefStore.getState().addRef(event.payload);
      });
      this.unlistenFunctions.push(unlisten1);

      const unlisten2 = await listen<string[]>('colors-added', (event) => {
        console.log('Colors added event received:', event.payload);
      });
      this.unlistenFunctions.push(unlisten2);

      const unlisten3 = await listen<{
        id: string;
        name: string;
        path: string;
      }>('name_changed', async (event) => {
        const { id, name, path } = event.payload;
        try {
          await renameRef(id, name, path);
          useRefStore.getState().mutateName(id, name);
        } catch (error) {
          console.error('Failed to rename ref:', error);
        }
      });
      this.unlistenFunctions.push(unlisten3);

      const unlisten4 = await listen<{
        id: string;
        content: string;
        path: string;
      }>('note_text_changed', async (event) => {
        const { id, content, path } = event.payload;
        try {
          await mutateNoteText(id, path, content);
          useRefStore.getState().mutateNoteText(id, content);
        } catch (error) {
          console.error('Failed to update note text:', error);
        }
      });
      this.unlistenFunctions.push(unlisten4);

      const unlisten5 = await listen<{
        id: string;
        boardId: string | null;
        path: string;
      }>('board_changed', async (event) => {
        const { id, boardId, path } = event.payload;
        try {
          await setBoardId(id, path, boardId);
          useRefStore.getState().mutateBoardId(id, boardId);
        } catch (error) {
          console.error('Failed to change board:', error);
        }
      });
      this.unlistenFunctions.push(unlisten5);

      const unlisten6 = await listen<{ id: string; tag: string; path: string }>(
        'tag_added',
        async (event) => {
          console.log('[DEBUG] tag_added event received:', event.payload);
          const { id, tag, path } = event.payload;
          try {
            await addTag(id, path, tag);
            useRefStore.getState().mutateTag(id, tag, 'add');
          } catch (error) {
            console.error('Failed to add tag:', error);
          }
        },
      );
      this.unlistenFunctions.push(unlisten6);

      const unlisten7 = await listen<{ id: string; tag: string; path: string }>(
        'tag_removed',
        async (event) => {
          const { id, tag, path } = event.payload;
          try {
            await removeTag(id, path, tag);
            useRefStore.getState().mutateTag(id, tag, 'remove');
          } catch (error) {
            console.error('Failed to remove tag:', error);
          }
        },
      );
      this.unlistenFunctions.push(unlisten7);

      // Listen for backend refs_loaded event (async initial load)
      const unlisten8 = await listen<Ref[]>('refs_loaded', (event) => {
        console.log(
          '[RefStore] refs_loaded event received, count:',
          event.payload.length,
        );
        const data = event.payload.sort((a, b) => {
          const aUpdatedAt = getUpdatedAtTimestamp(a);
          const bUpdatedAt = getUpdatedAtTimestamp(b);
          return bUpdatedAt - aUpdatedAt;
        });
        useRefStore.setState({ refs: data, isLoading: false });
      });
      this.unlistenFunctions.push(unlisten8);

      console.log('[RefStore] All listeners registered');

      // Fallback: If refs_loaded event was already emitted before listeners were registered,
      // the event would be lost. Check after a short delay and fetch refs directly if needed.
      setTimeout(() => {
        const state = useRefStore.getState();
        if (state.isLoading) {
          console.log(
            '[RefStore] No refs_loaded event received, falling back to fetchRefs',
          );
          state.fetchRefs();
        }
      }, 500);
    } catch (error) {
      console.error('[RefStore] Error initializing listeners:', error);
      this.isInitialized = false;
    }
  }

  cleanup() {
    console.log('[RefStore] Cleaning up listeners...');
    this.unlistenFunctions.forEach((unlisten) => unlisten());
    this.unlistenFunctions = [];
    this.isInitialized = false;
  }

  reset() {
    this.cleanup();
    RefStoreListeners.instance = null;
  }
}

// Public API
export const initRefStoreListeners = async () => {
  await RefStoreListeners.getInstance().initialize();
};

export const cleanupRefStoreListeners = () => {
  RefStoreListeners.getInstance().cleanup();
};

// Optimized selector hooks - only re-render when specific data changes
export const useRefs = () => useRefStore((state) => state.refs);
export const useRefById = (id: string) =>
  useRefStore((state) => state.refs.find((r) => r.metadata.id === id));
export const useRefsCount = () => useRefStore((state) => state.refs.length);

// Get refs for display - filters out refs that are inside stacks
// Uses useMemo internally to prevent creating new array references
export const useDisplayRefs = () => {
  const refs = useRefStore((state) => state.refs);

  return useMemo(() => {
    // Collect all item_ids from stacks
    const stackedIds = new Set<string>();
    refs.forEach((ref) => {
      if (ref.metadata.ref_type === 'stack') {
        const stackMeta = ref.metadata as StackMetadata;
        stackMeta.item_ids.forEach((id) => stackedIds.add(id));
      }
    });

    // Filter out refs that are inside stacks
    return refs.filter((ref) => !stackedIds.has(ref.metadata.id));
  }, [refs]);
};

// Get a stack by ID with its resolved items
export const useStackById = (stackId: string) =>
  useRefStore((state) => {
    const stack = state.refs.find(
      (r) => r.metadata.id === stackId && r.metadata.ref_type === 'stack',
    ) as StackRef | undefined;
    return stack;
  });

// Legacy hook for backwards compatibility
export const useRefSelector = () => {
  const refs = useRefStore((state) => state.refs);
  const addRef = useRefStore((state) => state.addRef);
  const deleteRef = useRefStore((state) => state.deleteRef);
  const mutateTag = useRefStore((state) => state.mutateTag);
  const mutateName = useRefStore((state) => state.mutateName);
  const mutateNote = useRefStore((state) => state.mutateNote);
  const mutateNoteText = useRefStore((state) => state.mutateNoteText);
  const mutateBoardId = useRefStore((state) => state.mutateBoardId);

  return {
    ref: refs,
    addRef,
    deleteRef,
    mutateTag,
    mutateName,
    mutateNote,
    mutateNoteText,
    mutateBoardId,
  };
};

// Provider component
import React, { PropsWithChildren, useEffect } from 'react';
import { useSettingsStore } from '@/resources/settings.resource';
import { initBoardStore } from '@/state/boardstore';
import { initCanvasListStore } from '@/state/canvasliststore';

export const RefProvider: React.FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    initRefStoreListeners();
    useSettingsStore.getState().loadSettings();
    initBoardStore();
    initCanvasListStore();

    return () => {
      cleanupRefStoreListeners();
    };
  }, []);

  return <>{children}</>;
};
