import React, { useState, useMemo } from 'react';
import { FiFilter, FiX, FiMinus, FiPlus, FiSidebar } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { useRefSelector } from '@/state/refstore';
import { Ref, Reftype } from '@/lib/types';
import { SearchInput } from './SearchInput';
import { ViewSettingsPopover } from './ViewSettingsPopover';
import {
  SortBy,
  SearchScope,
  ViewSettings,
  defaultViewSettings,
} from '@/state/hook';

// Layout mode type
export type LayoutMode = 'masonry' | 'justified' | 'grid' | 'list';

// Filter state type
export interface FilterState {
  tags: string[];
  types: Reftype[];
  boardIds: string[];
  tagLogic: 'and' | 'or';
}

// Default empty filter state
export const defaultFilterState: FilterState = {
  tags: [],
  types: [],
  boardIds: [],
  tagLogic: 'or',
};

// Available ref types for filtering
const REF_TYPES: { value: Reftype; label: string }[] = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'note', label: 'Notes' },
  { value: 'stack', label: 'Stacks' },
  { value: 'audio', label: 'Audio' },
  { value: 'link', label: 'Links' },
];

interface TopBarProps {
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchScope?: SearchScope;
  onSearchScopeChange?: (scope: SearchScope) => void;
  // Items for autocomplete
  items?: Ref[];
  // Zoom slider
  zoomLevel?: number;
  onZoomLevelChange?: (level: number) => void;
  // Filter props
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  // Layout mode props
  layoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
  // Sort props
  sortBy?: SortBy;
  onSortByChange?: (sort: SortBy) => void;
  sortDirection?: 'asc' | 'desc';
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
  // View settings
  viewSettings?: ViewSettings;
  onViewSettingsChange?: (settings: Partial<ViewSettings>) => void;
  // Panel toggles
  onSidebarToggle?: () => void;
  isSidebarVisible?: boolean;
  onInspectorToggle?: () => void;
  isInspectorVisible?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchTerm,
  onSearchChange,
  searchScope = 'name',
  onSearchScopeChange,
  items,
  zoomLevel = 200,
  onZoomLevelChange,
  filters = defaultFilterState,
  onFiltersChange,
  layoutMode = 'masonry',
  onLayoutModeChange,
  sortBy = 'manual',
  onSortByChange,
  sortDirection = 'desc',
  onSortDirectionChange,
  viewSettings = defaultViewSettings,
  onViewSettingsChange,
  onSidebarToggle,
  isSidebarVisible = true,
  onInspectorToggle,
  isInspectorVisible = true,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const { ref: refs } = useRefSelector();

  // Use passed items or fall back to refs from store
  const searchItems = items ?? refs;

  // Extract unique tags from all refs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    refs.forEach((item) => {
      if (item.metadata.tags) {
        item.metadata.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [refs]);

  // Extract unique boards from all refs
  const allBoards = useMemo(() => {
    const boardSet = new Set<string>();
    refs.forEach((item) => {
      if (item.metadata.board_id) {
        boardSet.add(item.metadata.board_id);
      }
    });
    return Array.from(boardSet).sort();
  }, [refs]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tags.length > 0) count += filters.tags.length;
    if (filters.types.length > 0) count += filters.types.length;
    if (filters.boardIds.length > 0) count += filters.boardIds.length;
    return count;
  }, [filters]);

  // Filter handlers
  const toggleTag = (tag: string) => {
    if (!onFiltersChange) return;
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const toggleType = (type: Reftype) => {
    if (!onFiltersChange) return;
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const toggleBoard = (boardId: string) => {
    if (!onFiltersChange) return;
    const newBoardIds = filters.boardIds.includes(boardId)
      ? filters.boardIds.filter((b) => b !== boardId)
      : [...filters.boardIds, boardId];
    onFiltersChange({ ...filters, boardIds: newBoardIds });
  };

  const setTagLogic = (logic: 'and' | 'or') => {
    if (!onFiltersChange) return;
    onFiltersChange({ ...filters, tagLogic: logic });
  };

  const clearFilters = () => {
    if (!onFiltersChange) return;
    onFiltersChange(defaultFilterState);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-background/80 sticky top-0 z-30 flex w-full items-center gap-2 px-4 py-3 backdrop-blur-md transition-all">
        {/* Sidebar Toggle - Only show when sidebar is hidden */}
        {onSidebarToggle && !isSidebarVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground h-8 w-8"
                onClick={onSidebarToggle}
              >
                <FiSidebar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle sidebar (Ctrl+[)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Search Bar with Scope Dropdown */}
        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchScope={searchScope}
          onSearchScopeChange={onSearchScopeChange ?? (() => {})}
          items={searchItems}
        />

        {/* Filter Button (Icon Only) */}
        {onFiltersChange && (
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'relative h-8 w-8',
                      activeFilterCount > 0 && 'text-primary',
                    )}
                  >
                    <FiFilter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Filters</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground h-6 px-2 text-xs"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Type
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {REF_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleType(type.value)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                          filters.types.includes(type.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-foreground hover:bg-muted',
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Tags
                      </Label>
                      <div className="bg-muted/50 flex items-center gap-1 rounded-md p-0.5">
                        <button
                          onClick={() => setTagLogic('or')}
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            filters.tagLogic === 'or'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          Any
                        </button>
                        <button
                          onClick={() => setTagLogic('and')}
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            filters.tagLogic === 'and'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                              filters.tags.includes(tag)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 text-foreground hover:bg-muted',
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Boards Filter */}
                {allBoards.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Boards
                    </Label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {allBoards.map((boardId) => (
                          <button
                            key={boardId}
                            onClick={() => toggleBoard(boardId)}
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                              filters.boardIds.includes(boardId)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 text-foreground hover:bg-muted',
                            )}
                          >
                            {boardId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active Filter Pills */}
        {activeFilterCount > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {filters.types.slice(0, 2).map((type) => (
              <span
                key={type}
                className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              >
                {type}
                <button
                  onClick={() => toggleType(type)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <FiX className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {filters.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <FiX className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* View Settings Popover */}
        {onLayoutModeChange && onSortByChange && onViewSettingsChange && (
          <ViewSettingsPopover
            layoutMode={layoutMode}
            onLayoutModeChange={onLayoutModeChange}
            sortBy={sortBy}
            onSortByChange={onSortByChange}
            sortDirection={sortDirection}
            onSortDirectionChange={onSortDirectionChange ?? (() => {})}
            viewSettings={viewSettings}
            onViewSettingsChange={onViewSettingsChange}
            isSidebarVisible={isSidebarVisible}
            onSidebarToggle={onSidebarToggle ?? (() => {})}
            isInspectorVisible={isInspectorVisible}
            onInspectorToggle={onInspectorToggle ?? (() => {})}
          />
        )}

        {/* Zoom Slider */}
        {onZoomLevelChange && (
          <div className="border-border/40 ml-2 flex flex-shrink-0 items-center gap-2 rounded-lg border px-2 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    onZoomLevelChange(Math.max(100, zoomLevel - 25))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FiMinus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Zoom out (Ctrl+-)</p>
              </TooltipContent>
            </Tooltip>
            <Slider
              value={[zoomLevel]}
              onValueChange={([v]) => onZoomLevelChange(v)}
              min={100}
              max={400}
              step={25}
              className="w-20"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    onZoomLevelChange(Math.min(400, zoomLevel + 25))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FiPlus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Zoom in (Ctrl++)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TopBar;
