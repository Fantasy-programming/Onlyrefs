import React, {
  Suspense,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDisplayRefs, useRefStore } from '@/state/refstore';
import { useSelectionStore } from '@/state/selectionStore';
import {
  TopBar,
  FilterState,
  defaultFilterState,
} from '@/components/Layout/TopBar';
import { useLeftSidebar } from '@/components/Layout/LeftSidebarContext';
import { BoardItem, BoardItemSkeleton } from '@/components/BoardItem/BoardItem';
import { MasonryGrid } from '@/components/MasonryGrid/MasonryGrid';
import { JustifiedGrid } from '@/components/JustifiedGrid/JustifiedGrid';
import { UniformGrid } from '@/components/UniformGrid/UniformGrid';
import { ListView } from '@/components/ListView/ListView';
import { Progress } from '@/components/ui/progress';
import { useFileSelector } from '@/components/Board/Board.hook';
import { searchExtended, applyFilters } from '@/lib/helper';
import Logo from '@/assets/logo-bw.svg?react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createLinkRef, createNoteRef } from '@/lib/commands';
import { Ref } from '@/lib/types';
import { useDetailsPanel } from '@/components/Layout/DetailsPanelContext';
import {
  useSortBy,
  useSortDirection,
  useViewSettings,
  useSearchScope,
  useLayoutMode,
  useZoomLevel,
} from '@/state/hook';

// Note Editor imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';

// LocalStorage keys are no longer needed - using hooks from state/hook.tsx

