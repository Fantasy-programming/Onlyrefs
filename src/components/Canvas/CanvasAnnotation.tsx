import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import { CanvasAnnotation as CanvasAnnotationType } from '@/lib/types';
import {
  useCanvasStoreContext,
  useContextCanvasSelection,
  useContextCanvasViewport,
} from './CanvasStoreContext';
import { cn } from '@/lib/utils';

interface CanvasAnnotationProps {
  annotation: CanvasAnnotationType;
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
        'bg-primary border-background absolute z-20 h-2.5 w-2.5 rounded-full border-2 shadow-sm',
        positionClasses[position],
      )}
      onMouseDown={(e) => onMouseDown(e, position)}
    />
  );
};

export const CanvasAnnotation = memo<CanvasAnnotationProps>(
  ({ annotation }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const store = useCanvasStoreContext();
    const selection = useContextCanvasSelection();
    const viewport = useContextCanvasViewport();

    const updateAnnotation = store((s) => s.updateAnnotation);
    const select = store((s) => s.select);
    const addToSelection = store((s) => s.addToSelection);
    const pushHistory = store((s) => s.pushHistory);

    const isSelected = selection.annotationIds.includes(annotation.id);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(annotation.content);

    // Track drag/resize state
    const dragState = useRef({
      startX: 0,
      startY: 0,
      startItemX: 0,
      startItemY: 0,
      startWidth: 0,
      startHeight: 0,
      resizePosition: '',
    });

    // Focus textarea when newly created (empty content)
    useEffect(() => {
      if (annotation.content === '' && textareaRef.current) {
        setIsEditing(true);
        textareaRef.current.focus();
      }
    }, []);

    // Handle click to select
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (annotation.locked) return;

        if (e.ctrlKey || e.metaKey) {
          addToSelection({ annotationIds: [annotation.id] });
        } else if (!isSelected) {
          select({ annotationIds: [annotation.id] });
        }
      },
      [annotation.id, annotation.locked, isSelected, select, addToSelection],
    );

    // Handle double-click to edit
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (annotation.locked) return;
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
      [annotation.locked],
    );

    // Handle drag start
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (annotation.locked || e.button !== 0 || isEditing) return;
        e.stopPropagation();

        // Select if not already selected
        if (!isSelected) {
          if (e.ctrlKey || e.metaKey) {
            addToSelection({ annotationIds: [annotation.id] });
          } else {
            select({ annotationIds: [annotation.id] });
          }
        }

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startItemX: annotation.position.x,
          startItemY: annotation.position.y,
          startWidth: annotation.size.width,
          startHeight: annotation.size.height,
          resizePosition: '',
        };

        setIsDragging(true);
      },
      [annotation, isSelected, isEditing, select, addToSelection, pushHistory],
    );

    // Handle resize start
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, position: string) => {
        if (annotation.locked) return;
        e.stopPropagation();
        e.preventDefault();

        pushHistory();

        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startItemX: annotation.position.x,
          startItemY: annotation.position.y,
          startWidth: annotation.size.width,
          startHeight: annotation.size.height,
          resizePosition: position,
        };

        setIsResizing(true);
      },
      [annotation, pushHistory],
    );

    // Handle mouse move for drag/resize
    useEffect(() => {
      if (!isDragging && !isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - dragState.current.startX) / viewport.zoom;
        const dy = (e.clientY - dragState.current.startY) / viewport.zoom;

        if (isDragging) {
          updateAnnotation(annotation.id, {
            position: {
              x: dragState.current.startItemX + dx,
              y: dragState.current.startItemY + dy,
            },
          });
        } else if (isResizing) {
          const pos = dragState.current.resizePosition;
          let newWidth = dragState.current.startWidth;
          let newHeight = dragState.current.startHeight;
          let newX = dragState.current.startItemX;
          let newY = dragState.current.startItemY;

          // Minimum size
          const minSize = 50;

          if (pos.includes('right')) {
            newWidth = Math.max(minSize, dragState.current.startWidth + dx);
          }
          if (pos.includes('left')) {
            const proposedWidth = dragState.current.startWidth - dx;
            if (proposedWidth >= minSize) {
              newWidth = proposedWidth;
              newX = dragState.current.startItemX + dx;
            }
          }
          if (pos.includes('bottom')) {
            newHeight = Math.max(minSize, dragState.current.startHeight + dy);
          }
          if (pos.includes('top')) {
            const proposedHeight = dragState.current.startHeight - dy;
            if (proposedHeight >= minSize) {
              newHeight = proposedHeight;
              newY = dragState.current.startItemY + dy;
            }
          }

          updateAnnotation(annotation.id, {
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
    }, [
      isDragging,
      isResizing,
      annotation.id,
      viewport.zoom,
      updateAnnotation,
    ]);

    // Handle content change
    const handleContentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
      },
      [],
    );

    // Handle blur to save content
    const handleBlur = useCallback(() => {
      setIsEditing(false);
      if (content !== annotation.content) {
        updateAnnotation(annotation.id, { content });
      }
    }, [content, annotation.content, annotation.id, updateAnnotation]);

    // Handle key events in textarea
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsEditing(false);
          setContent(annotation.content);
        }
      },
      [annotation.content],
    );

    // Get font size from style
    const getFontSize = () => {
      const sizes: Record<string, string> = {
        sm: '0.875rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
      };
      return sizes[annotation.style?.fontSize || 'md'] || '1rem';
    };

    return (
      <div
        ref={containerRef}
        data-canvas-annotation={annotation.id}
        className={cn(
          'absolute select-none',
          annotation.locked && 'pointer-events-none opacity-70',
          isDragging && 'cursor-grabbing',
          !isDragging && !annotation.locked && !isEditing && 'cursor-grab',
        )}
        style={{
          left: annotation.position.x,
          top: annotation.position.y,
          width: annotation.size.width,
          height: annotation.size.height,
          zIndex: annotation.zIndex,
          transform: `rotate(${annotation.rotation}deg)`,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Content */}
        <div
          className={cn(
            'h-full w-full overflow-hidden rounded-lg border-2 border-transparent p-2 transition-colors',
            isSelected && 'border-primary',
            isEditing && 'border-primary bg-background',
            !isEditing && 'bg-background/80 hover:bg-background',
          )}
          style={{
            backgroundColor: annotation.style?.backgroundColor,
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="h-full w-full resize-none bg-transparent outline-none"
              style={{
                fontSize: getFontSize(),
              }}
              placeholder="Type something..."
            />
          ) : (
            <div
              className={cn(
                'h-full w-full overflow-hidden whitespace-pre-wrap',
                !content && 'text-muted-foreground',
              )}
              style={{
                fontSize: getFontSize(),
              }}
            >
              {content || 'Double-click to edit...'}
            </div>
          )}
        </div>

        {/* Selection handles */}
        {isSelected && !annotation.locked && !isEditing && (
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
      prev.annotation.id === next.annotation.id &&
      prev.annotation.position.x === next.annotation.position.x &&
      prev.annotation.position.y === next.annotation.position.y &&
      prev.annotation.size.width === next.annotation.size.width &&
      prev.annotation.size.height === next.annotation.size.height &&
      prev.annotation.rotation === next.annotation.rotation &&
      prev.annotation.zIndex === next.annotation.zIndex &&
      prev.annotation.locked === next.annotation.locked &&
      prev.annotation.content === next.annotation.content
    );
  },
);

CanvasAnnotation.displayName = 'CanvasAnnotation';

export default CanvasAnnotation;
