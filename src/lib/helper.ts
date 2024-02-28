import {
  exists,
  createDir,
  readDir,
  removeFile,
  renameFile,
  BaseDirectory,
} from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

const COLLECTIONS_DIR = "collections";

export const collectionExist = async (collectionName: string) => {
  return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
  });
};

export const createCollection = async (collectionName: string) => {
  await createDir(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
};

export const deleteRef = async (collectionName: string, ref: string) => {
  await removeFile(`${COLLECTIONS_DIR}/${collectionName}/${ref}`, {
    dir: BaseDirectory.AppData,
  });
};

export const moveRef = async (
  CurrentCollectionName: string,
  TargetCollectionName: string,
  ref: string,
) => {
  await renameFile(
    `${COLLECTIONS_DIR}/${CurrentCollectionName}/${ref}`,
    `${COLLECTIONS_DIR}/${TargetCollectionName}/${ref}`,
    {
      dir: BaseDirectory.AppData,
    },
  );
};

export const convertSrc = (imagePath: string) => {
  return convertFileSrc(imagePath);
};

export const getCollection = async (collection: string) => {
  const exist = await collectionExist(collection);

  if (!exist) {
    return null;
  }

  const entries = await readDir(`${COLLECTIONS_DIR}/${collection}`, {
    dir: BaseDirectory.AppData,
  });
  return entries;
};

export const getCollections = async () => {
  const entries = await readDir(COLLECTIONS_DIR, {
    dir: BaseDirectory.AppData,
  });

  return entries;
};
