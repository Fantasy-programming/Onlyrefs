import React, { useState, useMemo } from 'react';
import { FiDownload, FiExternalLink, FiLayers, FiImage } from 'react-icons/fi';
import { RiFolderFill, RiPaletteLine } from 'react-icons/ri';
import { IoChevronDown } from 'react-icons/io5';
import { emit } from '@tauri-apps/api/event';
import { useLocation } from 'react-router-dom';
import { useDetailsPanel } from './DetailsPanelContext';
import {
  ImageRef,
  VideoRef,
  NoteRef,
  LinkRef,
  StackRef,
  Ref,
  Board,
} from '@/lib/types';
import { cn, parseFileSize, formatFileSize } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { saveMediaToDisk, elapsedTime, toAssetUrl } from '@/lib/helper';
import { TagPicker } from '../TagPicker/TagPicker';
import {
  setStackCover,
  removeFromStack,
  unstack,
  setBoardId,
  setRating,
  setSourceUrl,
} from '@/lib/commands';
import { useRefStore } from '@/state/refstore';
import { useBoardStore, useBoardTree, BoardTreeNode } from '@/state/boardstore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  RatingStars,
  ColorSwatchDropdown,
  CollapsibleSection,
  SourceUrlEditor,
  FormatBadge,
} from '@/components/DetailsPanel';

