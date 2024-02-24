import { copyFile } from "@tauri-apps/api/fs";
import { appDataDir, join, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";
import { onCleanup, createSignal } from "solid-js";
import { collectionExist, createCollection } from "../../lib/helper";
import { ProgressionProps, useFileSelectorReturnType } from "./Board.types";

export const useFileSelector = (): useFileSelectorReturnType => {
  const [progress, setProgress] = createSignal<ProgressionProps>({
    total: 0,
    completed: 0,
  });

  const selectFiles = async (collection: string) => {
    const result = await open({
      multiple: true,
    });

    if (!result || !Array.isArray(result)) {
      return;
    }

    const exist = await collectionExist(collection);

    if (!exist) {
      await createCollection(collection);
    }

    const destDir = await join(await appDataDir(), "collections");

    setProgress({ total: result.length, completed: 0 });

    for (const image of result) {
      const segments = image.split(sep);
      const filename = segments[segments.length - 1];
      const newPath = await join(destDir, collection, filename);

      await copyFile(image, newPath);

      setProgress({
        total: progress().total,
        completed: progress().completed + 1,
      });
    }
  };

  // Cleanup progress when the component unmounts
  onCleanup(() => {
    setProgress({ total: 0, completed: 0 });
  });

  return [selectFiles, progress];
};
