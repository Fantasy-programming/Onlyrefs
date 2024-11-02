import { appDataDir, downloadDir, join } from '@tauri-apps/api/path';
import { readTextFile, copyFile, remove } from '@tauri-apps/plugin-fs';
import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { differenceInSeconds, parse } from 'date-fns';
import Fuse, { IFuseOptions } from 'fuse.js';

import {
  BREAKPOINTS_4,
  BREAKPOINTS_5,
  BREAKPOINTS_6,
  COLLECTIONS_DIR,
  DATA_DIR,
  SUPPORTED_FILES,
} from './config';

import { ImageMetadata, ImageRef, Ref } from './types';
import { RefMeta, contextItemType } from './types';

/// Check if a ref with the given id exists
export const refExist = async (collectionName: string) => {
  try {
    return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
      baseDir: DATA_DIR,
    });
  } catch (error) {
    return false;
  }
};

/// Create a ref directory
export const createRefDir = async (collectionName: string) => {
  try {
    await mkdir(`${COLLECTIONS_DIR}/${collectionName}`, {
      baseDir: DATA_DIR,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
  }
};

/// Delete a ref directory
export const deleteRefDir = async (collectionID: string) => {
  try {
    await remove(`${COLLECTIONS_DIR}/${collectionID}`, {
      baseDir: DATA_DIR,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
  }
};

/// Returns the text of a file
export const get_note_content = async (notepath: string) => {
  try {
    const content = await readTextFile(notepath);
    return content;
  } catch (e) {
    console.error(e);
    return 'Something went wrong';
  }
};

export const verifyExtension = (extension: string) => {
  extension = extension.toLowerCase();
  for (const category of SUPPORTED_FILES) {
    if (category.extensions.includes(extension)) {
      return category.name;
    }
  }

  return null;
};

/// Search for Refs
export function searchExtended(refs: Ref[] | undefined, searchText: string) {
  const fuseOpt: IFuseOptions<Ref> = {
    keys: ['metadata.name', 'metadata.tags'],
    threshold: 0.5,
  };

  const fuse = new Fuse(refs || [], fuseOpt);
  const results = fuse.search(searchText);

  return results.map((result) => result.item);
}

/// Get Breakpoints for the masonry
export const getBreakpoints = (columns: number) => {
  switch (columns) {
    case 4:
      return BREAKPOINTS_4;
    case 5:
      return BREAKPOINTS_5;
    case 6:
      return BREAKPOINTS_6;
    default:
      return BREAKPOINTS_4;
  }
};

export const getUpdatedAtTimestamp = (ref: Ref) => {
  const updatedAt = parse(
    ref.metadata.updated_at,
    'yyyy-MM-dd HH:mm:ss.SSSSSSSSS XXX',
    new Date(),
  );
  return updatedAt.getTime();
};

export const elapsedTime = (createdAt: string) => {
  const currentTime = new Date();
  const createdAtDate = parse(
    createdAt,
    'yyyy-MM-dd HH:mm:ss.SSSSSSSSS XXX',
    new Date(),
  );
  const elapsedTimeInSeconds = differenceInSeconds(currentTime, createdAtDate);

  if (elapsedTimeInSeconds < 60) {
    return `${elapsedTimeInSeconds}s ago`;
  } else if (elapsedTimeInSeconds < 3600) {
    const minutes = Math.floor(elapsedTimeInSeconds / 60);
    return `${minutes}m ago`;
  } else if (elapsedTimeInSeconds < 86400) {
    const hours = Math.floor(elapsedTimeInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(elapsedTimeInSeconds / 86400);
    return `${days}d ago`;
  }
};

export const isMediaRef = (source: Ref): source is ImageRef => {
  return 'colors' in (source.metadata as any);
};

export const isMedia_Metadata = (source: RefMeta): source is ImageMetadata => {
  return 'colors' in (source as any);
};

export const saveMediaToDisk = async (id: string, file_name: string) => {
  const destDir = await open({
    directory: true,
    defaultPath: await downloadDir(),
  });

  if (!destDir || Array.isArray(destDir)) return;

  const destFile = await join(destDir, file_name);
  const fileLocation = await join(
    await appDataDir(),
    COLLECTIONS_DIR,
    id,
    file_name,
  );

  await copyFile(fileLocation, destFile);
};

export const makepath = async (id: string, fileName: string) => {
  const destPath = await join(
    await appDataDir(),
    COLLECTIONS_DIR,
    id,
    fileName,
  );

  return destPath;
};

// Create a context menu
export const createItems = (key: string, payload: string): contextItemType => {
  switch (key) {
    case 'imagebase':
      return [
        {
          event: 'deleteRef',
          label: 'Delete Reference',
          payload: payload,
          shortcut: 'cmd_or_ctrl+d',
        },
      ];
    default:
      return [];
  }
};
