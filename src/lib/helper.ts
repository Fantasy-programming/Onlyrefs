import {
  exists,
  createDir,
  readDir,
  readTextFile,
  removeDir,
  BaseDirectory,
  FileEntry,
} from "@tauri-apps/api/fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { MediaRef, Metadata } from "./types";
import {
  COLLECTIONS_DIR,
  breakpoints_4,
  breakpoints_5,
  breakpoints_6,
} from "./config";

/// Check if a ref with the given id exists
export const refExist = async (collectionName: string) => {
  return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
  });
};

// Create a new ref directory
export const createRefDir = async (collectionName: string) => {
  await createDir(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
};

// Delete a ref with its metadata
export const deleteRef = async (collectionID: string) => {
  await removeDir(`${COLLECTIONS_DIR}/${collectionID}`, {
    dir: BaseDirectory.AppData,
    recursive: true,
  });
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
    low_res_imagepath: "",
    metapath: "",
    metadata: undefined!,
  };

  const promises = refs.map(async (ref) => {
    if (ref.name === "metadata.json") {
      result.metapath = ref.path;
      result.metadata = await parseMetadata(ref.path);
    } else if (ref.name?.startsWith("lower_")) {
      result.low_res_imagepath = convertFileSrc(ref.path);
    } else {
      result.imagepath = convertFileSrc(ref.path);
    }
  });

  await Promise.all(promises);

  return result;
};

// Parse the metadata of a ref
export const parseMetadata = async (path: string): Promise<Metadata> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};

export const fetchRefs = async () => {
  const data = await getAllRefs();
  return await Promise.all(
    data.map(async (ref) => {
      return await parseRefs(ref);
    }),
  );
};

export const changRefName = async (refID: string, newName: string) => {
  await invoke("rename_ref", { refID, newName });
};

export const deleteTag = async (refID: string, tag: string) => {
  await invoke("delete_tag", { refID, tag });
};

export const addTag = async (refID: string, tag: string) => {
  await invoke("add_tag", { refId: refID, tag: tag });
};

export const getBreakpoints = (columns: number) => {
  switch (columns) {
    case 4:
      return breakpoints_4;
    case 5:
      return breakpoints_5;
    case 6:
      return breakpoints_6;
    default:
      return breakpoints_4;
  }
};
