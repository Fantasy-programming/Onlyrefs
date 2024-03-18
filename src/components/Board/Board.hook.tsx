import { listen } from '@tauri-apps/api/event';
import { copyFile } from '@tauri-apps/api/fs';
import { appDataDir, join, sep } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/dialog';
import { onCleanup, createSignal } from 'solid-js';
import { refExist, createRefDir } from '~/lib/helper';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { invoke } from '@tauri-apps/api';

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
      let randomID: string = '';

      while (true) {
        randomID = await invoke('generate_id', { lenght: 13 });
        const exist = await refExist(randomID);

        if (!exist) {
          break;
        }
      }

      await createRefDir(randomID);
      const segments = image.split(sep);
      const filename = segments[segments.length - 1];
      const destinationFolder = await join(destDir, randomID);
      const newPath = await join(destDir, randomID, filename);
      await copyFile(image, newPath);

      const x = performance.now();
      await invoke('generate_metadata', {
        destPath: destinationFolder,
        destFile: newPath,
        refId: randomID,
        fileName: filename,
        collection: collection,
      });
      const y = performance.now();
      console.log('Time to generate metadata: ', y - x);

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

export const useFileSelector = (): useFileSelectorReturnType => {
  return [selectFiles, dropFiles, progress];
};
