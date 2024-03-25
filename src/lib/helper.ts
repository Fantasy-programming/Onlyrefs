import { exists, createDir, removeDir } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri';

import {
  COLLECTIONS_DIR,
  DATA_DIR,
  breakpoints_4,
  breakpoints_5,
  breakpoints_6,
} from './config';
import { MediaRef } from './types';

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

export function searchByText(refs: MediaRef[], searchText: string) {
  // Convert searchText to lowercase
  const lowercaseSearchText = searchText.toLowerCase();

  // Use filter to find objects that have matching text in name or tags
  const results = refs.filter((ref) => {
    // Convert object name to lowercase
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