const Home = () => {
  const allRefs = useDisplayRefs();
  const isLoading = useRefStore((state) => state.isLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [link, setLink] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectF, dropFiles, progress] = useFileSelector();
  const gridRef = useRef<HTMLDivElement>(null);

  // Layout mode state (persisted via hook)
  const [layoutMode, setLayoutMode] = useLayoutMode('masonry');

  // Zoom level state (persisted via hook)
  const [zoomLevel, setZoomLevel] = useZoomLevel(200);

  // Sort state (persisted via hooks)
  const [sortBy, setSortBy] = useSortBy('manual');
  const [sortDirection, setSortDirection] = useSortDirection('desc');

  // View settings (persisted via hook)
  const [viewSettings, updateViewSettings] = useViewSettings();

  // Search scope (persisted via hook)
  const [searchScope, setSearchScope] = useSearchScope('name');

  // Left sidebar context
  const {
    activeFilter,
    isVisible: isSidebarVisible,
    toggleVisibility: toggleSidebar,
  } = useLeftSidebar();

  // Selection store
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const selectMultiple = useSelectionStore((state) => state.selectMultiple);

  // Details panel
  const { togglePanel, isOpen: isInspectorVisible } = useDetailsPanel();

  // Filter refs by left sidebar filter, top bar filters, and search term
  const filteredRefs = useMemo(() => {
    let result = allRefs;

    // Apply left sidebar filter
    switch (activeFilter.type) {
      case 'all':
        // No filter
        break;
      case 'uncategorized':
        result = result.filter(
          (r) => !r.metadata.board_id || r.metadata.board_id === null,
        );
        break;
      case 'untagged':
        result = result.filter(
          (r) => !r.metadata.tags || r.metadata.tags.length === 0,
        );
        break;
      case 'recent':
        // Sort by created_at descending and take first 50
        result = [...result]
          .sort(
            (a, b) =>
              new Date(b.metadata.created_at).getTime() -
              new Date(a.metadata.created_at).getTime(),
          )
          .slice(0, 50);
        break;
      case 'random':
        // Shuffle and take 20
        result = [...result].sort(() => Math.random() - 0.5).slice(0, 20);
        break;
      case 'board':
        // Filter by board ID - activeFilter.boardIds contains the board and all descendants
        if (activeFilter.boardIds && activeFilter.boardIds.length > 0) {
          result = result.filter(
            (r) =>
              r.metadata.board_id &&
              activeFilter.boardIds!.includes(r.metadata.board_id),
          );
        }
        break;
      default:
        break;
    }

    // Apply TopBar filters (types, tags, boards)
    result = applyFilters(result, filters);

    // Filter by search term
    if (searchTerm) {
      result = searchExtended(result, searchTerm);
    }

    // Ensure all items have valid metadata.id
    result = result.filter((item) => item?.metadata?.id);

    // Apply sorting (skip if sortBy is 'manual' or if already sorted by special filters)
    if (
      sortBy !== 'manual' &&
      activeFilter.type !== 'recent' &&
      activeFilter.type !== 'random'
    ) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        const metaA = a.metadata;
        const metaB = b.metadata;

        switch (sortBy) {
          case 'date_added':
          case 'date_created':
            comparison =
              new Date(metaA.created_at).getTime() -
              new Date(metaB.created_at).getTime();
            break;
          case 'date_modified':
            comparison =
              new Date(metaA.updated_at).getTime() -
              new Date(metaB.updated_at).getTime();
            break;
          case 'title':
            comparison = (metaA.name || '').localeCompare(metaB.name || '');
            break;
          case 'extension': {
            const extA =
              'file_name' in metaA
                ? metaA.file_name?.split('.').pop() || ''
                : '';
            const extB =
              'file_name' in metaB
                ? metaB.file_name?.split('.').pop() || ''
                : '';
            comparison = extA.localeCompare(extB);
            break;
          }
          case 'file_size': {
            const sizeA =
              'file_size' in metaA ? parseInt(metaA.file_size || '0', 10) : 0;
            const sizeB =
              'file_size' in metaB ? parseInt(metaB.file_size || '0', 10) : 0;
            comparison = sizeA - sizeB;
            break;
          }
          case 'dimensions': {
            const dimsA =
              'dimensions' in metaA
                ? (metaA.dimensions?.[0] || 0) * (metaA.dimensions?.[1] || 0)
                : 0;
            const dimsB =
              'dimensions' in metaB
                ? (metaB.dimensions?.[0] || 0) * (metaB.dimensions?.[1] || 0)
                : 0;
            comparison = dimsA - dimsB;
            break;
          }
          case 'rating': {
            const ratingA = metaA.rating || 0;
            const ratingB = metaB.rating || 0;
            comparison = ratingA - ratingB;
            break;
          }
          case 'random':
            comparison = Math.random() - 0.5;
            break;
          default:
            comparison = 0;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [allRefs, activeFilter, searchTerm, filters, sortBy, sortDirection]);

  // Setup file drop handler - only once on mount
  useEffect(() => {
    if (dropFiles) {
      dropFiles('all');
    }
  }, []); // Empty dependency array - only run once

  // Hotkeys using react-hotkeys-hook
  useHotkeys(
    'ctrl+o, meta+o',
    (e) => {
      e.preventDefault();
      if (selectF) selectF('all');
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+l, meta+l',
    (e) => {
      e.preventDefault();
      setLinkDialogOpen(true);
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+n, meta+n',
    (e) => {
      e.preventDefault();
      setNoteDialogOpen(true);
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+a, meta+a',
    (e) => {
      e.preventDefault();
      const allIds = filteredRefs.map((r) => r.metadata.id);
      selectMultiple(allIds);
    },
    { enableOnFormTags: false },
    [filteredRefs, selectMultiple],
  );

  useHotkeys(
    'escape',
    () => {
      clearSelection();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+b, meta+b',
    (e) => {
      e.preventDefault();
      togglePanel();
    },
    { enableOnFormTags: false },
  );

  // Toggle left sidebar with Ctrl+[
  useHotkeys(
    'ctrl+[, meta+[',
    (e) => {
      e.preventDefault();
      toggleSidebar();
    },
    { enableOnFormTags: false },
  );

  // Toggle right panel (inspector) with Ctrl+]
  useHotkeys(
    'ctrl+], meta+]',
    (e) => {
      e.preventDefault();
      togglePanel();
    },
    { enableOnFormTags: false },
  );

  // Zoom shortcuts
  useHotkeys(
    'ctrl+=, meta+=, ctrl+plus, meta+plus',
    (e) => {
      e.preventDefault();
      setZoomLevel(Math.min(400, zoomLevel + 25));
    },
    { enableOnFormTags: false },
    [zoomLevel, setZoomLevel],
  );

  useHotkeys(
    'ctrl+-, meta+-',
    (e) => {
      e.preventDefault();
      setZoomLevel(Math.max(100, zoomLevel - 25));
    },
    { enableOnFormTags: false },
    [zoomLevel, setZoomLevel],
  );

  // Layout mode shortcuts (Ctrl+1, 2, 3, 4)
  useHotkeys(
    'ctrl+1, meta+1',
    (e) => {
      e.preventDefault();
      setLayoutMode('masonry');
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+2, meta+2',
    (e) => {
      e.preventDefault();
      setLayoutMode('justified');
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+3, meta+3',
    (e) => {
      e.preventDefault();
      setLayoutMode('grid');
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'ctrl+4, meta+4',
    (e) => {
      e.preventDefault();
      setLayoutMode('list');
    },
    { enableOnFormTags: false },
  );

  const handleLinkCreation = async () => {
    if (link.trim()) {
      try {
        await createLinkRef(link, 'all');
        setLinkDialogOpen(false);
        setLink('');
      } catch (error) {
        console.error('Failed to create link:', error);
      }
    }
  };

  // Calculate column count based on zoom level for masonry
  const columnCount = useMemo(() => {
    // Higher zoom = fewer columns, lower zoom = more columns
    // At 200px zoom: ~5 columns on typical screen
    // At 400px zoom: ~3 columns
    // At 100px zoom: ~8 columns
    if (zoomLevel <= 125) return 8;
    if (zoomLevel <= 175) return 6;
    if (zoomLevel <= 250) return 5;
    if (zoomLevel <= 325) return 4;
    return 3;
  }, [zoomLevel]);

  // Render item helper
  const renderItem = useCallback(
    (item: Ref, index: number) => (
      <Suspense
        key={item.metadata.id || index}
        fallback={<BoardItemSkeleton />}
      >
        <BoardItem refItem={item} />
      </Suspense>
    ),
    [],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar with Search and Filters */}
      <TopBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchScope={searchScope}
        onSearchScopeChange={setSearchScope}
        items={filteredRefs}
        zoomLevel={zoomLevel}
        onZoomLevelChange={setZoomLevel}
        filters={filters}
        onFiltersChange={setFilters}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        viewSettings={viewSettings}
        onViewSettingsChange={updateViewSettings}
        onSidebarToggle={toggleSidebar}
        isSidebarVisible={isSidebarVisible}
        onInspectorToggle={togglePanel}
        isInspectorVisible={isInspectorVisible}
      />

      {/* Main Content */}
      <div
        ref={gridRef}
        className="flex-1 overflow-x-hidden overflow-y-auto pt-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Logo className="h-24 w-24 animate-pulse opacity-40 dark:opacity-20" />
              <span className="text-muted-foreground text-sm">
                Loading references...
              </span>
            </div>
          </div>
        ) : allRefs.length !== 0 ? (
          <div className="p-4">
            {layoutMode === 'masonry' && (
              <MasonryGrid
                items={filteredRefs}
                columnCount={columnCount}
                gap={12}
                gridKey={`${activeFilter.type}-${searchTerm}-${filters.tags.join(',')}-${filters.types.join(',')}-${filteredRefs.length}`}
                scrollContainerRef={gridRef}
                renderItem={renderItem}
              />
            )}
            {layoutMode === 'justified' && (
              <JustifiedGrid
                items={filteredRefs}
                targetRowHeight={zoomLevel}
                gap={12}
                renderItem={renderItem}
              />
            )}
            {layoutMode === 'grid' && (
              <UniformGrid
                items={filteredRefs}
                cellSize={zoomLevel}
                gap={12}
                renderItem={renderItem}
              />
            )}
            {layoutMode === 'list' && (
              <ListView
                items={filteredRefs}
                rowHeight={Math.max(50, Math.min(100, zoomLevel / 2))}
              />
            )}
          </div>
        ) : (
          <div className="relative h-full w-full">
            <div className="text-muted/80 absolute top-1/3 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 text-center font-serif text-2xl md:text-3xl">
              <Logo className="h-36 w-36 stroke-transparent stroke-0 opacity-40 outline-0 md:h-64 md:w-64 dark:opacity-20" />
              <span className="opacity-80 dark:opacity-30">
                Drop or Save Reference file here to start
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Portal */}
      {progress.total !== progress.completed &&
        ReactDOM.createPortal(
          <div className="fixed right-5 bottom-5 z-50 h-20 w-[300px] rounded-md bg-white text-black shadow-md">
            <Progress
              className="space-y-1 p-4"
              getValueLabel={() => 'Processing...'}
              value={progress.completed}
              max={progress.total}
            />
          </div>,
          document.body,
        )}

      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>
              Save this link to your collection
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4 py-4">
            <Label htmlFor="link" className="text-right">
              Link
            </Label>
            <Input
              id="link"
              className="col-span-3"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLinkCreation();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleLinkCreation}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Creation Modal */}
      <NoteCreationModal
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />
    </div>
  );
};

export default Home;

// Note Creation Modal Component
interface NoteCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NoteCreationModal: React.FC<NoteCreationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing your note here...' }),
      (Markdown as any).configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm max-w-full min-h-[200px]',
      },
    },
    content: '',
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      const text = (editor.storage as any).markdown.getMarkdown();
      if (!text.trim()) return;

      await createNoteRef('all', text);
      editor.commands.clearContent();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [editor, onOpenChange]);

  // Handle Ctrl+Enter to save
  useHotkeys(
    'ctrl+enter, meta+enter',
    (e) => {
      e.preventDefault();
      handleSave();
    },
    { enabled: open, enableOnFormTags: true, enableOnContentEditable: true },
    [handleSave, open],
  );

  // Clear editor when modal closes
  useEffect(() => {
    if (!open && editor) {
      // Small delay to avoid visual glitch
      const timer = setTimeout(() => {
        editor.commands.clearContent();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, editor]);

  if (!editor) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
          <DialogDescription>
            Create a new note. Press Ctrl+Enter to save.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="border-border/40 min-h-[200px] rounded-lg border p-4">
            <EditorContent editor={editor} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
