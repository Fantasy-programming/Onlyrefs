import {
  exists,
  createDir,
  readTextFile,
  copyFile,
  removeDir,
} from '@tauri-apps/api/fs';
import { differenceInSeconds, parse } from 'date-fns';
import Fuse, { IFuseOptions } from 'fuse.js';

import {
  COLLECTIONS_DIR,
  DATA_DIR,
  SUPPORTED_FILES,
  breakpoints_4,
  breakpoints_5,
  breakpoints_6,
} from './config';
import {
  MediaRef,
  Metadata,
  NoteMetadata,
  Ref,
  contextItemType,
} from './types';
import { appDataDir, downloadDir, join } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/dialog';
import { error } from 'tauri-plugin-log-api';

/// Check if a ref with the given id exists
export const refExist = async (collectionName: string) => {
  try {
    return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
      dir: DATA_DIR,
    });
  } catch (error) {
    return false;
  }
};

/// Create a ref directory
export const createRefDir = async (collectionName: string) => {
  try {
    await createDir(`${COLLECTIONS_DIR}/${collectionName}`, {
      dir: DATA_DIR,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    error(`Error: Couln't create ${collectionName} directory`);
  }
};

/// Delete a ref directory
export const deleteRefDir = async (collectionID: string) => {
  try {
    await removeDir(`${COLLECTIONS_DIR}/${collectionID}`, {
      dir: DATA_DIR,
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    error(`Error: Couldn't delete ${collectionID} directory`);
  }
};

/// Returns the text of a file
export const get_note_content = async (notepath: string) => {
  try {
    const content = await readTextFile(notepath);
    return content;
  } catch (e) {
    console.error(e);
    error(`Error: Failed to read the file at ${notepath}`);
    return 'Something went wrong';
  }
};

export const verifyExtension = async (extension: string) => {
  return (
    extension.toLowerCase() in SUPPORTED_FILES.map((file) => file.extensions)
  );
};

/// Search for Refs
export function searchExtended(refs: Ref[], searchText: string) {
  const fuseOpt: IFuseOptions<Ref> = {
    keys: ['metadata.name', 'metadata.tags'],
    threshold: 0.5,
  };

  const fuse = new Fuse(refs, fuseOpt);
  const results = fuse.search(searchText);

  return results.map((result) => result.item);
}

/// Get Breakpoints for the masonry
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

export const isMediaRef = (source: Ref): source is MediaRef => {
  return 'colors' in (source.metadata as any);
};

export const isMedia_Metadata = (
  source: Metadata | NoteMetadata,
): source is Metadata => {
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
