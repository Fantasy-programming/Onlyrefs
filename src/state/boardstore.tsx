import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import { Board } from '@/lib/types';
import {
  getBoards,
  createBoard as createBoardCmd,
  renameBoard as renameBoardCmd,
  moveBoard as moveBoardCmd,
  deleteBoard as deleteBoardCmd,
  getBoardDescendants,
  updateBoardColor as updateBoardColorCmd,
} from '@/lib/commands';

export interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBoards: () => Promise<void>;
  createBoard: (name: string, parentId: string | null) => Promise<Board | null>;
  renameBoard: (boardId: string, newName: string) => Promise<void>;
  updateBoardColor: (boardId: string, color: string | null) => Promise<void>;
  moveBoard: (boardId: string, newParentId: string | null) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  getDescendants: (boardId: string) => Promise<string[]>;
}

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    boards: [],
    isLoading: true,
    error: null,

    fetchBoards: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await getBoards();
        set({ boards: data, isLoading: false });
      } catch (e) {
        set({ error: 'Failed to fetch boards', isLoading: false });
        console.error('Failed to fetch boards:', e);
      }
    },

    createBoard: async (name: string, parentId: string | null) => {
      try {
        const newBoard = await createBoardCmd(name, parentId);
        if (newBoard) {
          set((state) => ({ boards: [...state.boards, newBoard] }));
        }
        return newBoard;
      } catch (e) {
        console.error('Failed to create board:', e);
        throw e;
      }
    },

    renameBoard: async (boardId: string, newName: string) => {
      try {
        await renameBoardCmd(boardId, newName);
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId ? { ...b, name: newName } : b,
          ),
        }));
      } catch (e) {
        console.error('Failed to rename board:', e);
        throw e;
      }
    },

    updateBoardColor: async (boardId: string, color: string | null) => {
      try {
        await updateBoardColorCmd(boardId, color);
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId ? { ...b, color: color ?? undefined } : b,
          ),
        }));
      } catch (e) {
        console.error('Failed to update board color:', e);
        throw e;
      }
    },

    moveBoard: async (boardId: string, newParentId: string | null) => {
      try {
        await moveBoardCmd(boardId, newParentId);
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId ? { ...b, parent_id: newParentId } : b,
          ),
        }));
      } catch (e) {
        console.error('Failed to move board:', e);
        throw e;
      }
    },

    deleteBoard: async (boardId: string) => {
      const state = get();
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return;

      try {
        await deleteBoardCmd(boardId);

        // Move child boards to parent
        const parentId = board.parent_id;
        set((state) => ({
          boards: state.boards
            .filter((b) => b.id !== boardId)
            .map((b) =>
              b.parent_id === boardId ? { ...b, parent_id: parentId } : b,
            ),
        }));
      } catch (e) {
        console.error('Failed to delete board:', e);
        throw e;
      }
    },

    getDescendants: async (boardId: string) => {
      try {
        return await getBoardDescendants(boardId);
      } catch (e) {
        console.error('Failed to get descendants:', e);
        return [];
      }
    },
  })),
);

// Selector hooks
export const useBoards = () => useBoardStore((state) => state.boards);
export const useBoardsLoading = () => useBoardStore((state) => state.isLoading);

export const useBoardById = (id: string | null) =>
  useBoardStore((state) =>
    id ? state.boards.find((b) => b.id === id) : undefined,
  );

// Get root boards (no parent)
export const useRootBoards = () =>
  useBoardStore((state) => state.boards.filter((b) => b.parent_id === null));

// Get child boards of a parent
export const useChildBoards = (parentId: string | null) =>
  useBoardStore((state) =>
    state.boards.filter((b) => b.parent_id === parentId),
  );

// Build a tree structure from flat boards
export interface BoardTreeNode {
  board: Board;
  children: BoardTreeNode[];
}

export const useBoardTree = (): BoardTreeNode[] => {
  const boards = useBoardStore((state) => state.boards);

  return useMemo(() => {
    const buildTree = (parentId: string | null): BoardTreeNode[] => {
      return boards
        .filter((b) => b.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((board) => ({
          board,
          children: buildTree(board.id),
        }));
    };

    return buildTree(null);
  }, [boards]);
};

// Get all ancestor IDs for a board (for breadcrumb)
export const useBoardAncestors = (boardId: string | null): Board[] => {
  const boards = useBoardStore((state) => state.boards);

  return useMemo(() => {
    if (!boardId) return [];

    const ancestors: Board[] = [];
    let currentId: string | null = boardId;

    while (currentId) {
      const board = boards.find((b) => b.id === currentId);
      if (!board) break;
      if (board.parent_id) {
        const parent = boards.find((b) => b.id === board.parent_id);
        if (parent) {
          ancestors.unshift(parent);
        }
      }
      currentId = board.parent_id;
    }

    return ancestors;
  }, [boards, boardId]);
};

// Initialize boards store
export const initBoardStore = async () => {
  await useBoardStore.getState().fetchBoards();
};
