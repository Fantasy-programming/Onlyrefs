import { listen } from "@tauri-apps/api/event";
import { copyFile } from "@tauri-apps/api/fs";
import { appDataDir, join, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";
import { onCleanup, createSignal } from "solid-js";
import { collectionExist, createCollection } from "../../lib/helper";
import { ProgressionProps, useFileSelectorReturnType } from "./Board.types";
import { invoke } from "@tauri-apps/api";

export const useFileSelector = (): useFileSelectorReturnType => {
  let waitForFiles: Promise<() => void>;
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

    const destDir = await join(await appDataDir(), "collections");
    setProgress({ total: result.length, completed: 0 });

    for (const image of result) {
      let randomID: string = "";

      while (true) {
        // Generate the ID
        randomID = await invoke("generate_id", { lenght: 13 });
        console.log(randomID);

        // Check if the collection exists
        const exist = await collectionExist(randomID);

        // if it doesn't then continue the loop
        if (!exist) {
          break;
        }
      }

      // Create the folder
      await createCollection(randomID);

      // Move the file to the folder
      const segments = image.split(sep);
      const filename = segments[segments.length - 1];
      const destinationFolder = await join(destDir, randomID);
      const newPath = await join(destDir, randomID, filename);
      await copyFile(image, newPath);

      // Generate the metadata (rust)
      await invoke("generate_metadata", {
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
  };

  const dropFiles = async (collection: string) => {
    waitForFiles = listen("tauri://file-drop", async (event) => {
      const files = event.payload as string[];

      const destDir = await join(await appDataDir(), "collections");
      setProgress({ total: files.length, completed: 0 });

      for (const image of files) {
        let randomID: string = "";

        while (true) {
          // Generate the ID
          randomID = await invoke("generate_id", { lenght: 13 });
          console.log(randomID);

          // Check if the collection exists
          const exist = await collectionExist(randomID);

          // if it doesn't then continue the loop
          if (!exist) {
            break;
          }
        }

        // Create the folder
        await createCollection(randomID);

        // Move the file to the folder
        const segments = image.split(sep);
        const filename = segments[segments.length - 1];
        const destinationFolder = await join(destDir, randomID);
        const newPath = await join(destDir, randomID, filename);
        await copyFile(image, newPath);

        // Generate the metadata (rust)
        await invoke("generate_metadata", {
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
    });
  };

  // Cleanup progress when the component unmounts
  onCleanup(() => {
    waitForFiles.then((f) => f());
    setProgress({ total: 0, completed: 0 });
  });

  return [selectFiles, dropFiles, progress];
};