// Date formatting helper: YYYY/MM/DD HH:mm
const formatDate = (timestamp: number | string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const DetailsPanel: React.FC = () => {
  const { selectedItem, selectedItems, selectedBoard, isOpen } =
    useDetailsPanel();
  const location = useLocation();
  const isMultiSelect = selectedItems.length > 1;

  // Hide on board pages and settings page
  const isBoardPage = location.pathname.startsWith('/boards/');
  const isSettingsPage = location.pathname === '/settings';
  const isCanvasPage = location.pathname === '/canvas';

  if (isBoardPage || isSettingsPage || isCanvasPage) return null;

  // Don't render if not open
  if (!isOpen) return null;

  // If a board is selected, show BoardDetails
  if (selectedBoard) {
    return <BoardDetails board={selectedBoard} />;
  }

  const metadata = selectedItem?.metadata;
  const isImage = metadata?.ref_type === 'image';
  const isVideo = metadata?.ref_type === 'video';
  const isNote = metadata?.ref_type === 'note';
  const isLink = metadata?.ref_type === 'link';
  const isStack = metadata?.ref_type === 'stack';

  const deleteRefFromStore = useRefStore((state) => state.deleteRef);

  const handleExport = async () => {
    if ((isImage || isVideo) && metadata?.file_name) {
      await saveMediaToDisk(metadata.id, metadata.file_name);
    }
  };

  const handleUnstack = async () => {
    if (!isStack || !selectedItem) return;
    try {
      await unstack(metadata!.id);
      deleteRefFromStore(metadata!.id);
    } catch (error) {
      console.error('Failed to unstack:', error);
    }
  };

  const handleSetCover = async (coverId: string) => {
    if (!isStack || !selectedItem) return;
    try {
      await setStackCover(metadata!.id, coverId);
    } catch (error) {
      console.error('Failed to set cover:', error);
    }
  };

  const handleRemoveFromStack = async (itemId: string) => {
    if (!isStack || !selectedItem) return;
    try {
      await removeFromStack(metadata!.id, [itemId]);
    } catch (error) {
      console.error('Failed to remove from stack:', error);
    }
  };

  return (
    <aside
      className={cn(
        'border-border/40 bg-background/95 fixed top-0 right-0 z-30 flex h-screen w-[240px] flex-col border-l pt-4 shadow-xl backdrop-blur-sm',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
          Details
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isMultiSelect ? (
          <MultiSelectView items={selectedItems} />
        ) : selectedItem ? (
          <>
            {/* Preview Thumbnail */}
            <div className="bg-muted/20 relative mb-3 overflow-hidden rounded-lg">
              {isImage && (
                <>
                  <FormatBadge
                    format={
                      (selectedItem as ImageRef).metadata.media_type || 'image'
                    }
                  />
                  <img
                    src={toAssetUrl(
                      (selectedItem as ImageRef).low_res_imagepath,
                    )}
                    alt={metadata?.name || 'Preview'}
                    className="h-auto w-full object-cover"
                    style={{ maxHeight: '120px' }}
                  />
                </>
              )}
              {isVideo && (
                <>
                  <FormatBadge
                    format={
                      (selectedItem as VideoRef).metadata.media_type || 'video'
                    }
                  />
                  <video
                    src={toAssetUrl((selectedItem as VideoRef).video_path)}
                    className="h-auto w-full object-cover"
                    style={{ maxHeight: '120px' }}
                    muted
                    loop
                    autoPlay
                  />
                </>
              )}
              {isNote && (
                <>
                  <FormatBadge format="NOTE" />
                  <div className="text-muted-foreground p-4 text-xs italic">
                    {(selectedItem as NoteRef).content.slice(0, 150)}...
                  </div>
                </>
              )}
              {isLink && (
                <>
                  <FormatBadge format="LINK" />
                  <div className="p-4">
                    <p className="text-muted-foreground truncate text-xs">
                      {(selectedItem as LinkRef).metadata.source_uri}
                    </p>
                  </div>
                </>
              )}
              {isStack && (
                <>
                  <FormatBadge format="STACK" />
                  <StackPreviewThumbnail stack={selectedItem as StackRef} />
                </>
              )}
            </div>

            {/* Color Palette (moved up for images) */}
            {isImage &&
              (selectedItem as ImageRef).metadata.colors?.length > 0 && (
                <div className="mb-3 flex flex-wrap justify-center gap-1.5">
                  {(selectedItem as ImageRef).metadata.colors
                    .slice(0, 8)
                    .map((color, index) => (
                      <ColorSwatchDropdown
                        key={index}
                        color={color}
                        onFindSimilar={(c) => {
                          // TODO: Implement find similar color items
                          console.log('Find similar:', c);
                        }}
                      />
                    ))}
                </div>
              )}

            {/* Name - Editable */}
            <div className="mb-3">
              <NameEditor
                id={metadata!.id}
                path={selectedItem.metapath}
                name={metadata?.name || ''}
              />
            </div>

            {/* Description/Notes Field - Styled as a box */}
            <div className="bg-muted/50 mb-3 rounded-lg p-2">
              <label className="text-muted-foreground mb-1 block text-[10px] font-medium tracking-wider uppercase">
                Notes
              </label>
              <NotesEditor
                id={metadata!.id}
                path={selectedItem.metapath}
                notes={metadata?.note_text || ''}
              />
            </div>

            {/* Source URL */}
            <div className="bg-muted/50 mb-3 rounded-lg p-2">
              <label className="text-muted-foreground mb-1 block text-[10px] font-medium tracking-wider uppercase">
                URL
              </label>
              <SourceUrlEditor
                url={(metadata as any)?.source_url || null}
                onChange={async (url) => {
                  await setSourceUrl(metadata!.id, selectedItem.metapath, url);
                }}
              />
            </div>

            {/* Link Action (moved up) */}
            {isLink && (
              <div className="mb-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-full justify-start text-xs"
                  onClick={() =>
                    window.open(
                      (selectedItem as LinkRef).metadata.source_uri,
                      '_blank',
                    )
                  }
                >
                  <FiExternalLink className="mr-2 h-3 w-3" />
                  Open Link
                </Button>
              </div>
            )}

            {/* Stack Items Preview */}
            {isStack && (selectedItem as StackRef).items.length > 0 && (
              <div className="mb-3">
                <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-wider uppercase">
                  Stack Items ({(selectedItem as StackRef).items.length})
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(selectedItem as StackRef).items
                    .slice(0, 6)
                    .map((item: Ref) => {
                      const isCover =
                        item.metadata.id ===
                        (selectedItem as StackRef).metadata.cover_id;
                      const itemImageUrl =
                        item.metadata.ref_type === 'image'
                          ? toAssetUrl(
                              (item as ImageRef).low_res_imagepath ||
                                (item as ImageRef).image_path,
                            )
                          : null;

                      return (
                        <div
                          key={item.metadata.id}
                          className={cn(
                            'group bg-muted/30 relative aspect-square overflow-hidden rounded-md',
                            isCover && 'ring-primary ring-2',
                          )}
                        >
                          {itemImageUrl ? (
                            <img
                              src={itemImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FiImage className="text-muted-foreground h-4 w-4" />
                            </div>
                          )}
                          {/* Hover actions */}
                          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            {!isCover && (
                              <button
                                onClick={() => handleSetCover(item.metadata.id)}
                                className="bg-primary text-primary-foreground rounded px-1 py-0.5 text-[8px]"
                                title="Set as cover"
                              >
                                Cover
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleRemoveFromStack(item.metadata.id)
                              }
                              className="bg-destructive text-destructive-foreground rounded px-1 py-0.5 text-[8px]"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tags */}
            <CollapsibleSection
              title="Tags"
              storageKey="details-tags"
              className="mb-3"
            >
              <TagPicker
                id={metadata!.id}
                path={selectedItem.metapath}
                selectedTags={metadata?.tags || []}
              />
            </CollapsibleSection>

            {/* Board */}
            <CollapsibleSection
              title="Board"
              storageKey="details-board"
              className="mb-3"
            >
              <BoardSelector
                id={metadata!.id}
                path={selectedItem.metapath}
                boardId={metadata?.board_id || null}
              />
            </CollapsibleSection>

            {/* Properties */}
            <CollapsibleSection
              title="Properties"
              storageKey="details-properties"
            >
              <div className="space-y-2">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">
                    Rating
                  </span>
                  <RatingStars
                    rating={(metadata as any)?.rating || 0}
                    onChange={async (rating) => {
                      await setRating(
                        metadata!.id,
                        selectedItem.metapath,
                        rating,
                      );
                    }}
                  />
                </div>

                {/* Dimensions (for images/videos) */}
                {(isImage || isVideo) && metadata?.dimensions && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">
                      Dimensions
                    </span>
                    <span className="text-[11px]">
                      {metadata.dimensions[0]} x {metadata.dimensions[1]}
                    </span>
                  </div>
                )}

                {/* File Size */}
                {'file_size' in (metadata || {}) && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">
                      Size
                    </span>
                    <span className="text-[11px]">
                      {(metadata as any).file_size}
                    </span>
                  </div>
                )}

                {/* Type */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px]">
                    Type
                  </span>
                  <span className="text-[11px] capitalize">
                    {metadata?.ref_type || 'Unknown'}
                  </span>
                </div>

                {/* Date Imported (created_at) */}
                {metadata?.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">
                      Date Imported
                    </span>
                    <span className="text-[11px]">
                      {formatDate(metadata.created_at)}
                    </span>
                  </div>
                )}

                {/* Date Created (file_created if available) */}
                {(metadata as any)?.file_created && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">
                      Date Created
                    </span>
                    <span className="text-[11px]">
                      {formatDate((metadata as any).file_created)}
                    </span>
                  </div>
                )}

                {/* Date Modified (file_modified if available) */}
                {(metadata as any)?.file_modified && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">
                      Date Modified
                    </span>
                    <span className="text-[11px]">
                      {formatDate((metadata as any).file_modified)}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            Select an item to view details
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {selectedItem && (
        <div className="border-border/40 border-t p-2">
          <div className="flex gap-1.5">
            {(isImage || isVideo) && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={handleExport}
              >
                <FiDownload className="mr-1.5 h-3 w-3" />
                Export
              </Button>
            )}
            {isLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() =>
                  window.open(
                    (selectedItem as LinkRef).metadata.source_uri,
                    '_blank',
                  )
                }
              >
                <FiExternalLink className="mr-1.5 h-3 w-3" />
                Open
              </Button>
            )}
            {isStack && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={handleUnstack}
              >
                <FiLayers className="mr-1.5 h-3 w-3" />
                Unstack
              </Button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

// Multi-select view component
interface MultiSelectViewProps {
  items: Ref[];
}

const MultiSelectView: React.FC<MultiSelectViewProps> = ({ items }) => {
  // Calculate aggregated stats
  const stats = useMemo(() => {
    let totalBytes = 0;
    const allTags = new Set<string>();
    const boardIds = new Set<string | null>();

    items.forEach((item) => {
      const meta = item.metadata as any;
      if (meta?.file_size) {
        totalBytes += parseFileSize(meta.file_size);
      }
      if (meta?.tags) {
        meta.tags.forEach((tag: string) => allTags.add(tag));
      }
      boardIds.add(meta?.board_id || null);
    });

    // Find shared tags (tags that appear in all items)
    const sharedTags: string[] = [];
    allTags.forEach((tag) => {
      if (items.every((item) => item.metadata?.tags?.includes(tag))) {
        sharedTags.push(tag);
      }
    });

    // Check if all items share the same board
    const sharedBoardId = boardIds.size === 1 ? [...boardIds][0] : undefined;

    return {
      count: items.length,
      totalSize: formatFileSize(totalBytes),
      sharedTags,
      sharedBoardId,
    };
  }, [items]);

  // Get preview images for stacked preview (up to 3)
  const previewItems = useMemo(() => {
    return items.slice(0, 3).map((item) => {
      if (item.metadata.ref_type === 'image') {
        return toAssetUrl((item as ImageRef).low_res_imagepath);
      }
      if (item.metadata.ref_type === 'video') {
        return toAssetUrl((item as VideoRef).video_path);
      }
      return null;
    });
  }, [items]);

  const handleExportAll = async () => {
    for (const item of items) {
      const meta = item.metadata;
      if (
        (meta.ref_type === 'image' || meta.ref_type === 'video') &&
        meta.file_name
      ) {
        await saveMediaToDisk(meta.id, meta.file_name);
      }
    }
  };

  return (
    <>
      {/* Stacked Preview */}
      <div className="relative mb-3 h-[100px]">
        {previewItems.map((url, index) => (
          <div
            key={index}
            className="bg-muted/30 border-background absolute overflow-hidden rounded-lg border-2"
            style={{
              width: `${100 - index * 10}%`,
              height: `${100 - index * 10}px`,
              top: `${index * 8}px`,
              left: `${index * 5}%`,
              zIndex: 3 - index,
            }}
          >
            {url ? (
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiImage className="text-muted-foreground h-8 w-8" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Items Count */}
      <div className="mb-3 text-center">
        <p className="text-sm font-medium">{stats.count} items selected</p>
        <p className="text-muted-foreground text-xs">
          Total: {stats.totalSize}
        </p>
      </div>

      {/* Shared Tags */}
      <CollapsibleSection
        title="Tags"
        storageKey="details-tags-multi"
        className="mb-3"
      >
        {stats.sharedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {stats.sharedTags.map((tag) => (
              <span
                key={tag}
                className="bg-muted rounded-md px-2 py-0.5 text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[10px]">No shared tags</p>
        )}
      </CollapsibleSection>

      {/* Shared Board */}
      <CollapsibleSection
        title="Board"
        storageKey="details-board-multi"
        className="mb-3"
      >
        {stats.sharedBoardId !== undefined ? (
          <p className="text-muted-foreground text-xs">
            {stats.sharedBoardId ? 'Same board' : 'Uncategorized'}
          </p>
        ) : (
          <p className="text-muted-foreground text-[10px]">Multiple boards</p>
        )}
      </CollapsibleSection>

      {/* Properties */}
      <CollapsibleSection
        title="Properties"
        storageKey="details-properties-multi"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px]">Items</span>
            <span className="text-[11px]">{stats.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px]">
              Total Size
            </span>
            <span className="text-[11px]">{stats.totalSize}</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Export Button */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={handleExportAll}
        >
          <FiDownload className="mr-1.5 h-3 w-3" />
          Export All ({stats.count})
        </Button>
      </div>
    </>
  );
};

// Name Editor component
interface NameEditorProps {
  id: string;
  path: string;
  name: string;
}

const NameEditor: React.FC<NameEditorProps> = ({ id, path, name }) => {
  const [value, setValue] = useState(name);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (value !== name) {
      await emit('name_changed', { id, name: value, path });
    }
    setIsEditing(false);
  };

  return isEditing ? (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      className="h-7 text-xs"
      autoFocus
    />
  ) : (
    <p
      className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-xs"
      onClick={() => setIsEditing(true)}
    >
      {name || (
        <span className="text-muted-foreground">Click to add name...</span>
      )}
    </p>
  );
};

// Notes Editor component
interface NotesEditorProps {
  id: string;
  path: string;
  notes: string;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ id, path, notes }) => {
  const [value, setValue] = useState(notes);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (value !== notes) {
      await emit('note_text_changed', { id, content: value, path });
    }
    setIsEditing(false);
  };

  return isEditing ? (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      className="min-h-[60px] text-xs"
      placeholder="Add notes..."
      autoFocus
    />
  ) : (
    <p
      className="bg-muted/10 hover:bg-muted/20 min-h-[40px] cursor-pointer rounded px-2 py-1.5 text-xs"
      onClick={() => setIsEditing(true)}
    >
      {notes || (
        <span className="text-muted-foreground">Click to add notes...</span>
      )}
    </p>
  );
};

// Board Selector component - uses actual boards from store
interface BoardSelectorProps {
  id: string;
  path: string;
  boardId: string | null;
}

const BoardSelector: React.FC<BoardSelectorProps> = ({ id, path, boardId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const boards = useBoardStore((state) => state.boards);
  const boardTree = useBoardTree();

  // Find current board name
  const currentBoard = useMemo(() => {
    if (!boardId) return null;
    return boards.find((b) => b.id === boardId);
  }, [boards, boardId]);

  const handleSelectBoard = async (newBoardId: string | null) => {
    await setBoardId(id, path, newBoardId);
    setIsOpen(false);
  };

  // Recursive render for board tree
  const renderBoardTreeItem = (node: BoardTreeNode, depth: number = 0) => (
    <div key={node.board.id}>
      <button
        className={cn(
          'hover:bg-muted/50 w-full rounded px-2 py-1.5 text-left text-[10px] transition-colors',
          boardId === node.board.id && 'bg-primary/10 text-primary',
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => handleSelectBoard(node.board.id)}
      >
        {node.board.name}
      </button>
      {node.children.map((child) => renderBoardTreeItem(child, depth + 1))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-1.5 text-[10px] transition-colors">
          <span className={cn(!currentBoard && 'text-muted-foreground')}>
            {currentBoard?.name || 'Uncategorized'}
          </span>
          <IoChevronDown className="text-muted-foreground h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="max-h-48 overflow-y-auto">
          {/* Uncategorized option */}
          <button
            className={cn(
              'hover:bg-muted/50 w-full rounded px-2 py-1.5 text-left text-[10px] transition-colors',
              !boardId && 'bg-primary/10 text-primary',
            )}
            onClick={() => handleSelectBoard(null)}
          >
            Uncategorized
          </button>
          {/* Board tree */}
          {boardTree.map((node) => renderBoardTreeItem(node))}
          {boards.length === 0 && (
            <div className="text-muted-foreground px-2 py-2 text-center text-[10px]">
              No boards yet
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Stack Preview Thumbnail component for the main preview area
const StackPreviewThumbnail: React.FC<{ stack: StackRef }> = ({ stack }) => {
  // Find the cover item
  const coverItem = stack.items.find(
    (item) => item.metadata.id === stack.metadata.cover_id,
  );

  // Get cover image URL
  const coverUrl =
    coverItem && coverItem.metadata.ref_type === 'image'
      ? toAssetUrl(
          (coverItem as ImageRef).low_res_imagepath ||
            (coverItem as ImageRef).image_path,
        )
      : null;

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={stack.metadata.name || 'Stack preview'}
        className="h-auto w-full object-cover"
        style={{ maxHeight: '100px' }}
      />
    );
  }

  return (
    <div className="bg-muted/30 flex h-[80px] items-center justify-center">
      <FiLayers className="text-muted-foreground h-8 w-8" />
      <span className="text-muted-foreground ml-2 text-xs">
        {stack.items.length} items
      </span>
    </div>
  );
};

// Board color palette (same as LeftSidebar)
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

// Board Details component
interface BoardDetailsProps {
  board: Board;
}

const BoardDetails: React.FC<BoardDetailsProps> = ({ board }) => {
  const refs = useRefStore((state) => state.refs);
  const boards = useBoardStore((state) => state.boards);
  const renameBoard = useBoardStore((state) => state.renameBoard);
  const updateBoardColor = useBoardStore((state) => state.updateBoardColor);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(board.name);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Calculate stats for this board (including descendants)
  const stats = useMemo(() => {
    const getAllDescendantIds = (boardId: string): string[] => {
      const children = boards.filter((b) => b.parent_id === boardId);
      return children.flatMap((c) => [c.id, ...getAllDescendantIds(c.id)]);
    };

    const boardIds = [board.id, ...getAllDescendantIds(board.id)];

    // Get refs in this board and its descendants
    const boardRefs = refs.filter(
      (r) => r.metadata.board_id && boardIds.includes(r.metadata.board_id),
    );

    // Calculate total size
    let totalBytes = 0;
    boardRefs.forEach((ref) => {
      const metadata = ref.metadata as any;
      if (metadata.file_size) {
        totalBytes += parseFileSize(metadata.file_size);
      }
    });

    return {
      itemCount: boardRefs.length,
      totalSize: formatFileSize(totalBytes),
    };
  }, [board.id, refs, boards]);

  const folderColor = board.color || DEFAULT_BOARD_COLOR;

  const handleNameSave = async () => {
    if (nameValue.trim() && nameValue !== board.name) {
      try {
        await renameBoard(board.id, nameValue.trim());
      } catch (error) {
        console.error('Failed to rename board:', error);
        setNameValue(board.name);
      }
    }
    setIsEditingName(false);
  };

  const handleColorChange = async (color: string) => {
    try {
      await updateBoardColor(board.id, color);
      setIsColorPickerOpen(false);
    } catch (error) {
      console.error('Failed to update board color:', error);
    }
  };

  return (
    <aside
      className={cn(
        'border-border/40 bg-background/95 fixed top-0 right-0 z-30 flex h-screen w-[240px] flex-col border-l pt-4 shadow-xl backdrop-blur-sm',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
          Board Details
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Board Icon Preview */}
        <div className="bg-muted/20 mb-4 flex h-24 items-center justify-center rounded-lg">
          <RiFolderFill className="h-16 w-16" style={{ color: folderColor }} />
        </div>

        {/* Board Name - Editable */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-wider uppercase">
            Name
          </label>
          {isEditingName ? (
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              className="h-8 text-xs"
              autoFocus
            />
          ) : (
            <p
              className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1.5 text-sm font-medium"
              onClick={() => setIsEditingName(true)}
            >
              {board.name}
            </p>
          )}
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-wider uppercase">
            Color
          </label>
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <button className="bg-muted/30 hover:bg-muted/50 flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: folderColor }}
                />
                <span>
                  {BOARD_COLORS.find((c) => c.value === folderColor)?.name ||
                    'Custom'}
                </span>
                <RiPaletteLine className="text-muted-foreground ml-auto h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="grid grid-cols-6 gap-1.5">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      'h-6 w-6 rounded transition-transform hover:scale-110',
                      folderColor === color.value &&
                        'ring-offset-background ring-2 ring-white ring-offset-1',
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Properties */}
        <div className="border-border/40 space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px]">Items</span>
            <span className="text-[11px]">{stats.itemCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px]">Size</span>
            <span className="text-[11px]">{stats.totalSize}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px]">Created</span>
            <span className="text-[11px]">{elapsedTime(board.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-border/40 border-t p-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={() => {
            // TODO: Implement export board functionality
            console.log('Export board:', board.id);
          }}
        >
          <FiDownload className="mr-1.5 h-3 w-3" />
          Export Board
        </Button>
      </div>
    </aside>
  );
};

export default DetailsPanel;
