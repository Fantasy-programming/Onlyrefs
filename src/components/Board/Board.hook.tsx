import { listen } from '@tauri-apps/api/event';
import { copyFile } from '@tauri-apps/api/fs';
import { appDataDir, join, sep } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/dialog';
import { onCleanup, createSignal, createRoot } from 'solid-js';
import { generate_id } from '~/lib/helper';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { invoke } from '@tauri-apps/api';

export const useFileSelector = createRoot(() => {
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progress, setProgress] = createSignal<ProgressionProps>({
    total: 0,
    completed: 0,
  });

  const fileOperationQueue: { collection: string; files: string[] }[] = [];
  let waitForFiles: Promise<() => void>;

  const processQueue = async () => {
    if (isProcessing() || fileOperationQueue.length === 0) {
      return;
    }

    const { collection, files } = fileOperationQueue.shift()!;

    setIsProcessing(true);

    try {
      const destDir = await join(await appDataDir(), 'collections');

      for (const image of files) {
        const randomID = await generate_id({
          lenght: 13,
          createDir: true,
        });

        const segments = image.split(sep);
        const filename = segments[segments.length - 1];
        const destinationFolder = await join(destDir, randomID);
        const newPath = await join(destDir, randomID, filename);
        await copyFile(image, newPath);

        await invoke('generate_metadata', {
          destPath: destinationFolder,
          destFile: newPath,
          refId: randomID,
          fileName: filename,
          collection: collection,
        });

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
