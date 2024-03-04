import {
  exists,
  createDir,
  readDir,
  readTextFile,
  removeFile,
  renameFile,
  BaseDirectory,
  FileEntry,
} from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { MediaRef, Metadata } from "./types";
import { COLLECTIONS_DIR } from "./config";

/// Check if a ref with the given id exists
export const collectionExist = async (collectionName: string) => {
  return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
  });
};

/// Create a new ref directory
export const createCollection = async (collectionName: string) => {
  await createDir(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
};

/// Delete a ref with its metadata
export const deleteRef = async (collectionName: string) => {
  await removeFile(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
  });
};

// DEPRECATED: Has to be changed to reflect the new file structure
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

// DEPRECATED: Has to be removed
export const convertSrc = (imagePath: string) => {
  return convertFileSrc(imagePath);
};

export const getAllRefs = async () => {
  const entries = await readDir(COLLECTIONS_DIR, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });

  const refs = entries.map((collection) => {
    if (!collection.children) {
      return [];
    }

    return collection.children;
  });

  return refs;
};

export const parseRefs = async (refs: FileEntry[]) => {
  let result: MediaRef = {
    imagepath: "",
    metapath: "",
    metadata: undefined!,
  };

  const promises = refs.map(async (ref) => {
    if (ref.name === "metadata.json") {
      result.metapath = ref.path;
      result.metadata = await readMetadata(ref.path);
    } else {
      result.imagepath = convertFileSrc(ref.path);
    }
  });

  await Promise.all(promises);

  return result;
};

// Read the metadata of a ref
export const readMetadata = async (path: string): Promise<Metadata> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};

// DEPRECATED: Has to be removed or changed to reflect the new file structure
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

// Deprecated: Has to be removed
export const getCollections = async () => {
  const entries = await readDir(COLLECTIONS_DIR, {
    dir: BaseDirectory.AppData,
  });

  return entries;
};
