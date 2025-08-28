import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useRef, useState } from 'react';
import { ProgressionProps, useFileSelectorReturnType } from './Board.types';
import { SUPPORTED_FILES } from '@/lib/config';
import {
  createAudioRef,
  createDocumentRef,
  createImageRef,
  createVideoRef,
} from '@/lib/commands';
import { sep } from '@tauri-apps/api/path';
import { verifyExtension } from '@/lib/helper';

export const useFileSelector = (): useFileSelectorReturnType => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressionProps>({ total: 0, completed: 0 });

  const fileOperationQueue = useRef<{ collection: string; files: string[] }[]>([]);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const processQueue = async () => {
    if (isProcessing) return;
    if (fileOperationQueue.current.length === 0) {
      setProgress({ total: 0, completed: 0 });
      return;
    }

    const { collection, files } = fileOperationQueue.current.shift()!;

    setIsProcessing(true);

    try {
      for (const file of files) {
        const segments = file.split(sep());
        const fileName = segments[segments.length - 1];
        const extension = fileName.split('.').pop();

        if (!extension) return null;

        const type = verifyExtension(extension);
        if (!type) return null;

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
          default:
            console.error('Error: Unknown file type');
        }

        setProgress((prev) => ({ total: prev.total, completed: prev.completed + 1 }));
      }
    } finally {
      setIsProcessing(false);
      processQueue();
    }
  };

  const selectFiles = async (collection: string) => {
    const files = await open({ multiple: true, filters: SUPPORTED_FILES });
    if (!files || !Array.isArray(files)) return;

    fileOperationQueue.current.push({ files: files as string[], collection });

    setProgress((prev) => ({ total: prev.total + (files as string[]).length, completed: prev.completed }));

    await processQueue();
  };

  const dropFiles = async (collection: string) => {
    const unlisten = await listen('tauri://file-drop', async (event) => {
      const files = event.payload as string[];
      fileOperationQueue.current.push({ files, collection });
      setProgress((prev) => ({ total: prev.total + files.length, completed: prev.completed }));
      await processQueue();
    });

    unlistenRef.current = unlisten;
  };

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
      setProgress({ total: 0, completed: 0 });
    };
  }, []);
  
  return [selectFiles, dropFiles, () => progress] as useFileSelectorReturnType;
};
