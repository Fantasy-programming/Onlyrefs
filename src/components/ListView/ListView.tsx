import React, { memo, useCallback } from 'react';
import { Ref, ImageRef, VideoRef, LinkRef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toAssetUrl, elapsedTime } from '@/lib/helper';
import { useDetailsPanel } from '@/components/Layout/DetailsPanelContext';
import { useSelectionStore } from '@/state/selectionStore';
import { useViewerNavigation } from '@/hooks/use-viewer-navigation';
import {
  FiCheck,
  FiImage,
  FiVideo,
  FiFileText,
  FiLink,
  FiMusic,
  FiLayers,
} from 'react-icons/fi';

interface ListViewProps {
  items: Ref[];
  rowHeight?: number;
  renderItem?: (item: Ref, index: number) => React.ReactNode;
}

// Get thumbnail URL for item
const getThumbnailUrl = (item: Ref): string | null => {
  switch (item.metadata.ref_type) {
    case 'image':
      return toAssetUrl(
        (item as ImageRef).low_res_imagepath || (item as ImageRef).image_path,
      );
    case 'video':
      return null; // Videos don't have thumbnails in grid
    case 'link':
      const linkRef = item as LinkRef;
      return linkRef.snapshoot ? toAssetUrl(linkRef.snapshoot) : null;
    default:
      return null;
  }
};

// Get icon for item type
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <FiImage className="h-4 w-4" />;
    case 'video':
      return <FiVideo className="h-4 w-4" />;
    case 'note':
      return <FiFileText className="h-4 w-4" />;
    case 'link':
      return <FiLink className="h-4 w-4" />;
    case 'audio':
      return <FiMusic className="h-4 w-4" />;
    case 'stack':
      return <FiLayers className="h-4 w-4" />;
    default:
      return <FiFileText className="h-4 w-4" />;
  }
};

// Get dimensions string
const getDimensions = (item: Ref): string | null => {
  if (item.metadata.ref_type === 'image') {
    const dims = (item as ImageRef).metadata.dimensions;
    if (dims) return `${dims[0]} x ${dims[1]}`;
  }
  if (item.metadata.ref_type === 'video') {
    const dims = (item as VideoRef).metadata.dimensions;
    if (dims) return `${dims[0]} x ${dims[1]}`;
  }
  return null;
};

interface ListItemProps {
  item: Ref;
  rowHeight: number;
}

const ListItem = memo<ListItemProps>(({ item, rowHeight }) => {
  const navigateToViewer = useViewerNavigation();
  const { selectItem } = useDetailsPanel();
  const isSelected = useSelectionStore((state) =>
    state.selectedIds.includes(item.metadata.id),
  );
  const isFocused = useSelectionStore(
    (state) => state.focusedId === item.metadata.id,
  );
  const toggleSelect = useSelectionStore((state) => state.toggleSelect);
  const setFocused = useSelectionStore((state) => state.setFocused);

  const thumbnailUrl = getThumbnailUrl(item);
  const dimensions = getDimensions(item);
  const thumbnailSize = Math.max(40, rowHeight - 16);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleSelect(item.metadata.id);
      } else {
        selectItem(item);
        setFocused(item.metadata.id);
      }
    },
    [selectItem, item, toggleSelect, setFocused],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigateToViewer(item.metadata.id);
    },
    [navigateToViewer, item.metadata.id],
  );

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'group hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors',
        isSelected
          ? 'bg-blue-500/10 ring-2 ring-blue-500'
          : isFocused
            ? 'bg-primary/5 ring-primary ring-2'
            : '',
      )}
      style={{ height: `${rowHeight}px` }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
          <FiCheck className="h-3 w-3" />
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="bg-muted/30 flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={{ width: thumbnailSize, height: thumbnailSize }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            {getTypeIcon(item.metadata.ref_type)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.metadata.name || 'Untitled'}
        </p>
        {item.metadata.tags && item.metadata.tags.length > 0 && (
          <div className="mt-0.5 flex gap-1">
            {item.metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]"
              >
                {tag}
              </span>
            ))}
            {item.metadata.tags.length > 3 && (
              <span className="text-muted-foreground text-[10px]">
                +{item.metadata.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Type icon */}
      <div className="text-muted-foreground flex-shrink-0">
        {getTypeIcon(item.metadata.ref_type)}
      </div>

      {/* Dimensions */}
      {dimensions && (
        <div className="text-muted-foreground hidden flex-shrink-0 text-xs sm:block">
          {dimensions}
        </div>
      )}

      {/* Date */}
      <div className="text-muted-foreground hidden flex-shrink-0 text-xs md:block">
        {elapsedTime(item.metadata.created_at)}
      </div>
    </div>
  );
});

ListItem.displayName = 'ListItem';

export const ListView = memo<ListViewProps>(({ items, rowHeight = 60 }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <ListItem key={item.metadata.id} item={item} rowHeight={rowHeight} />
      ))}
    </div>
  );
});

ListView.displayName = 'ListView';

export default ListView;
