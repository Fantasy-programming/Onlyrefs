import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/api/dialog';
import { onCleanup, createSignal, createRoot } from 'solid-js';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { SUPPORTED_FILES } from '~/lib/config';
import { createMediaRef } from '~/lib/commands';

export const useFileSelector = createRoot(() => {
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progress, setProgress] = createSignal<ProgressionProps>({
    total: 0,
    completed: 0,
  });

  const fileOperationQueue: { collection: string; files: string[] }[] = [];
  let waitForFiles: Promise<() => void>;

  const processQueue = async () => {
    if (isProcessing()) {
      return;
    }

    if (fileOperationQueue.length === 0) {
      setProgress({ total: 0, completed: 0 });
      return;
    }

    const { collection, files } = fileOperationQueue.shift()!;

    setIsProcessing(true);

    try {
      for (const image of files) {
        await createMediaRef(image, collection);

        setProgress({
          total: progress().total,
          completed: progress().completed + 1,
        });
      }
    } finally {
      setIsProcessing(false);
      processQueue();
    }
  };

  const selectFiles = async (collection: string) => {
    const files = await open({
      multiple: true,
      filters: SUPPORTED_FILES,
    });

    if (!files || !Array.isArray(files)) {
      return;
    }

    fileOperationQueue.push({
      files: files,
      collection: collection,
    });

    setProgress((prev) => {
      return {
        total: prev.total + files.length,
        completed: prev.completed,
      };
    });

    await processQueue();
  };

  const dropFiles = async (collection: string) => {
    waitForFiles = listen('tauri://file-drop', async (event) => {
      const files = event.payload as string[];

      fileOperationQueue.push({
        files: files,
        collection: collection,
      });

      setProgress((prev) => {
        return {
          total: prev.total + files.length,
          completed: prev.completed,
        };
      });

      await processQueue();
    });
  };

  onCleanup(() => {
    waitForFiles.then((f) => f());
    setProgress({ total: 0, completed: 0 });
  });

  return [selectFiles, dropFiles, progress] as useFileSelectorReturnType;
});
