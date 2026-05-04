import { useState, useEffect } from 'react';
import {
  exists,
  mkdir,
  readTextFile,
  copyFile,
  remove,
} from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
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
  ImageMetadata,
  ImageRef,
  Ref,
  RefMeta,
  Reftype,
  contextItemType,
} from './types';
import { appDataDir, downloadDir, join } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';

// Filter state interface (matches TopBar's FilterState)
export interface FilterState {
  tags: string[];
  types: Reftype[];
  boardIds: string[]; // Board IDs to filter by (includes descendants)
  tagLogic: 'and' | 'or';
}

/// Convert a file path to an asset URL using Tauri's convertFileSrc
export const toAssetUrl = (filePath: string): string => {
  if (!filePath) return '';
  return convertFileSrc(filePath);
};

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

/// Apply filters to refs array
export function applyFilters(refs: Ref[], filters: FilterState): Ref[] {
  if (!refs || refs.length === 0) return [];

  let result = refs;

  // Filter by types
  if (filters.types.length > 0) {
    result = result.filter((ref) =>
      filters.types.includes(ref.metadata.ref_type as Reftype),
    );
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    result = result.filter((ref) => {
      const refTags = ref.metadata.tags || [];
      if (filters.tagLogic === 'and') {
        // All selected tags must be present
        return filters.tags.every((tag) => refTags.includes(tag));
      } else {
        // Any selected tag must be present (OR logic)
        return filters.tags.some((tag) => refTags.includes(tag));
      }
    });
  }

  // Filter by boards
  if (filters.boardIds.length > 0) {
    result = result.filter((ref) => {
      const refBoardId = ref.metadata.board_id;
      // Include ref if its board_id matches any of the selected boards (or descendants)
      return refBoardId && filters.boardIds.includes(refBoardId);
    });
  }

  return result;
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

// Debounce function for resize events
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): [number, number] {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Debounced version - only update after user stops resizing for 150ms
    const debouncedHandleResize = debounce(handleResize, 150);

    // Add event listener
    window.addEventListener('resize', debouncedHandleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, []); // Empty array ensures effect runs only on mount and unmount

  return [windowSize.width, windowSize.height];
}
