import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { SUPPORTED_FILES } from '@/lib/config';
import {
  createAudioRef,
  createDocumentRef,
  createImageRef,
  createVideoRef,
  createDesignRef,
  createModelRef,
} from '@/lib/commands';
import { sep } from '@tauri-apps/api/path';
import { verifyExtension } from '@/lib/helper';
import { toast } from 'react-toastify';

// Process a single file and return result
const processFile = async (
  file: string,
  collection: string,
): Promise<{ success: boolean; file: string; error?: string }> => {
  try {
    const segments = file.split(sep());
    const fileName = segments[segments.length - 1];
    const extension = fileName.split('.').pop();

    if (!extension) {
      return { success: false, file, error: `No extension found` };
    }

    const type = verifyExtension(extension);
    if (!type) {
      return {
        success: false,
        file,
        error: `Unsupported file type: ${extension}`,
      };
    }

    switch (type) {
      case 'image':
        await createImageRef(file, fileName, collection);
        break;
      case 'video':
        await createVideoRef(file, fileName, collection);
        break;
      case 'audio':
        await createAudioRef(file, fileName, collection);
        break;
      case 'document':
        await createDocumentRef(file, fileName, collection);
        break;
      case 'design':
        await createDesignRef(file, fileName, collection);
        break;
      case 'model':
        await createModelRef(file, fileName, collection);
        break;
      default:
        return { success: false, file, error: `Unknown file type: ${type}` };
    }

    return { success: true, file };
  } catch (error) {
    return { success: false, file, error: String(error) };
  }
};

// Batch size for parallel processing - increased for better performance
const BATCH_SIZE = 6;

export const useFileSelector = (): useFileSelectorReturnType => {
  const [progress, setProgress] = useState<ProgressionProps>({
    total: 0,
    completed: 0,
  });
  const fileOperationQueue = useRef<{ collection: string; files: string[] }[]>(
    [],
  );
  const isProcessingRef = useRef(false);
  const dropCollectionRef = useRef<string>('all'); // Store current collection

  const processQueue = useCallback(async () => {
    // Atomic check-and-set to prevent race conditions
    if (isProcessingRef.current) {
      return;
    }

    if (fileOperationQueue.current.length === 0) {
      setProgress({ total: 0, completed: 0 });
      return;
    }

    const queueItem = fileOperationQueue.current.shift();
    if (!queueItem) return;

    const { collection, files } = queueItem;

    isProcessingRef.current = true;

    const failedFiles: string[] = [];
    let successCount = 0;

    try {
      // Process files in parallel batches
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((file) => processFile(file, collection)),
        );

        // Count completed in this batch
        let batchCompleted = 0;
        for (const result of results) {
          batchCompleted++;
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              successCount++;
            } else {
              failedFiles.push(result.value.file);
              console.error(
                `Failed to process ${result.value.file}: ${result.value.error}`,
              );
            }
          } else {
            failedFiles.push('Unknown file');
            console.error(`Failed to process file:`, result.reason);
          }
        }

        setProgress((prev) => ({
          total: prev.total,
          completed: prev.completed + batchCompleted,
        }));
      }

      // Show toast notifications
      if (failedFiles.length > 0 && successCount > 0) {
        toast.warning(
          `Added ${successCount} files, ${failedFiles.length} failed`,
        );
      } else if (failedFiles.length > 0) {
        toast.error(`Failed to add ${failedFiles.length} files`);
      } else if (successCount > 0) {
        toast.success(`Added ${successCount} files`);
      }
    } finally {
      isProcessingRef.current = false;

      // Process next batch if any
      if (fileOperationQueue.current.length > 0) {
        processQueue();
      }
    }
  }, []);

  const selectFiles = useCallback(
    async (collection: string) => {
      try {
        const files = await open({ multiple: true, filters: SUPPORTED_FILES });

        if (!files || !Array.isArray(files) || files.length === 0) {
          return;
        }

        fileOperationQueue.current.push({
          files: files as string[],
          collection,
        });

        setProgress((prev) => ({
          total: prev.total + files.length,
          completed: prev.completed,
        }));

        await processQueue();
      } catch (error) {
        console.error('Failed to select files:', error);
      }
    },
    [processQueue],
  );

  // Initialize drop handler once and use ref for collection
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupDropHandler = async () => {
      try {
        unlisten = await listen<{ paths: string[] }>(
          'tauri://drag-drop',
          async (event) => {
            const files = event.payload.paths;

            if (!files || files.length === 0) {
              return;
            }

            // Use the collection from ref
            const collection = dropCollectionRef.current;

            fileOperationQueue.current.push({ files, collection });

            setProgress((prev) => ({
              total: prev.total + files.length,
              completed: prev.completed,
            }));

            await processQueue();
          },
        );
      } catch (error) {
        console.error('Failed to setup drop handler:', error);
      }
    };

    setupDropHandler();

    // Cleanup on unmount
    return () => {
      if (unlisten) {
        unlisten();
      }
      // Reset progress
      setProgress({ total: 0, completed: 0 });
      // Clear queue
      fileOperationQueue.current = [];
      isProcessingRef.current = false;
    };
  }, [processQueue]);

  // Function to update which collection drops should go to
  const setDropCollection = useCallback((collection: string) => {
    dropCollectionRef.current = collection;
  }, []);

  return [
    selectFiles,
    setDropCollection,
    progress,
  ] as useFileSelectorReturnType;
};
