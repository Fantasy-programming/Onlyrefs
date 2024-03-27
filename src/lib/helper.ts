import { exists, createDir, removeDir, readTextFile } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri';
import { differenceInSeconds, parse } from 'date-fns';

import {
  COLLECTIONS_DIR,
  DATA_DIR,
  breakpoints_4,
  breakpoints_5,
  breakpoints_6,
} from './config';
import { Ref } from './types';
import { appDataDir, join } from '@tauri-apps/api/path';

/// Check if a ref with the given id exists
export const refExist = async (collectionName: string) => {
  return exists(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: DATA_DIR,
  });
};

// Create a new ref directory
export const createRefDir = async (collectionName: string) => {
  await createDir(`${COLLECTIONS_DIR}/${collectionName}`, {
    dir: DATA_DIR,
    recursive: true,
  });
};

// Delete a ref with its metadata
export const deleteRef = async (collectionID: string) => {
  await invoke('remove_ref', { refId: collectionID });

  await removeDir(`${COLLECTIONS_DIR}/${collectionID}`, {
    dir: DATA_DIR,
    recursive: true,
  });
};

interface GenerateID {
  lenght: number;
  createDir?: boolean;
}

export const create_note_ref = async (
  collectionName: string,
  content: string,
) => {
  const destDir = await join(await appDataDir(), 'collections');
  const noteID = await generate_id({ lenght: 13, createDir: true });

  const notepath = await join(destDir, noteID, 'note.md');
  const notedir = await join(destDir, noteID);

  await invoke('generate_note_metadata', {
    refId: noteID,
    collection: collectionName,
    notePath: notepath,
    noteDir: notedir,
    noteContent: content,
  });

  console.log('Note created');
};

export const get_note_content = async (notepath: string) => {
  const content = await readTextFile(notepath);
  return content;
};

export const generate_id = async ({
  lenght,
  createDir = false,
}: GenerateID) => {
  let randomID: string = '';

  while (true) {
    randomID = await invoke('generate_id', { lenght: lenght });
    const exist = await refExist(randomID);

    if (!exist) {
      if (createDir) {
        await createRefDir(randomID);
      }
      break;
    }
  }
  return randomID;
};

export function searchByText(refs: Ref[], searchText: string) {
  // Convert searchText to lowercase
  const lowercaseSearchText = searchText.toLowerCase();

  // Use filter to find objects that have matching text in name or tags
  const results = refs.filter((ref) => {
    // Convert object name to lowercase
    // TODO: Fix the search
    const lowercaseObjectName = ref.metadata.name.toLowerCase();
    const lowercaseObjectTags = ref.metadata.tags?.map((tag) =>
      tag.toLowerCase(),
    );

    // Check if searchText characters are present in the same order in the object name or any tag
    const matchesName = containsCharsInOrder(
      lowercaseObjectName,
      lowercaseSearchText,
    );
    const matchesTags = lowercaseObjectTags?.some((tag) =>
      containsCharsInOrder(tag, lowercaseSearchText),
    );

    return matchesName || matchesTags;
  });

  return results;
}

function containsCharsInOrder(str: string, searchStr: string) {
  let searchIndex = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === searchStr[searchIndex]) {
      searchIndex++;
    }
    if (searchIndex === searchStr.length) {
      return true;
    }
  }
  return false;
}

export const changRefName = async (refID: string, newName: string) => {
  await invoke('rename_ref', { refID, newName });
};

export const deleteTag = async (refID: string, tag: string) => {
  await invoke('remove_tag', { refId: refID, tag: tag });
};

export const addTag = async (refID: string, tag: string) => {
  await invoke('add_tag', { refId: refID, tag: tag });
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
