import React, { createContext, useContext, useState, useEffect } from 'react';

// Active filter types for the left sidebar
export type ActiveFilter =
  | { type: 'all' }
  | { type: 'uncategorized' }
  | { type: 'untagged' }
  | { type: 'recent' }
  | { type: 'random' }
  | { type: 'tags' }
  | { type: 'trash' }
  | { type: 'board'; boardId: string; boardIds: string[] }; // boardIds includes the board and all descendants

interface LeftSidebarContextType {
  // Visibility
  isVisible: boolean;
  toggleVisibility: () => void;
  showSidebar: () => void;
  hideSidebar: () => void;

  // Active filter
  activeFilter: ActiveFilter;
  setActiveFilter: (filter: ActiveFilter) => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextType | undefined>(
  undefined,
);

const STORAGE_KEY = 'onlyrefs-left-sidebar-visible';

export const LeftSidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize visibility from localStorage (default: true)
  const [isVisible, setIsVisible] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  // Active filter state
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({
    type: 'all',
  });

  // Persist visibility to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isVisible));
  }, [isVisible]);

  const toggleVisibility = () => setIsVisible((prev) => !prev);
  const showSidebar = () => setIsVisible(true);
  const hideSidebar = () => setIsVisible(false);

  return (
    <LeftSidebarContext.Provider
      value={{
        isVisible,
        toggleVisibility,
        showSidebar,
        hideSidebar,
        activeFilter,
        setActiveFilter,
      }}
    >
      {children}
    </LeftSidebarContext.Provider>
  );
};

export const useLeftSidebar = (): LeftSidebarContextType => {
  const context = useContext(LeftSidebarContext);
  if (!context) {
    throw new Error('useLeftSidebar must be used within a LeftSidebarProvider');
  }
  return context;
};

export default LeftSidebarContext;
