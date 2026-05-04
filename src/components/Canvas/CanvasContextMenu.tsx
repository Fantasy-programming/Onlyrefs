import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuCheckboxItem,
  ContextMenuShortcut,
} from '../ui/context-menu';
import {
  FiX,
  FiPlus,
  FiImage,
  FiCopy,
  FiClipboard,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiGrid,
  FiSettings,
  FiLayers,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiMaximize,
  FiEdit3,
  FiType,
  FiRotateCcw,
  FiLock,
  FiZap,
  FiTrash2,
} from 'react-icons/fi';
import {
  useCanvasStoreContext,
  useContextHasSelection,
  useContextCanvasSettings,
  useContextCanvasSelection,
} from './CanvasStoreContext';
import { useCanvasListStore } from '@/state/canvasliststore';
import { open } from '@tauri-apps/plugin-dialog';
import { createImageRef } from '@/lib/commands';
import { useRefStore } from '@/state/refstore';
import { ImageRef } from '@/lib/types';
import { useSettingsDialog } from '@/components/Settings/SettingsDialogContext';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  canvasId?: string;
}

export const CanvasContextMenu = memo<CanvasContextMenuProps>(
  ({ children, canvasId }) => {
    const navigate = useNavigate();
    const store = useCanvasStoreContext();
    const hasSelection = useContextHasSelection();
    const settings = useContextCanvasSettings();
    const selection = useContextCanvasSelection();

    // Canvas actions from context store
    const undo = store((s) => s.undo);
    const redo = store((s) => s.redo);
    const selectAll = store((s) => s.selectAll);
    const clearSelection = store((s) => s.clearSelection);
    const deleteSelection = store((s) => s.deleteSelection);
    const duplicateSelection = store((s) => s.duplicateSelection);
    const lockSelection = store((s) => s.lockSelection);
    const unlockSelection = store((s) => s.unlockSelection);
    const bringToFront = store((s) => s.bringToFront);
    const sendToBack = store((s) => s.sendToBack);
    const bringForward = store((s) => s.bringForward);
    const sendBackward = store((s) => s.sendBackward);
    const updateSettings = store((s) => s.updateSettings);
    const setViewport = store((s) => s.setViewport);
    const zoomToFit = store((s) => s.zoomToFit);
    const addAnnotation = store((s) => s.addAnnotation);
    const addItem = store((s) => s.addItem);

    // Ref store for importing
    const addRef = useRefStore((s) => s.addRef);

    // Canvases for "Add Refs" submenu
    const canvases = useCanvasListStore((s) => s.canvases);

    // Handle close canvas
    const handleClose = useCallback(() => {
      navigate('/');
    }, [navigate]);

    // Handle import images
    const handleImportImages = useCallback(async () => {
      try {
        const selected = await open({
          multiple: true,
          filters: [
            {
              name: 'Images',
              extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'],
            },
          ],
        });

        if (selected && Array.isArray(selected) && selected.length > 0) {
          // Import images one by one
          let xOffset = 100;
          for (const filePath of selected) {
            // Extract filename from path
            const fileName = filePath.split(/[/\\]/).pop() || 'image';
            const ref = await createImageRef(
              filePath,
              fileName,
              canvasId || '',
            );

            if (ref) {
              addRef(ref);
              // Add to canvas with offset positions
              const imageRef = ref as ImageRef;
              const dims = imageRef.metadata.dimensions || [300, 200];
              const scale = Math.min(1, 400 / Math.max(dims[0], dims[1]));
              addItem(
                ref.metadata.id,
                { x: xOffset, y: 100 },
                { width: dims[0] * scale, height: dims[1] * scale },
              );
              xOffset += dims[0] * scale + 20;
            }
          }
        }
      } catch (error) {
        console.error('Failed to import images:', error);
      }
    }, [canvasId, addRef, addItem]);

    // Handle add note
    const handleAddNote = useCallback(() => {
      addAnnotation({ x: 200, y: 200 });
    }, [addAnnotation]);

    // Handle reset camera
    const handleResetCamera = useCallback(() => {
      setViewport({ x: 0, y: 0, zoom: 1 });
    }, [setViewport]);

    // Handle zoom to fit
    const handleZoomToFit = useCallback(() => {
      const container = document.querySelector('[data-canvas-viewport]');
      if (container) {
        const rect = container.getBoundingClientRect();
        zoomToFit(rect.width, rect.height);
      }
    }, [zoomToFit]);

    // Toggle grid
    const handleToggleGrid = useCallback(() => {
      updateSettings({ showGrid: !settings.showGrid });
    }, [updateSettings, settings.showGrid]);

    // Toggle snap to grid
    const handleToggleSnapToGrid = useCallback(() => {
      updateSettings({ snapToGrid: !settings.snapToGrid });
    }, [updateSettings, settings.snapToGrid]);

    // Get all selected IDs for arrange operations
    const getAllSelectedIds = useCallback(() => {
      return [
        ...selection.itemIds,
        ...selection.frameIds,
        ...selection.annotationIds,
      ];
    }, [selection]);

    // Arrange handlers
    const handleBringToFront = useCallback(() => {
      bringToFront(getAllSelectedIds());
    }, [bringToFront, getAllSelectedIds]);

    const handleSendToBack = useCallback(() => {
      sendToBack(getAllSelectedIds());
    }, [sendToBack, getAllSelectedIds]);

    const handleBringForward = useCallback(() => {
      bringForward(getAllSelectedIds());
    }, [bringForward, getAllSelectedIds]);

    const handleSendBackward = useCallback(() => {
      sendBackward(getAllSelectedIds());
    }, [sendBackward, getAllSelectedIds]);

    // Navigate to settings
    const handleOpenSettings = useCallback(() => {
      navigate('/settings');
    }, [navigate]);

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {/* Close */}
          <ContextMenuItem onClick={handleClose}>
            <FiX className="mr-2 h-4 w-4" />
            Close Canvas
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Add Refs submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FiPlus className="mr-2 h-4 w-4" />
              Add Refs
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {canvases.length === 0 ? (
                <ContextMenuItem disabled>No sources available</ContextMenuItem>
              ) : (
                <>
                  <ContextMenuItem disabled>
                    <span className="text-muted-foreground text-xs">
                      Drag refs from sidebar or use Grid view
                    </span>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Import Images */}
          <ContextMenuItem onClick={handleImportImages}>
            <FiImage className="mr-2 h-4 w-4" />
            Import Images
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Selection operations submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!hasSelection}>
              <FiLayers className="mr-2 h-4 w-4" />
              Selection
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={selectAll}>
                Select All
                <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={clearSelection}
                disabled={!hasSelection}
              >
                Deselect
                <ContextMenuShortcut>Esc</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={duplicateSelection}
                disabled={!hasSelection}
              >
                Duplicate
                <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={deleteSelection}
                disabled={!hasSelection}
                className="text-red-500 focus:text-red-500"
              >
                <FiTrash2 className="mr-2 h-4 w-4" />
                Delete
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={lockSelection} disabled={!hasSelection}>
                <FiLock className="mr-2 h-4 w-4" />
                Lock
              </ContextMenuItem>
              <ContextMenuItem
                onClick={unlockSelection}
                disabled={!hasSelection}
              >
                Unlock
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Arrange submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!hasSelection}>
              <FiLayers className="mr-2 h-4 w-4" />
              Arrange
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem
                onClick={handleBringToFront}
                disabled={!hasSelection}
              >
                Bring to Front
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleBringForward}
                disabled={!hasSelection}
              >
                Bring Forward
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleSendBackward}
                disabled={!hasSelection}
              >
                Send Backward
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleSendToBack}
                disabled={!hasSelection}
              >
                Send to Back
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Align submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!hasSelection}>
              <FiAlignLeft className="mr-2 h-4 w-4" />
              Align
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem disabled>
                <FiAlignLeft className="mr-2 h-4 w-4" />
                Align Left
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <FiAlignCenter className="mr-2 h-4 w-4" />
                Align Center
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <FiAlignRight className="mr-2 h-4 w-4" />
                Align Right
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled>Align Top</ContextMenuItem>
              <ContextMenuItem disabled>Align Middle</ContextMenuItem>
              <ContextMenuItem disabled>Align Bottom</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled>
                Distribute Horizontally
              </ContextMenuItem>
              <ContextMenuItem disabled>Distribute Vertically</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Normalize submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={!hasSelection}>
              <FiMaximize className="mr-2 h-4 w-4" />
              Normalize
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem disabled>Same Width</ContextMenuItem>
              <ContextMenuItem disabled>Same Height</ContextMenuItem>
              <ContextMenuItem disabled>Same Size</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* Canvas submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FiGrid className="mr-2 h-4 w-4" />
              Canvas
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {/* Grid submenu */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FiGrid className="mr-2 h-4 w-4" />
                  Grid
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-40">
                  <ContextMenuCheckboxItem
                    checked={settings.showGrid}
                    onCheckedChange={handleToggleGrid}
                  >
                    Show Grid
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    checked={settings.snapToGrid}
                    onCheckedChange={handleToggleSnapToGrid}
                  >
                    Snap to Grid
                  </ContextMenuCheckboxItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem disabled>Grid Style: Dots</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleResetCamera}>
                <FiRotateCcw className="mr-2 h-4 w-4" />
                Reset Camera
                <ContextMenuShortcut>Ctrl+0</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={handleZoomToFit}>
                <FiMaximize className="mr-2 h-4 w-4" />
                Zoom to Fit
                <ContextMenuShortcut>Ctrl+1</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled>
                <FiZap className="mr-2 h-4 w-4" />
                Optimize Canvas
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <FiLock className="mr-2 h-4 w-4" />
                Lock Canvas
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Mode submenu (placeholder) */}
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled>
              <FiEdit3 className="mr-2 h-4 w-4" />
              Mode
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              <ContextMenuItem disabled>Coming Soon</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* Undo/Redo */}
          <ContextMenuItem onClick={undo}>
            <FiCornerUpLeft className="mr-2 h-4 w-4" />
            Undo
            <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={redo}>
            <FiCornerUpRight className="mr-2 h-4 w-4" />
            Redo
            <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Clipboard operations */}
          <ContextMenuItem disabled>
            <FiCopy className="mr-2 h-4 w-4" />
            Copy
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>
            <FiClipboard className="mr-2 h-4 w-4" />
            Paste
            <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Quick actions */}
          <ContextMenuItem onClick={handleAddNote}>
            <FiType className="mr-2 h-4 w-4" />
            Add Note
          </ContextMenuItem>
          <ContextMenuItem disabled>
            <FiEdit3 className="mr-2 h-4 w-4" />
            Draw
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Settings */}
          <ContextMenuItem onClick={handleOpenSettings}>
            <FiSettings className="mr-2 h-4 w-4" />
            Settings
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

CanvasContextMenu.displayName = 'CanvasContextMenu';

export default CanvasContextMenu;
