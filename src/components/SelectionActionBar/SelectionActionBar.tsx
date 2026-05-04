import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiDownload, FiX, FiLayers } from 'react-icons/fi';
import {
  useSelectionStore,
  useHasSelection,
  useSelectionCount,
  useSelectedIds,
} from '@/state/selectionStore';
import { useRefStore } from '@/state/refstore';
import { deleteRef, createStack } from '@/lib/commands';
import { saveMediaToDisk } from '@/lib/helper';
import { Button } from '@/components/ui/button';
import { BulkTagPicker } from '@/components/TagPicker/TagPicker';
import { ImageRef, VideoRef, AudioRef } from '@/lib/types';

export const SelectionActionBar: React.FC = () => {
  const hasSelection = useHasSelection();
  const selectionCount = useSelectionCount();
  const selectedIds = useSelectedIds();
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const refs = useRefStore((state) => state.refs);
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);

  // Get selected refs and their metapaths for bulk operations
  const selectedRefs = useMemo(() => {
    return refs.filter((r) => selectedIds.includes(r.metadata.id));
  }, [refs, selectedIds]);

  const metapaths = useMemo(() => {
    return selectedRefs.map((r) => r.metapath);
  }, [selectedRefs]);

  // Check if any selected items are exportable (image/video/audio)
  const hasExportable = useMemo(() => {
    return selectedRefs.some(
      (r) =>
        r.metadata.ref_type === 'image' ||
        r.metadata.ref_type === 'video' ||
        r.metadata.ref_type === 'audio',
    );
  }, [selectedRefs]);

  // Check if we can create a stack (2+ items, none are already stacks)
  const canStack = useMemo(() => {
    if (selectedRefs.length < 2) return false;
    return !selectedRefs.some((r) => r.metadata.ref_type === 'stack');
  }, [selectedRefs]);

  // Get common board_id from selected refs (use first item's board_id)
  const commonBoardId = useMemo(() => {
    if (selectedRefs.length === 0) return null;
    return selectedRefs[0].metadata.board_id || null;
  }, [selectedRefs]);

  const handleDeleteSelected = async () => {
    // Delete all selected items
    for (const id of selectedIds) {
      await deleteRef(id);
      deleteRefFromStore(id);
    }
    clearSelection();
  };

  const handleExportSelected = async () => {
    // Export all exportable items
    for (const ref of selectedRefs) {
      if (ref.metadata.ref_type === 'image') {
        const imageRef = ref as ImageRef;
        await saveMediaToDisk(
          imageRef.metadata.id,
          imageRef.metadata.file_name,
        );
      } else if (ref.metadata.ref_type === 'video') {
        const videoRef = ref as VideoRef;
        await saveMediaToDisk(
          videoRef.metadata.id,
          videoRef.metadata.file_name,
        );
      } else if (ref.metadata.ref_type === 'audio') {
        const audioRef = ref as AudioRef;
        await saveMediaToDisk(
          audioRef.metadata.id,
          audioRef.metadata.file_name,
        );
      }
    }
  };

  const handleCreateStack = async () => {
    if (!canStack) return;

    try {
      const stack = await createStack(selectedIds, commonBoardId);
      if (stack) {
        // Remove the stacked items from display (they're now inside the stack)
        const removeRefsFromDisplay =
          useRefStore.getState().removeRefsFromDisplay;
        removeRefsFromDisplay(selectedIds);
        clearSelection();
      }
    } catch (error) {
      console.error('Failed to create stack:', error);
    }
  };

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="border-border/60 bg-background/95 flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg backdrop-blur-sm">
            {/* Selection count */}
            <span className="text-foreground mr-2 text-sm font-medium">
              {selectionCount} selected
            </span>

            {/* Divider */}
            <div className="bg-border h-5 w-px" />

            {/* Add Tags */}
            <BulkTagPicker
              ids={selectedIds}
              paths={metapaths}
              triggerClassName="rounded-full"
            />

            {/* Stack (if 2+ items selected and none are stacks) */}
            {canStack && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full text-xs"
                onClick={handleCreateStack}
              >
                <FiLayers className="h-3 w-3" />
                Stack
              </Button>
            )}

            {/* Export (if any exportable) */}
            {hasExportable && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full text-xs"
                onClick={handleExportSelected}
              >
                <FiDownload className="h-3 w-3" />
                Export
              </Button>
            )}

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 gap-1 rounded-full text-xs"
              onClick={handleDeleteSelected}
            >
              <FiTrash2 className="h-3 w-3" />
              Delete
            </Button>

            {/* Divider */}
            <div className="bg-border h-5 w-px" />

            {/* Clear selection */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
              onClick={clearSelection}
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionActionBar;
