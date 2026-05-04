import React, { memo, useCallback, useState } from 'react';
import { StackRef, ImageRef, Ref } from '@/lib/types';
import { toAssetUrl } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { useViewer } from '../Viewer/ViewerContext';
import { useDetailsPanel } from '../Layout/DetailsPanelContext';
import { useRefStore } from '@/state/refstore';
import { useSelectionStore } from '@/state/selectionStore';
import { unstack } from '@/lib/commands';
import { useViewerNavigation } from '@/hooks/use-viewer-navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';
import {
  FiLayers,
  FiTrash2,
  FiCopy,
  FiEye,
  FiMaximize2,
  FiCheck,
} from 'react-icons/fi';

interface StackItemProps {
  stackInfo: StackRef;
}

// Get the image URL from a ref item (for preview)
const getItemImageUrl = (item: Ref): string | null => {
  const type = item.metadata.ref_type;

  if (type === 'image') {
    const imageRef = item as ImageRef;
    // For GIFs, always use the full image path to preserve animation
    const isGif =
      imageRef.metadata.file_name?.toLowerCase().endsWith('.gif') ||
      imageRef.metadata.media_type?.includes('gif');
    return toAssetUrl(
      isGif
        ? imageRef.image_path
        : imageRef.low_res_imagepath || imageRef.image_path,
    );
  }

  if (type === 'video') {
    // Videos don't have thumbnails in this system, return null
    return null;
  }

  return null;
};

// Get cover image URL for the stack
const getCoverImageUrl = (stack: StackRef): string | null => {
  const coverId = stack.metadata.cover_id;
  const coverItem = stack.items.find((item) => item.metadata.id === coverId);
  if (coverItem) {
    return getItemImageUrl(coverItem);
  }
  // Fallback to first item if cover not found
  if (stack.items.length > 0) {
    return getItemImageUrl(stack.items[0]);
  }
  return null;
};

// Context Menu for Stack
const StackContextMenu = memo<{
  children: React.ReactNode;
  stackInfo: StackRef;
}>(({ children, stackInfo }) => {
  const navigateToViewer = useViewerNavigation();
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);
  const { openViewer } = useViewer();

  const handleUnstack = useCallback(async () => {
    try {
      await unstack(stackInfo.metadata.id);
      deleteRefFromStore(stackInfo.metadata.id);
      // Items will be re-fetched or the backend will emit events for them
    } catch (error) {
      console.error('Failed to unstack:', error);
    }
  }, [stackInfo.metadata.id, deleteRefFromStore]);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(stackInfo.metadata.id);
  }, [stackInfo.metadata.id]);

  const handleQuickPreview = useCallback(() => {
    openViewer(stackInfo);
  }, [openViewer, stackInfo]);

  const handleOpenViewer = useCallback(() => {
    navigateToViewer(stackInfo.metadata.id);
  }, [navigateToViewer, stackInfo.metadata.id]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleQuickPreview}>
          <FiEye className="mr-2 h-4 w-4" />
          Quick Preview
          <span className="text-muted-foreground ml-auto text-xs">Space</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleOpenViewer}>
          <FiMaximize2 className="mr-2 h-4 w-4" />
          Open Stack
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleCopyId}>
          <FiCopy className="mr-2 h-4 w-4" />
          Copy ID
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleUnstack}>
          <FiLayers className="mr-2 h-4 w-4" />
          Unstack Items
        </ContextMenuItem>

        <ContextMenuItem variant="destructive" onClick={handleUnstack}>
          <FiTrash2 className="mr-2 h-4 w-4" />
          Delete Stack
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

StackContextMenu.displayName = 'StackContextMenu';

// Main Stack Item Component
export const StackItem = memo<StackItemProps>(
  ({ stackInfo }) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(stackInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === stackInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    // Track current preview index for spacebar cycling
    const [previewIndex, setPreviewIndex] = useState(0);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(stackInfo.metadata.id);
        } else {
          selectItem(stackInfo);
          setFocused(stackInfo.metadata.id);
        }
      },
      [selectItem, stackInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(stackInfo.metadata.id);
      },
      [navigateToViewer, stackInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          // Cycle through items in the stack
          if (stackInfo.items.length > 1) {
            const nextIndex = (previewIndex + 1) % stackInfo.items.length;
            setPreviewIndex(nextIndex);
            openViewer(stackInfo.items[nextIndex]);
          } else {
            openViewer(stackInfo);
          }
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(stackInfo.metadata.id);
        }
      },
      [openViewer, stackInfo, navigateToViewer, previewIndex],
    );

    const itemCount = stackInfo.items.length;
    const coverUrl = getCoverImageUrl(stackInfo);

    return (
      <StackContextMenu stackInfo={stackInfo}>
        <div className="relative">
          {/* Selection indicator */}
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-50 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}

          {/* Single card with cover image */}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={
              stackInfo.metadata.name || `Stack of ${itemCount} items`
            }
            className={cn(
              'relative cursor-pointer overflow-hidden rounded-xl border-2 shadow-md transition-all duration-300',
              'hover:shadow-foreground/20 focus-visible:ring-primary/50 hover:shadow-inner focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'border-primary ring-primary/30 ring-2'
                : isFocused
                  ? 'border-primary/50 ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:border-primary border-transparent',
            )}
            style={{
              aspectRatio: '1/1',
              minHeight: '150px',
            }}
          >
            {coverUrl ? (
              <div
                className="h-full w-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${coverUrl})` }}
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <FiLayers className="text-muted-foreground h-12 w-12" />
              </div>
            )}

            {/* Stack indicator badge */}
            <div className="bg-background/90 text-foreground absolute right-2 bottom-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm">
              <FiLayers className="h-3 w-3" />
              <span>{itemCount}</span>
            </div>
          </div>

          {/* Stack name */}
          {stackInfo.metadata.name && (
            <p className="text-foreground/70 mt-2 h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {stackInfo.metadata.name}
            </p>
          )}
        </div>
      </StackContextMenu>
    );
  },
  (prev, next) => prev.stackInfo.metadata.id === next.stackInfo.metadata.id,
);

StackItem.displayName = 'StackItem';
