import { useEffect, useState } from 'react';
import { LayoutMode } from '@/components/Layout/TopBar';

// Sort options for the view
export type SortBy =
  | 'manual'
  | 'date_added'
  | 'date_modified'
  | 'date_created'
  | 'title'
  | 'extension'
  | 'file_size'
  | 'dimensions'
  | 'rating'
  | 'random';

// Search scope options
export type SearchScope =
  | 'name'
  | 'extension'
  | 'tags'
  | 'url'
  | 'comment'
  | 'note';

// View settings interface
export interface ViewSettings {
  showName: boolean;
  showItemInfo: boolean;
  showExtension: boolean;
  showAnnotation: boolean;
  showSubfolderContents: boolean;
}

// Default view settings
export const defaultViewSettings: ViewSettings = {
  showName: false,
  showItemInfo: false,
  showExtension: true,
  showAnnotation: true,
  showSubfolderContents: false,
};

export const useGridSize = (initial = 4) => {
  const [gridSize, setGridSize] = useState<number>(initial);

  useEffect(() => {
    const g = localStorage.getItem('gridSize');
    if (!g) return;
    setGridSize(Number(g));
  }, []);

  const updateGridSize = (size: number) => {
    console.debug(`Debug: Grid size updated to ${size}`);
    setGridSize(size);
    localStorage.setItem('gridSize', size.toString());
  };

  return [gridSize, updateGridSize] as const;
};

// Layout mode hook with localStorage persistence
export const useLayoutMode = (initial: LayoutMode = 'masonry') => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem('onlyrefs-layout-mode');
    return (stored as LayoutMode) || initial;
  });

  const updateLayoutMode = (mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('onlyrefs-layout-mode', mode);
  };

  return [layoutMode, updateLayoutMode] as const;
};

// Zoom level hook with localStorage persistence
export const useZoomLevel = (initial = 200) => {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const stored = localStorage.getItem('onlyrefs-zoom-level');
    return stored ? parseInt(stored, 10) : initial;
  });

  const updateZoomLevel = (level: number) => {
    // Clamp between 100 and 400
    const clamped = Math.max(100, Math.min(400, level));
    setZoomLevel(clamped);
    localStorage.setItem('onlyrefs-zoom-level', String(clamped));
  };

  return [zoomLevel, updateZoomLevel] as const;
};

// Sort by hook with localStorage persistence
export const useSortBy = (initial: SortBy = 'manual') => {
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const stored = localStorage.getItem('onlyrefs-sort-by');
    return (stored as SortBy) || initial;
  });

  const updateSortBy = (sort: SortBy) => {
    setSortBy(sort);
    localStorage.setItem('onlyrefs-sort-by', sort);
  };

  return [sortBy, updateSortBy] as const;
};

// Sort direction hook with localStorage persistence
export const useSortDirection = (initial: 'asc' | 'desc' = 'desc') => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    const stored = localStorage.getItem('onlyrefs-sort-direction');
    return (stored as 'asc' | 'desc') || initial;
  });

  const updateSortDirection = (direction: 'asc' | 'desc') => {
    setSortDirection(direction);
    localStorage.setItem('onlyrefs-sort-direction', direction);
  };

  return [sortDirection, updateSortDirection] as const;
};

// View settings hook with localStorage persistence
export const useViewSettings = (
  initial: ViewSettings = defaultViewSettings,
) => {
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    const stored = localStorage.getItem('onlyrefs-view-settings');
    if (stored) {
      try {
        return { ...initial, ...JSON.parse(stored) };
      } catch {
        return initial;
      }
    }
    return initial;
  });

  const updateViewSettings = (settings: Partial<ViewSettings>) => {
    const newSettings = { ...viewSettings, ...settings };
    setViewSettings(newSettings);
    localStorage.setItem('onlyrefs-view-settings', JSON.stringify(newSettings));
  };

  return [viewSettings, updateViewSettings] as const;
};

// Search scope hook with localStorage persistence
export const useSearchScope = (initial: SearchScope = 'name') => {
  const [searchScope, setSearchScope] = useState<SearchScope>(() => {
    const stored = localStorage.getItem('onlyrefs-search-scope');
    return (stored as SearchScope) || initial;
  });

  const updateSearchScope = (scope: SearchScope) => {
    setSearchScope(scope);
    localStorage.setItem('onlyrefs-search-scope', scope);
  };

  return [searchScope, updateSearchScope] as const;
};
