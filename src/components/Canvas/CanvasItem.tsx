import React, {
  memo,
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import {
  CanvasItem as CanvasItemType,
  Ref,
  ImageRef,
  VideoRef,
  NoteRef,
  LinkRef,
} from '@/lib/types';
import {
  useCanvasStoreContext,
  useContextCanvasSelection,
  useContextCanvasViewport,
} from './CanvasStoreContext';
import { toAssetUrl } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { FiPlay, FiFileText, FiMusic, FiLink } from 'react-icons/fi';

// Zoom threshold for switching between low-res and high-res images
// Below this zoom level, use low-res for performance
const HIGH_RES_ZOOM_THRESHOLD = 0.5;

interface CanvasItemProps {
  item: CanvasItemType;
  ref_data: Ref | undefined;
}

// Selection handles for resize - only corner handles for aspect-ratio locked resize
const ResizeHandle: React.FC<{
  position: string;
  onMouseDown: (e: React.MouseEvent, position: string) => void;
}> = ({ position, onMouseDown }) => {
  const positionClasses: Record<string, string> = {
    'top-left': '-top-1 -left-1 cursor-nwse-resize',
    'top-right': '-top-1 -right-1 cursor-nesw-resize',
    'bottom-left': '-bottom-1 -left-1 cursor-nesw-resize',
    'bottom-right': '-bottom-1 -right-1 cursor-nwse-resize',
  };

  return (
    <div
      className={cn(
        'bg-primary border-background absolute z-20 h-2.5 w-2.5 rounded-full border-2 shadow-sm',
        positionClasses[position],
      )}
      onMouseDown={(e) => onMouseDown(e, position)}
    />
  );
};

export const CanvasItem = memo<CanvasItemProps>(
  ({ item, ref_data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const store = useCanvasStoreContext();
    const selection = useContextCanvasSelection();
    const viewport = useContextCanvasViewport();

    const updateItem = store((s) => s.updateItem);
    const select = store((s) => s.select);
    const addToSelection = store((s) => s.addToSelection);
    const pushHistory = store((s) => s.pushHistory);

    const isSelected = selection.itemIds.includes(item.id);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Calculate aspect ratio from item dimensions
    const aspectRatio = useMemo(() => {
      return item.size.width / item.size.height;
    }, [item.size.width, item.size.height]);

    // Track drag/resize state
    const dragState = useRef({
      startX: 0,
      startY: 0,
      startItemX: 0,
      startItemY: 0,
      startWidth: 0,
      startHeight: 0,
      startAspectRatio: 1,
      resizePosition: '',
    });

    // Handle click to select
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.locked) return;

        if (e.ctrlKey || e.metaKey) {
          // Add to selection
          addToSelection({ itemIds: [item.id] });
        } else if (!isSelected) {
          // Single select
          select({ itemIds: [item.id] });
        }
      },
      [item.id, item.locked, isSelected, select, addToSelection],
    );

    // Handle drag start
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (item.locked || e.button !== 0) return;
        e.stopPropagation();

        // Select if not already selected
        if (!isSelected) {
          if (e.ctrlKey || e.metaKey) {
            addToSelection({ itemIds: [item.id] });
          } else {
            select({ itemIds: [item.id] });
          }
        }

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startItemX: item.position.x,
          startItemY: item.position.y,
          startWidth: item.size.width,
          startHeight: item.size.height,
          startAspectRatio: item.size.width / item.size.height,
          resizePosition: '',
        };

        setIsDragging(true);
      },
      [item, isSelected, select, addToSelection, pushHistory],
    );

    // Handle resize start
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, position: string) => {
        if (item.locked) return;
        e.stopPropagation();
        e.preventDefault();

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startItemX: item.position.x,
          startItemY: item.position.y,
          startWidth: item.size.width,
          startHeight: item.size.height,
          startAspectRatio: item.size.width / item.size.height,
          resizePosition: position,
        };

        setIsResizing(true);
      },
      [item, pushHistory],
    );

    // Handle mouse move for drag/resize
    useEffect(() => {
      if (!isDragging && !isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - dragState.current.startX) / viewport.zoom;
        const dy = (e.clientY - dragState.current.startY) / viewport.zoom;

        if (isDragging) {
          updateItem(item.id, {
            position: {
              x: dragState.current.startItemX + dx,
              y: dragState.current.startItemY + dy,
            },
          });
        } else if (isResizing) {
          const pos = dragState.current.resizePosition;
          const ar = dragState.current.startAspectRatio;
          let newWidth = dragState.current.startWidth;
          let newHeight = dragState.current.startHeight;
          let newX = dragState.current.startItemX;
          let newY = dragState.current.startItemY;

          // Aspect-ratio locked resize from corners
          // Use the larger delta to determine the resize amount
          if (pos === 'bottom-right') {
            // Resize from bottom-right corner
            const deltaW = dx;
            const deltaH = dy;
            // Use the delta that results in larger change
            if (Math.abs(deltaW) > Math.abs(deltaH * ar)) {
              newWidth = Math.max(50, dragState.current.startWidth + deltaW);
              newHeight = newWidth / ar;
            } else {
              newHeight = Math.max(50, dragState.current.startHeight + deltaH);
              newWidth = newHeight * ar;
            }
          } else if (pos === 'bottom-left') {
            // Resize from bottom-left corner (width grows left, height grows down)
            const deltaW = -dx;
            const deltaH = dy;
            if (Math.abs(deltaW) > Math.abs(deltaH * ar)) {
              newWidth = Math.max(50, dragState.current.startWidth + deltaW);
              newHeight = newWidth / ar;
            } else {
              newHeight = Math.max(50, dragState.current.startHeight + deltaH);
              newWidth = newHeight * ar;
            }
            // Adjust position since we're resizing from left
            newX =
              dragState.current.startItemX +
              dragState.current.startWidth -
              newWidth;
          } else if (pos === 'top-right') {
            // Resize from top-right corner (width grows right, height grows up)
            const deltaW = dx;
            const deltaH = -dy;
            if (Math.abs(deltaW) > Math.abs(deltaH * ar)) {
              newWidth = Math.max(50, dragState.current.startWidth + deltaW);
              newHeight = newWidth / ar;
            } else {
              newHeight = Math.max(50, dragState.current.startHeight + deltaH);
              newWidth = newHeight * ar;
            }
            // Adjust position since we're resizing from top
            newY =
              dragState.current.startItemY +
              dragState.current.startHeight -
              newHeight;
          } else if (pos === 'top-left') {
            // Resize from top-left corner (both dimensions grow up/left)
            const deltaW = -dx;
            const deltaH = -dy;
            if (Math.abs(deltaW) > Math.abs(deltaH * ar)) {
              newWidth = Math.max(50, dragState.current.startWidth + deltaW);
              newHeight = newWidth / ar;
            } else {
              newHeight = Math.max(50, dragState.current.startHeight + deltaH);
              newWidth = newHeight * ar;
            }
            // Adjust position since we're resizing from top-left
            newX =
              dragState.current.startItemX +
              dragState.current.startWidth -
              newWidth;
            newY =
              dragState.current.startItemY +
              dragState.current.startHeight -
              newHeight;
          }

          // Ensure minimum size
          if (newWidth < 50) {
            newWidth = 50;
            newHeight = newWidth / ar;
          }
          if (newHeight < 50) {
            newHeight = 50;
            newWidth = newHeight * ar;
          }

          updateItem(item.id, {
            position: { x: newX, y: newY },
            size: { width: newWidth, height: newHeight },
          });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, isResizing, item.id, viewport.zoom, updateItem]);

    // Determine if we should use high-res images based on zoom level
    const useHighRes = viewport.zoom >= HIGH_RES_ZOOM_THRESHOLD;

    // Render content based on ref type
    const renderContent = () => {
      if (!ref_data) {
        return (
          <div className="bg-muted flex h-full w-full items-center justify-center rounded-lg">
            <span className="text-muted-foreground text-sm">Missing ref</span>
          </div>
        );
      }

      const type = ref_data.metadata.ref_type;

      if (type === 'image') {
        const imageRef = ref_data as ImageRef;
        const isGif =
          imageRef.metadata.file_name?.toLowerCase().endsWith('.gif') ||
          imageRef.metadata.media_type?.includes('gif');

        // For GIFs, always use full image to preserve animation
        // For other images: use high-res when zoomed in, low-res when zoomed out
        let imagePath: string;
        if (isGif) {
          imagePath = imageRef.image_path;
        } else if (useHighRes) {
          // Use full resolution when zoomed in
          imagePath = imageRef.image_path;
        } else {
          // Use low-res thumbnail when zoomed out for better performance
          imagePath = imageRef.low_res_imagepath || imageRef.image_path;
        }

        return (
          <img
            src={toAssetUrl(imagePath)}
            alt={imageRef.metadata.name || 'Image'}
            className="pointer-events-none h-full w-full rounded-lg object-cover"
            draggable={false}
          />
        );
      }

      if (type === 'video') {
        const videoRef = ref_data as VideoRef;
        return (
          <div className="bg-muted relative h-full w-full overflow-hidden rounded-lg">
            <video
              src={toAssetUrl(videoRef.video_path)}
              className="pointer-events-none h-full w-full object-cover"
              muted
              playsInline
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="bg-background/60 flex h-10 w-10 items-center justify-center rounded-full">
                <FiPlay className="text-foreground ml-0.5 h-5 w-5" />
              </div>
            </div>
          </div>
        );
      }

      if (type === 'note') {
        const noteRef = ref_data as NoteRef;
        return (
          <div className="bg-muted/50 h-full w-full overflow-hidden rounded-lg p-3">
            <FiFileText className="text-muted-foreground mb-2 h-4 w-4" />
            <p className="text-foreground/80 line-clamp-6 text-sm">
              {noteRef.content}
            </p>
          </div>
        );
      }

      if (type === 'audio') {
        return (
          <div className="bg-muted flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg">
            <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
              <FiMusic className="text-primary h-6 w-6" />
            </div>
            <span className="text-muted-foreground text-xs">
              {ref_data.metadata.name || 'Audio'}
            </span>
          </div>
        );
      }

      if (type === 'link') {
        const linkRef = ref_data as LinkRef;
        // For links with snapshots, also apply zoom-based quality
        const snapshotPath = linkRef.snapshoot;
        if (snapshotPath) {
          return (
            <img
              src={toAssetUrl(snapshotPath)}
              alt={linkRef.metadata.name || 'Link preview'}
              className="pointer-events-none h-full w-full rounded-lg object-cover"
              draggable={false}
            />
          );
        }
        return (
          <div className="bg-muted flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg">
            <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
              <FiLink className="text-primary h-6 w-6" />
            </div>
            <span className="text-muted-foreground max-w-full truncate px-2 text-center text-xs">
              {ref_data.metadata.name || 'Link'}
            </span>
          </div>
        );
      }

      // Stack or unknown type
      return (
        <div className="bg-muted flex h-full w-full items-center justify-center rounded-lg">
          <span className="text-muted-foreground text-sm">
            {ref_data.metadata.name || type}
          </span>
        </div>
      );
    };

    return (
      <div
        ref={containerRef}
        data-canvas-item={item.id}
        className={cn(
          'absolute select-none',
          item.locked && 'pointer-events-none opacity-70',
          isDragging && 'cursor-grabbing',
          !isDragging && !item.locked && 'cursor-grab',
        )}
        style={{
          left: item.position.x,
          top: item.position.y,
          width: item.size.width,
          height: item.size.height,
          zIndex: item.zIndex,
          transform: `rotate(${item.rotation}deg)`,
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Content */}
        <div
          className={cn(
            'h-full w-full overflow-hidden rounded-lg shadow-md transition-shadow',
            isSelected &&
              'ring-primary ring-offset-background ring-2 ring-offset-2',
          )}
        >
          {renderContent()}
        </div>

        {/* Selection handles - only corner handles for aspect-ratio locked resize */}
        {isSelected && !item.locked && (
          <>
            <ResizeHandle position="top-left" onMouseDown={handleResizeStart} />
            <ResizeHandle
              position="top-right"
              onMouseDown={handleResizeStart}
            />
            <ResizeHandle
              position="bottom-left"
              onMouseDown={handleResizeStart}
            />
            <ResizeHandle
              position="bottom-right"
              onMouseDown={handleResizeStart}
            />
          </>
        )}
      </div>
    );
  },
  (prev, next) => {
    // Custom comparison for memo
    return (
      prev.item.id === next.item.id &&
      prev.item.position.x === next.item.position.x &&
      prev.item.position.y === next.item.position.y &&
      prev.item.size.width === next.item.size.width &&
      prev.item.size.height === next.item.size.height &&
      prev.item.rotation === next.item.rotation &&
      prev.item.zIndex === next.item.zIndex &&
      prev.item.locked === next.item.locked &&
      prev.ref_data?.metadata.id === next.ref_data?.metadata.id
    );
  },
);

CanvasItem.displayName = 'CanvasItem';

export default CanvasItem;
