import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  useCanvasStoreContext,
  useContextCanvasViewport,
  useContextCanvasIsPanning,
} from './CanvasStoreContext';
import { CANVAS_CONSTRAINTS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CanvasViewportProps {
  children: React.ReactNode;
  className?: string;
}

// Preview rectangle for frame/text creation
interface CreationPreview {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useCanvasStoreContext();
  const viewport = useContextCanvasViewport();
  const isPanning = useContextCanvasIsPanning();

  const setViewport = store((s) => s.setViewport);
  const setIsPanning = store((s) => s.setIsPanning);
  const tool = store((s) => s.tool);
  const setTool = store((s) => s.setTool);
  const clearSelection = store((s) => s.clearSelection);
  const addFrame = store((s) => s.addFrame);
  const addAnnotation = store((s) => s.addAnnotation);

  // Track drag state for panning
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startViewportX: 0,
    startViewportY: 0,
  });

  // Track space key for pan mode
  const spacePressed = useRef(false);

  // Track creation preview for frame/text tools
  const [creationPreview, setCreationPreview] =
    useState<CreationPreview | null>(null);
  const isCreating = useRef(false);

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
    [viewport],
  );

  // Handle wheel events - supports trackpad gestures (pan + pinch zoom) and mouse wheel
  // Trackpad-first behavior (like Figma):
  // - Two-finger scroll = pan
  // - Pinch gesture = zoom (detected via ctrlKey)
  // - Ctrl + scroll wheel = zoom (for mouse users)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Pinch-to-zoom on trackpad or Ctrl+scroll on mouse
      // Trackpads send ctrlKey=true for pinch gestures
      if (e.ctrlKey || e.metaKey) {
        // Calculate cursor position in canvas space
        const canvasX = (mouseX - viewport.x) / viewport.zoom;
        const canvasY = (mouseY - viewport.y) / viewport.zoom;

        // For pinch gestures, deltaY indicates zoom direction
        // Smaller zoom factor for smoother pinch-to-zoom feel
        const zoomIntensity = 0.01;
        const zoomDelta = -e.deltaY * zoomIntensity;
        const newZoom = Math.max(
          CANVAS_CONSTRAINTS.zoom.min,
          Math.min(
            viewport.zoom * (1 + zoomDelta),
            CANVAS_CONSTRAINTS.zoom.max,
          ),
        );

        // Adjust viewport to keep cursor at same canvas position
        const newX = mouseX - canvasX * newZoom;
        const newY = mouseY - canvasY * newZoom;

        setViewport({ x: newX, y: newY, zoom: newZoom });
      } else {
        // Two-finger scroll on trackpad or regular scroll wheel = pan
        // deltaX = horizontal scroll, deltaY = vertical scroll
        setViewport({
          x: viewport.x - e.deltaX,
          y: viewport.y - e.deltaY,
        });
      }
    },
    [viewport, setViewport],
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or space+left click for pan
      const shouldPan =
        e.button === 1 || // Middle mouse
        (e.button === 0 && spacePressed.current) || // Space + left click
        (e.button === 0 && tool === 'pan'); // Pan tool active

      if (shouldPan) {
        e.preventDefault();
        dragState.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          startViewportX: viewport.x,
          startViewportY: viewport.y,
        };
        setIsPanning(true);
        return;
      }

      // Frame or text tool - start creation drag
      if (e.button === 0 && (tool === 'frame' || tool === 'text')) {
        const target = e.target as HTMLElement;
        // Only start creation if clicking on the viewport background or content area
        if (
          target === containerRef.current ||
          target.closest('[data-canvas-content]')
        ) {
          e.preventDefault();
          const canvasPos = screenToCanvas(e.clientX, e.clientY);
          isCreating.current = true;
          setCreationPreview({
            startX: canvasPos.x,
            startY: canvasPos.y,
            currentX: canvasPos.x,
            currentY: canvasPos.y,
          });
        }
        return;
      }

      // Left click on empty canvas area - clear selection
      if (e.button === 0 && e.target === containerRef.current) {
        clearSelection();
      }
    },
    [viewport, tool, setIsPanning, clearSelection, screenToCanvas],
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Handle panning
      if (dragState.current.isDragging) {
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;

        setViewport({
          x: dragState.current.startViewportX + dx,
          y: dragState.current.startViewportY + dy,
        });
        return;
      }

      // Handle creation preview
      if (isCreating.current && creationPreview) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setCreationPreview((prev) =>
          prev
            ? {
                ...prev,
                currentX: canvasPos.x,
                currentY: canvasPos.y,
              }
            : null,
        );
      }
    },
    [setViewport, creationPreview, screenToCanvas],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // End panning
    if (dragState.current.isDragging) {
      dragState.current.isDragging = false;
      setIsPanning(false);
      return;
    }

    // End creation
    if (isCreating.current && creationPreview) {
      isCreating.current = false;

      const minX = Math.min(creationPreview.startX, creationPreview.currentX);
      const minY = Math.min(creationPreview.startY, creationPreview.currentY);
      const width = Math.abs(creationPreview.currentX - creationPreview.startX);
      const height = Math.abs(
        creationPreview.currentY - creationPreview.startY,
      );

      // Determine if this was a click or a drag
      const wasClick = width < 10 && height < 10;

      if (tool === 'frame') {
        // Create frame with minimum size or dragged size
        const frameWidth = wasClick ? 300 : Math.max(100, width);
        const frameHeight = wasClick ? 200 : Math.max(100, height);
        const frameX = wasClick
          ? creationPreview.startX - frameWidth / 2
          : minX;
        const frameY = wasClick
          ? creationPreview.startY - frameHeight / 2
          : minY;

        addFrame(
          { x: frameX, y: frameY },
          { width: frameWidth, height: frameHeight },
          'Frame',
        );
      } else if (tool === 'text') {
        // Create text annotation at click position
        const annotationX = wasClick ? creationPreview.startX - 100 : minX;
        const annotationY = wasClick ? creationPreview.startY - 50 : minY;

        addAnnotation({ x: annotationX, y: annotationY });
      }

      // Switch back to select tool after creation
      setTool('select');
      setCreationPreview(null);
    }
  }, [setIsPanning, creationPreview, tool, addFrame, addAnnotation, setTool]);

  // Handle keyboard events for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spacePressed.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false;
        // End any ongoing pan when space is released
        if (dragState.current.isDragging) {
          dragState.current.isDragging = false;
          setIsPanning(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsPanning]);

  // Handle mouse leave and global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        setIsPanning(false);
      }
      if (isCreating.current) {
        isCreating.current = false;
        setCreationPreview(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [setIsPanning]);

  // Get cursor style based on tool and state
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (spacePressed.current || tool === 'pan') return 'grab';
    if (tool === 'text') return 'text';
    if (tool === 'frame') return 'crosshair';
    return 'default';
  };

  // Calculate preview rectangle dimensions
  const previewRect = creationPreview
    ? {
        left: Math.min(creationPreview.startX, creationPreview.currentX),
        top: Math.min(creationPreview.startY, creationPreview.currentY),
        width: Math.abs(creationPreview.currentX - creationPreview.startX),
        height: Math.abs(creationPreview.currentY - creationPreview.startY),
      }
    : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-muted/30 relative h-full w-full overflow-hidden',
        className,
      )}
      style={{ cursor: getCursor() }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas content layer */}
      <div
        data-canvas-content
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          willChange: 'transform',
        }}
      >
        {children}

        {/* Creation preview rectangle */}
        {previewRect && previewRect.width > 5 && previewRect.height > 5 && (
          <div
            className={cn(
              'pointer-events-none absolute border-2 border-dashed',
              tool === 'frame'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-primary bg-primary/10',
            )}
            style={{
              left: previewRect.left,
              top: previewRect.top,
              width: previewRect.width,
              height: previewRect.height,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasViewport;
