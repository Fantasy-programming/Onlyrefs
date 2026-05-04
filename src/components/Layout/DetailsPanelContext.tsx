import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { Ref, Board } from '@/lib/types';
import { useRefStore } from '@/state/refstore';

interface DetailsPanelContextType {
  // Single item selection (backward compatible)
  selectedItem: Ref | null;
  // Multi-select support
  selectedItems: Ref[];
  selectedItemIds: string[];
  // Board selection
  selectedBoard: Board | null;
  // Panel state
  isOpen: boolean;
  // Single item methods (backward compatible)
  openPanel: (item: Ref) => void;
  closePanel: () => void;
  togglePanel: () => void;
  selectItem: (item: Ref) => void;
  selectBoard: (board: Board | null) => void;
  // Multi-select methods
  selectItems: (items: Ref[]) => void;
  addToSelection: (item: Ref) => void;
  removeFromSelection: (id: string) => void;
  toggleItemSelection: (item: Ref) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

const DetailsPanelContext = createContext<DetailsPanelContextType | undefined>(
  undefined,
);

export const useDetailsPanel = () => {
  const context = useContext(DetailsPanelContext);
  if (!context) {
    throw new Error(
      'useDetailsPanel must be used within a DetailsPanelProvider',
    );
  }
  return context;
};

interface DetailsPanelProviderProps {
  children: ReactNode;
}

export const DetailsPanelProvider: React.FC<DetailsPanelProviderProps> = ({
  children,
}) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const refs = useRefStore((state) => state.refs);

  // Check if we're on a board page
  const isBoardPage = location.pathname.startsWith('/boards/');

  // Get the actual selectedItems from the store based on IDs (always up-to-date)
  const selectedItems = useMemo(() => {
    return selectedItemIds
      .map((id) => refs.find((ref) => ref.metadata?.id === id))
      .filter((ref): ref is Ref => ref !== null);
  }, [refs, selectedItemIds]);

  // For backward compatibility - first selected item
  const selectedItem = useMemo(() => {
    return selectedItems.length > 0 ? selectedItems[0] : null;
  }, [selectedItems]);

  // Auto-select first ref when none selected and refs are available (not on board pages)
  useEffect(() => {
    if (
      !isBoardPage &&
      selectedItemIds.length === 0 &&
      !selectedBoard &&
      refs.length > 0
    ) {
      const firstId = refs[0].metadata?.id;
      if (firstId) {
        setSelectedItemIds([firstId]);
        setIsOpen(true);
      }
    }
  }, [refs, selectedItemIds.length, selectedBoard, isBoardPage]);

  // Close panel on board pages
  useEffect(() => {
    if (isBoardPage) {
      setIsOpen(false);
    } else if (refs.length > 0) {
      setIsOpen(true);
    }
  }, [isBoardPage, refs.length]);

  // Single item methods (backward compatible)
  const openPanel = useCallback((item: Ref) => {
    const id = item.metadata?.id;
    if (id) {
      setSelectedItemIds([id]);
      setSelectedBoard(null);
      setIsOpen(true);
    }
  }, []);

  const selectItem = useCallback((item: Ref) => {
    const id = item.metadata?.id;
    if (id) {
      setSelectedItemIds([id]);
      setSelectedBoard(null);
    }
  }, []);

  const selectBoard = useCallback((board: Board | null) => {
    setSelectedBoard(board);
    if (board) {
      setSelectedItemIds([]);
      setIsOpen(true);
    }
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Multi-select methods
  const selectItems = useCallback((items: Ref[]) => {
    const ids = items
      .map((item) => item.metadata?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedItemIds(ids);
    setSelectedBoard(null);
  }, []);

  const addToSelection = useCallback((item: Ref) => {
    const id = item.metadata?.id;
    if (id) {
      setSelectedItemIds((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
      setSelectedBoard(null);
    }
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedItemIds((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const toggleItemSelection = useCallback((item: Ref) => {
    const id = item.metadata?.id;
    if (id) {
      setSelectedItemIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((itemId) => itemId !== id);
        }
        return [...prev, id];
      });
      setSelectedBoard(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedItemIds.includes(id);
    },
    [selectedItemIds],
  );

  return (
    <DetailsPanelContext.Provider
      value={{
        selectedItem,
        selectedItems,
        selectedItemIds,
        selectedBoard,
        isOpen,
        openPanel,
        closePanel,
        togglePanel,
        selectItem,
        selectBoard,
        selectItems,
        addToSelection,
        removeFromSelection,
        toggleItemSelection,
        clearSelection,
        isSelected,
      }}
    >
      {children}
    </DetailsPanelContext.Provider>
  );
};
