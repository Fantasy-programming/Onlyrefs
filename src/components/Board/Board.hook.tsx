import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { onCleanup, createSignal, createRoot } from 'solid-js';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { SUPPORTED_FILES } from '~/lib/config';
import refsService from '~/services/refs.service';

import { sep } from '@tauri-apps/api/path';
import { verifyExtension } from '~/lib/helper';

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
      for (const file of files) {
        const segments = file.split(sep);
        const fileName = segments[segments.length - 1];
        const extension = fileName.split('.').pop();

        if (!extension) {
          return null;
        }

        const type = verifyExtension(extension);

        if (!type) {
          return null;
        }

        switch (type) {
          case 'image':
            await refsService.createImageRef(file, fileName, collection);
            break;
          case 'video':
            await refsService.createVideoRef(file, fileName, collection);
            break;
          case 'audio':
            await refsService.createAudioRef(file, fileName, collection);
            break;
          case 'document':
            await refsService.createDocumentRef(file, fileName, collection);
            break;
          default:
            console.error('Error: Unknown file type');
        }

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
