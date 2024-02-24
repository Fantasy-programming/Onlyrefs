import { exists, createDir, readDir, BaseDirectory } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { copyFile } from "@tauri-apps/api/fs";
import { appDataDir, join, sep } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";

export const collectionExist = async (collectionName: string) => {
  const collectionPath = `collections/${collectionName}`;
  const result = await exists(collectionPath, { dir: BaseDirectory.AppData });
  return result;
};

export const createCollection = async (collectionName: string) => {
  const collectionPath = `collections/${collectionName}`;
  await createDir(collectionPath, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
};

export const convertSrc = (imagePath: string) => {
  return convertFileSrc(imagePath);
};

export const getCollection = async (collection: string) => {
  const exist = await collectionExist(collection);

  if (!exist) {
    await createCollection(collection);
  }

  const collectionPath = `collections/${collection}`;

  const entries = await readDir(collectionPath, { dir: BaseDirectory.AppData });
  return entries;
};

export const selectFiles = async (collection: string) => {
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

  const destDir = await appDataDir();

  for (const image of result) {
    const segments = image.split(sep);
    const filename = segments[segments.length - 1];
    const newPath = await join(destDir, collection, filename);
    await copyFile(image, newPath);
  }
};
