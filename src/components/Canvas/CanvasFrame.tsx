import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import { CanvasFrame as CanvasFrameType } from '@/lib/types';
import {
  useCanvasStoreContext,
  useContextCanvasSelection,
  useContextCanvasViewport,
} from './CanvasStoreContext';
import { cn } from '@/lib/utils';

interface CanvasFrameProps {
  frame: CanvasFrameType;
}

// Resize handle component
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
        'bg-primary border-background absolute z-20 h-3 w-3 rounded-sm border-2 shadow-sm',
        positionClasses[position],
      )}
      onMouseDown={(e) => onMouseDown(e, position)}
    />
  );
};

export const CanvasFrame = memo<CanvasFrameProps>(
  ({ frame }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const store = useCanvasStoreContext();
    const selection = useContextCanvasSelection();
    const viewport = useContextCanvasViewport();

    const updateFrame = store((s) => s.updateFrame);
    const select = store((s) => s.select);
    const addToSelection = store((s) => s.addToSelection);
    const pushHistory = store((s) => s.pushHistory);

    const isSelected = selection.frameIds.includes(frame.id);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(frame.title);

    // Track drag/resize state
    const dragState = useRef({
      startX: 0,
      startY: 0,
      startFrameX: 0,
      startFrameY: 0,
      startWidth: 0,
      startHeight: 0,
      resizePosition: '',
    });

    // Handle click to select
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (frame.locked) return;

        if (e.ctrlKey || e.metaKey) {
          addToSelection({ frameIds: [frame.id] });
        } else if (!isSelected) {
          select({ frameIds: [frame.id] });
        }
      },
      [frame.id, frame.locked, isSelected, select, addToSelection],
    );

    // Handle drag start (only on the title bar area)
    const handleTitleBarMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (frame.locked || e.button !== 0 || isEditingTitle) return;
        e.stopPropagation();

        if (!isSelected) {
          if (e.ctrlKey || e.metaKey) {
            addToSelection({ frameIds: [frame.id] });
          } else {
            select({ frameIds: [frame.id] });
          }
        }

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startFrameX: frame.position.x,
          startFrameY: frame.position.y,
          startWidth: frame.size.width,
          startHeight: frame.size.height,
          resizePosition: '',
        };

        setIsDragging(true);
      },
      [frame, isSelected, isEditingTitle, select, addToSelection, pushHistory],
    );

    // Handle resize start
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, position: string) => {
        if (frame.locked) return;
        e.stopPropagation();
        e.preventDefault();

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startFrameX: frame.position.x,
          startFrameY: frame.position.y,
          startWidth: frame.size.width,
          startHeight: frame.size.height,
          resizePosition: position,
        };

        setIsResizing(true);
      },
      [frame, pushHistory],
    );

    // Handle mouse move for drag/resize
    useEffect(() => {
      if (!isDragging && !isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - dragState.current.startX) / viewport.zoom;
        const dy = (e.clientY - dragState.current.startY) / viewport.zoom;

        if (isDragging) {
          updateFrame(frame.id, {
            position: {
              x: dragState.current.startFrameX + dx,
              y: dragState.current.startFrameY + dy,
            },
          });
        } else if (isResizing) {
          const pos = dragState.current.resizePosition;
          let newWidth = dragState.current.startWidth;
          let newHeight = dragState.current.startHeight;
          let newX = dragState.current.startFrameX;
          let newY = dragState.current.startFrameY;

          // Minimum frame size
          const minSize = 100;

          if (pos.includes('right')) {
            newWidth = Math.max(minSize, dragState.current.startWidth + dx);
          }
          if (pos.includes('left')) {
            const proposedWidth = dragState.current.startWidth - dx;
            if (proposedWidth >= minSize) {
              newWidth = proposedWidth;
              newX = dragState.current.startFrameX + dx;
            }
          }
          if (pos.includes('bottom')) {
            newHeight = Math.max(minSize, dragState.current.startHeight + dy);
          }
          if (pos.includes('top')) {
            const proposedHeight = dragState.current.startHeight - dy;
            if (proposedHeight >= minSize) {
              newHeight = proposedHeight;
              newY = dragState.current.startFrameY + dy;
            }
          }

          updateFrame(frame.id, {
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
    }, [isDragging, isResizing, frame.id, viewport.zoom, updateFrame]);

    // Handle title double-click to edit
    const handleTitleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditingTitle(true);
        setTitleValue(frame.title);
      },
      [frame.title],
    );

    // Handle title save
    const handleTitleSave = useCallback(() => {
      setIsEditingTitle(false);
      if (titleValue.trim() !== frame.title) {
        updateFrame(frame.id, { title: titleValue.trim() || 'Frame' });
      }
    }, [titleValue, frame.id, frame.title, updateFrame]);

    // Handle title input key events
    const handleTitleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleTitleSave();
        } else if (e.key === 'Escape') {
          setIsEditingTitle(false);
          setTitleValue(frame.title);
        }
      },
      [handleTitleSave, frame.title],
    );

    // Focus input when editing starts
    useEffect(() => {
      if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, [isEditingTitle]);

    return (
      <div
        ref={containerRef}
        data-canvas-frame={frame.id}
        className={cn(
          'absolute select-none',
          frame.locked && 'pointer-events-none opacity-70',
        )}
        style={{
          left: frame.position.x,
          top: frame.position.y,
          width: frame.size.width,
          height: frame.size.height,
          zIndex: frame.zIndex,
        }}
        onClick={handleClick}
      >
        {/* Frame background */}
        <div
          className={cn(
            'h-full w-full rounded-xl border-2 border-dashed transition-colors',
            isSelected
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 bg-muted/20',
          )}
          style={{
            backgroundColor: frame.color ? `${frame.color}20` : undefined,
            borderColor: isSelected ? undefined : frame.color || undefined,
          }}
        >
          {/* Title bar */}
          <div
            className={cn(
              'absolute -top-7 left-0 flex items-center gap-2 rounded-t-md px-2 py-1',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            onMouseDown={handleTitleBarMouseDown}
            onDoubleClick={handleTitleDoubleClick}
          >
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="bg-background focus:ring-primary w-32 rounded border px-1 py-0.5 text-sm font-medium outline-none focus:ring-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {frame.title}
              </span>
            )}
          </div>
        </div>

        {/* Selection handles */}
        {isSelected && !frame.locked && (
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
    return (
      prev.frame.id === next.frame.id &&
      prev.frame.position.x === next.frame.position.x &&
      prev.frame.position.y === next.frame.position.y &&
      prev.frame.size.width === next.frame.size.width &&
      prev.frame.size.height === next.frame.size.height &&
      prev.frame.title === next.frame.title &&
      prev.frame.color === next.frame.color &&
      prev.frame.zIndex === next.frame.zIndex &&
      prev.frame.locked === next.frame.locked
    );
  },
);

CanvasFrame.displayName = 'CanvasFrame';

export default CanvasFrame;
