import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import {
  useCanvasStoreContext,
  useContextCanvasViewport,
  useContextCanvasTool,
} from './CanvasStoreContext';
import { cn } from '@/lib/utils';

interface SelectionRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface CanvasSelectionBoxProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const CanvasSelectionBox = memo<CanvasSelectionBoxProps>(
  ({ containerRef }) => {
    const store = useCanvasStoreContext();
    const viewport = useContextCanvasViewport();
    const tool = useContextCanvasTool();
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
      null,
    );
    const isDrawing = useRef(false);

    const items = store((s) => s.items);
    const frames = store((s) => s.frames);
    const annotations = store((s) => s.annotations);
    const select = store((s) => s.select);
    const addToSelection = store((s) => s.addToSelection);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback(
      (screenX: number, screenY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
          x: (screenX - rect.left - viewport.x) / viewport.zoom,
          y: (screenY - rect.top - viewport.y) / viewport.zoom,
        };
      },
      [viewport, containerRef],
    );

    // Handle mouse down to start selection
    const handleMouseDown = useCallback(
      (e: MouseEvent) => {
        // Only start selection with left mouse button in select tool mode
        if (e.button !== 0 || tool !== 'select') return;

        // Don't start selection if clicking on an item
        const target = e.target as HTMLElement;
        if (
          target.closest('[data-canvas-item]') ||
          target.closest('[data-canvas-frame]')
        ) {
          return;
        }

        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        isDrawing.current = true;

        setSelectionRect({
          startX: canvasPos.x,
          startY: canvasPos.y,
          currentX: canvasPos.x,
          currentY: canvasPos.y,
        });
      },
      [tool, screenToCanvas],
    );

    // Handle mouse move to update selection
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDrawing.current || !selectionRect) return;

        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setSelectionRect((prev) =>
          prev
            ? {
                ...prev,
                currentX: canvasPos.x,
                currentY: canvasPos.y,
              }
            : null,
        );
      },
      [selectionRect, screenToCanvas],
    );

    // Check if a rectangle intersects with the selection box
    const intersects = useCallback(
      (
        itemX: number,
        itemY: number,
        itemWidth: number,
        itemHeight: number,
        rect: SelectionRect,
      ) => {
        const selMinX = Math.min(rect.startX, rect.currentX);
        const selMaxX = Math.max(rect.startX, rect.currentX);
        const selMinY = Math.min(rect.startY, rect.currentY);
        const selMaxY = Math.max(rect.startY, rect.currentY);

        const itemMaxX = itemX + itemWidth;
        const itemMaxY = itemY + itemHeight;

        return !(
          itemX > selMaxX ||
          itemMaxX < selMinX ||
          itemY > selMaxY ||
          itemMaxY < selMinY
        );
      },
      [],
    );

    // Handle mouse up to finalize selection
    const handleMouseUp = useCallback(
      (e: MouseEvent) => {
        if (!isDrawing.current || !selectionRect) {
          isDrawing.current = false;
          setSelectionRect(null);
          return;
        }

        isDrawing.current = false;

        // Find all items/frames/annotations that intersect with the selection box
        const selectedItemIds = items
          .filter(
            (item) =>
              !item.locked &&
              intersects(
                item.position.x,
                item.position.y,
                item.size.width,
                item.size.height,
                selectionRect,
              ),
          )
          .map((item) => item.id);

        const selectedFrameIds = frames
          .filter(
            (frame) =>
              !frame.locked &&
              intersects(
                frame.position.x,
                frame.position.y,
                frame.size.width,
                frame.size.height,
                selectionRect,
              ),
          )
          .map((frame) => frame.id);

        const selectedAnnotationIds = annotations
          .filter(
            (ann) =>
              !ann.locked &&
              intersects(
                ann.position.x,
                ann.position.y,
                ann.size.width,
                ann.size.height,
                selectionRect,
              ),
          )
          .map((ann) => ann.id);

        // If Shift is held, add to selection; otherwise, replace selection
        if (e.shiftKey) {
          addToSelection({
            itemIds: selectedItemIds,
            frameIds: selectedFrameIds,
            annotationIds: selectedAnnotationIds,
          });
        } else {
          select({
            itemIds: selectedItemIds,
            frameIds: selectedFrameIds,
            annotationIds: selectedAnnotationIds,
          });
        }

        setSelectionRect(null);
      },
      [
        selectionRect,
        items,
        frames,
        annotations,
        intersects,
        select,
        addToSelection,
      ],
    );

    // Attach event listeners
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

    if (!selectionRect) return null;

    // Calculate the selection box dimensions
    const left = Math.min(selectionRect.startX, selectionRect.currentX);
    const top = Math.min(selectionRect.startY, selectionRect.currentY);
    const width = Math.abs(selectionRect.currentX - selectionRect.startX);
    const height = Math.abs(selectionRect.currentY - selectionRect.startY);

    // Only show if there's meaningful size
    if (width < 5 && height < 5) return null;

    return (
      <div
        className={cn(
          'border-primary/60 bg-primary/10 pointer-events-none absolute border',
        )}
        style={{
          left,
          top,
          width,
          height,
        }}
      />
    );
  },
);

CanvasSelectionBox.displayName = 'CanvasSelectionBox';

export default CanvasSelectionBox;
