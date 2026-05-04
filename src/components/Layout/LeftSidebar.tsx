import React, { useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  RiHome5Line,
  RiHome5Fill,
  RiFolderLine,
  RiFolderFill,
  RiPriceTag3Line,
  RiPriceTag3Fill,
  RiTimeLine,
  RiShuffleLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiAddLine,
  RiMore2Fill,
  RiEditLine,
  RiDeleteBinLine,
  RiArtboardLine,
  RiArtboardFill,
  RiPaletteLine,
} from 'react-icons/ri';
import { FiSearch, FiSidebar } from 'react-icons/fi';
import Logo from '@/assets/logo-simple.svg?react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useRefStore } from '@/state/refstore';
import { useBoardStore, useBoardTree, BoardTreeNode } from '@/state/boardstore';
import { useCanvasListStore } from '@/state/canvasliststore';
import { useLeftSidebar, ActiveFilter } from './LeftSidebarContext';
import { useDetailsPanel } from './DetailsPanelContext';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Label } from '../ui/label';

// Board color palette
const BOARD_COLORS = [
  { name: 'Gray', value: '#9CA3AF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
];

const DEFAULT_BOARD_COLOR = '#9CA3AF';

interface NavItemProps {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  to?: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  activeIcon,
  label,
  count,
  active,
  onClick,
  to,
}) => {
  const content = (
    <div
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-blue-500/10 text-blue-500'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-5 w-5 items-center justify-center">
          {active ? activeIcon : icon}
        </span>
        <span className="font-medium">{label}</span>
      </div>
      {count !== undefined && (
        <span
          className={cn(
            'text-xs',
            active ? 'text-blue-500' : 'text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
};

// Recursive board tree item component using BoardTreeNode from store
interface BoardTreeItemProps {
  node: BoardTreeNode;
  depth: number;
  activeFilter: ActiveFilter;
  onSelect: (boardId: string) => void;
  expandedBoards: Set<string>;
  toggleExpand: (boardId: string) => void;
  refCountsByBoard: Map<string, number>;
  onRename: (boardId: string, currentName: string) => void;
  onDelete: (boardId: string) => void;
  onAddChild: (parentId: string) => void;
  onColorChange: (boardId: string, color: string) => void;
}

const BoardTreeItem: React.FC<BoardTreeItemProps> = ({
  node,
  depth,
  activeFilter,
  onSelect,
  expandedBoards,
  toggleExpand,
  refCountsByBoard,
  onRename,
  onDelete,
  onAddChild,
  onColorChange,
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedBoards.has(node.board.id);
  const isActive =
    activeFilter.type === 'board' && activeFilter.boardId === node.board.id;

  // Get folder color (default to gray)
  const folderColor = node.board.color || DEFAULT_BOARD_COLOR;

  // Calculate total count including children
  const totalCount = useMemo(() => {
    const countNode = (n: BoardTreeNode): number => {
      const directCount = refCountsByBoard.get(n.board.id) || 0;
      return directCount + n.children.reduce((sum, c) => sum + countNode(c), 0);
    };
    return countNode(node);
  }, [node, refCountsByBoard]);

  return (
    <div>
      <div
        className={cn(
          'group relative flex cursor-pointer items-center justify-between rounded-lg py-1.5 pr-1 text-sm transition-colors',
          isActive
            ? 'bg-blue-500/10 text-blue-500'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        onClick={() => onSelect(node.board.id)}
      >
        {/* Expand/collapse arrow - positioned outside the flow */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.board.id);
            }}
            className="hover:bg-muted-foreground/20 absolute left-0 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
            style={{ left: `${depth * 12}px` }}
          >
            {isExpanded ? (
              <RiArrowDownSLine className="h-4 w-4" />
            ) : (
              <RiArrowRightSLine className="h-4 w-4" />
            )}
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <RiFolderFill
              className="h-4 w-4 opacity-70"
              style={{ color: folderColor }}
            />
          </span>
          <span className="truncate">{node.board.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'flex-shrink-0 text-xs',
              isActive ? 'text-blue-500' : 'text-muted-foreground',
            )}
          >
            {totalCount}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="hover:bg-muted-foreground/20 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
              >
                <RiMore2Fill className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.board.id);
                }}
              >
                <RiAddLine className="mr-2 h-4 w-4" />
                Add sub-board
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(node.board.id, node.board.name);
                }}
              >
                <RiEditLine className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <RiPaletteLine className="mr-2 h-4 w-4" />
                  Color
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {BOARD_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          onColorChange(node.board.id, color.value);
                        }}
                        className={cn(
                          'h-5 w-5 rounded-sm transition-transform hover:scale-110',
                          folderColor === color.value &&
                            'ring-offset-background ring-2 ring-white ring-offset-1',
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.board.id);
                }}
                className="text-red-500 focus:text-red-500"
              >
                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <BoardTreeItem
              key={child.board.id}
              node={child}
              depth={depth + 1}
              activeFilter={activeFilter}
              onSelect={onSelect}
              expandedBoards={expandedBoards}
              toggleExpand={toggleExpand}
              refCountsByBoard={refCountsByBoard}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onColorChange={onColorChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LeftSidebar: React.FC = () => {
  const location = useLocation();
  const refs = useRefStore((state) => state.refs);
  const { activeFilter, setActiveFilter, toggleVisibility } = useLeftSidebar();
  const { selectBoard } = useDetailsPanel();
  const [boardFilter, setBoardFilter] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(
    new Set(['*']),
  ); // '*' means expand all by default

  // Board store
  const boardTree = useBoardTree();
  const boards = useBoardStore((state) => state.boards);
  const createBoard = useBoardStore((state) => state.createBoard);
  const renameBoard = useBoardStore((state) => state.renameBoard);
  const deleteBoard = useBoardStore((state) => state.deleteBoard);
  const getDescendants = useBoardStore((state) => state.getDescendants);
  const updateBoardColor = useBoardStore((state) => state.updateBoardColor);

  // Canvas store
  const canvases = useCanvasListStore((state) => state.canvases);

  // Dialog states
  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardParentId, setNewBoardParentId] = useState<string | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameBoardId, setRenameBoardId] = useState<string | null>(null);
  const [renameBoardName, setRenameBoardName] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);

  // Calculate counts from refs
  const counts = useMemo(() => {
    const all = refs.length;
    const uncategorized = refs.filter(
      (r) => !r.metadata.board_id || r.metadata.board_id === null,
    ).length;
    const untagged = refs.filter(
      (r) => !r.metadata.tags || r.metadata.tags.length === 0,
    ).length;
    const allTags = new Set<string>();
    refs.forEach((r) => r.metadata.tags?.forEach((t) => allTags.add(t)));

    return {
      all,
      uncategorized,
      untagged,
      tags: allTags.size,
    };
  }, [refs]);

  // Calculate ref counts by board
  const refCountsByBoard = useMemo(() => {
    const countMap = new Map<string, number>();
    refs.forEach((r) => {
      const boardId = r.metadata.board_id;
      if (boardId) {
        countMap.set(boardId, (countMap.get(boardId) || 0) + 1);
      }
    });
    return countMap;
  }, [refs]);

  // Filter board tree by search
  const filteredBoardTree = useMemo(() => {
    if (!boardFilter) return boardTree;

    const filterNode = (node: BoardTreeNode): BoardTreeNode | null => {
      const matchesFilter = node.board.name
        .toLowerCase()
        .includes(boardFilter.toLowerCase());
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is BoardTreeNode => n !== null);

      if (matchesFilter || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return boardTree
      .map(filterNode)
      .filter((n): n is BoardTreeNode => n !== null);
  }, [boardTree, boardFilter]);

  const isFilterActive = (type: ActiveFilter['type']) => {
    return activeFilter.type === type;
  };

  // Toggle board expansion
  const toggleExpand = useCallback(
    (boardId: string) => {
      setExpandedBoards((prev) => {
        const next = new Set(prev);
        // When removing '*', first populate with all board IDs to maintain current state
        if (next.has('*')) {
          next.delete('*');
          boards.forEach((b) => next.add(b.id));
        }

        if (next.has(boardId)) {
          next.delete(boardId);
        } else {
          next.add(boardId);
        }
        return next;
      });
    },
    [boards],
  );

  // Handle board selection - fetch descendants and set filter
  const handleSelectBoard = useCallback(
    async (boardId: string) => {
      try {
        const descendants = await getDescendants(boardId);
        // Include the selected board plus all descendants
        const boardIds = [boardId, ...descendants];
        setActiveFilter({ type: 'board', boardId, boardIds });

        // Also select the board in the details panel
        const board = boards.find((b) => b.id === boardId);
        if (board) {
          selectBoard(board);
        }
      } catch (error) {
        console.error('Failed to get board descendants:', error);
        setActiveFilter({ type: 'board', boardId, boardIds: [boardId] });
      }
    },
    [getDescendants, setActiveFilter, boards, selectBoard],
  );

  // Handle create new board
  const handleCreateBoard = useCallback(async () => {
    if (newBoardName.trim()) {
      try {
        const board = await createBoard(newBoardName.trim(), newBoardParentId);
        if (board) {
          // Auto-expand parent if creating a sub-board
          if (newBoardParentId) {
            setExpandedBoards((prev) => new Set([...prev, newBoardParentId]));
          }
          // Select the newly created board
          handleSelectBoard(board.id);
        }
        setNewBoardDialogOpen(false);
        setNewBoardName('');
        setNewBoardParentId(null);
      } catch (error) {
        console.error('Failed to create board:', error);
      }
    }
  }, [newBoardName, newBoardParentId, createBoard, handleSelectBoard]);

  // Handle rename board
  const handleRenameBoard = useCallback(async () => {
    if (renameBoardId && renameBoardName.trim()) {
      try {
        await renameBoard(renameBoardId, renameBoardName.trim());
        setRenameDialogOpen(false);
        setRenameBoardId(null);
        setRenameBoardName('');
      } catch (error) {
        console.error('Failed to rename board:', error);
      }
    }
  }, [renameBoardId, renameBoardName, renameBoard]);

  // Handle delete board
  const handleDeleteBoard = useCallback(async () => {
    if (deleteBoardId) {
      try {
        await deleteBoard(deleteBoardId);
        // If deleted board was selected, go back to all
        if (
          activeFilter.type === 'board' &&
          activeFilter.boardId === deleteBoardId
        ) {
          setActiveFilter({ type: 'all' });
        }
        setDeleteDialogOpen(false);
        setDeleteBoardId(null);
      } catch (error) {
        console.error('Failed to delete board:', error);
      }
    }
  }, [deleteBoardId, deleteBoard, activeFilter, setActiveFilter]);

  // Open rename dialog
  const openRenameDialog = useCallback(
    (boardId: string, currentName: string) => {
      setRenameBoardId(boardId);
      setRenameBoardName(currentName);
      setRenameDialogOpen(true);
    },
    [],
  );

  // Open delete dialog
  const openDeleteDialog = useCallback((boardId: string) => {
    setDeleteBoardId(boardId);
    setDeleteDialogOpen(true);
  }, []);

  // Open add sub-board dialog
  const openAddChildDialog = useCallback((parentId: string) => {
    setNewBoardParentId(parentId);
    setNewBoardName('');
    setNewBoardDialogOpen(true);
  }, []);

  // Handle color change
  const handleColorChange = useCallback(
    async (boardId: string, color: string) => {
      try {
        await updateBoardColor(boardId, color);
      } catch (error) {
        console.error('Failed to update board color:', error);
      }
    },
    [updateBoardColor],
  );

  // Check if we're on a special page
  const isTagsPage = location.pathname === '/tags';
  const isCanvasesPage = location.pathname === '/canvases';

  // Check if all boards should be expanded (when filtering or '*' is in set)
  const shouldExpandAll = boardFilter.length > 0 || expandedBoards.has('*');
  const effectiveExpandedBoards = shouldExpandAll
    ? new Set([...Array.from(expandedBoards), ...boards.map((b) => b.id)])
    : expandedBoards;

  return (
    <aside className="bg-background/95 border-border/40 fixed top-0 left-0 z-40 flex h-screen w-[220px] flex-col border-r pt-3 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Logo className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Onlyrefs</span>
        </div>
        <button
          onClick={toggleVisibility}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded transition-colors"
          title="Toggle sidebar (Ctrl+[)"
        >
          <FiSidebar className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="space-y-0.5 px-2">
        <NavItem
          icon={<RiHome5Line className="h-4 w-4" />}
          activeIcon={<RiHome5Fill className="h-4 w-4" />}
          label="All"
          count={counts.all}
          active={isFilterActive('all') && !isTagsPage && !isCanvasesPage}
          onClick={() => setActiveFilter({ type: 'all' })}
          to="/"
        />
        <NavItem
          icon={<RiFolderLine className="h-4 w-4" />}
          activeIcon={<RiFolderFill className="h-4 w-4" />}
          label="Uncategorized"
          count={counts.uncategorized}
          active={
            isFilterActive('uncategorized') && !isTagsPage && !isCanvasesPage
          }
          onClick={() => setActiveFilter({ type: 'uncategorized' })}
          to="/"
        />
        <NavItem
          icon={<RiPriceTag3Line className="h-4 w-4" />}
          activeIcon={<RiPriceTag3Fill className="h-4 w-4" />}
          label="Untagged"
          count={counts.untagged}
          active={isFilterActive('untagged') && !isTagsPage && !isCanvasesPage}
          onClick={() => setActiveFilter({ type: 'untagged' })}
          to="/"
        />
        <NavItem
          icon={<RiTimeLine className="h-4 w-4" />}
          activeIcon={<RiTimeLine className="h-4 w-4" />}
          label="Recently Used"
          active={isFilterActive('recent') && !isTagsPage && !isCanvasesPage}
          onClick={() => setActiveFilter({ type: 'recent' })}
          to="/"
        />
        <NavItem
          icon={<RiShuffleLine className="h-4 w-4" />}
          activeIcon={<RiShuffleLine className="h-4 w-4" />}
          label="Random"
          active={isFilterActive('random') && !isTagsPage && !isCanvasesPage}
          onClick={() => setActiveFilter({ type: 'random' })}
          to="/"
        />
        <NavItem
          icon={<RiPriceTag3Line className="h-4 w-4" />}
          activeIcon={<RiPriceTag3Fill className="h-4 w-4" />}
          label="All Tags"
          count={counts.tags}
          active={isTagsPage}
          to="/tags"
        />
        <NavItem
          icon={<RiArtboardLine className="h-4 w-4" />}
          activeIcon={<RiArtboardFill className="h-4 w-4" />}
          label="Canvases"
          count={canvases.length}
          active={isCanvasesPage}
          to="/canvases"
        />
      </div>

      {/* Divider */}
      <div className="border-border/40 my-4 border-t" />

      {/* Boards Section */}
      <div className="flex flex-1 flex-col overflow-hidden px-2">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Boards ({boards.length})
          </span>
          <button
            onClick={() => {
              setNewBoardParentId(null);
              setNewBoardName('');
              setNewBoardDialogOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1 transition-colors"
            title="Create new board"
          >
            <RiAddLine className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 pr-2">
            {filteredBoardTree.map((node) => (
              <BoardTreeItem
                key={node.board.id}
                node={node}
                depth={0}
                activeFilter={activeFilter}
                onSelect={handleSelectBoard}
                expandedBoards={effectiveExpandedBoards}
                toggleExpand={toggleExpand}
                refCountsByBoard={refCountsByBoard}
                onRename={openRenameDialog}
                onDelete={openDeleteDialog}
                onAddChild={openAddChildDialog}
                onColorChange={handleColorChange}
              />
            ))}
            {filteredBoardTree.length === 0 && boards.length === 0 && (
              <div className="text-muted-foreground px-3 py-4 text-center text-xs">
                No boards yet. Create one to organize your refs.
              </div>
            )}
            {filteredBoardTree.length === 0 && boards.length > 0 && (
              <div className="text-muted-foreground px-3 py-4 text-center text-xs">
                No boards match your filter
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Board Filter */}
      <div className="border-border/40 border-t p-3">
        <div className="relative">
          <FiSearch className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Filter boards..."
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="bg-muted/50 h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* New Board Dialog */}
      <Dialog open={newBoardDialogOpen} onOpenChange={setNewBoardDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {newBoardParentId ? 'Create Sub-Board' : 'Create New Board'}
            </DialogTitle>
            <DialogDescription>
              {newBoardParentId
                ? 'Enter a name for the new sub-board.'
                : 'Enter a name for your new board.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                placeholder="e.g., Inspiration"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBoard();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewBoardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Board Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Board</DialogTitle>
            <DialogDescription>
              Enter a new name for the board.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-board-name">Board Name</Label>
              <Input
                id="rename-board-name"
                value={renameBoardName}
                onChange={(e) => setRenameBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameBoard();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameBoard}
              disabled={!renameBoardName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this board? Refs in this board
              will be moved to the parent board (or become uncategorized if this
              is a root board).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBoard}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default LeftSidebar;
