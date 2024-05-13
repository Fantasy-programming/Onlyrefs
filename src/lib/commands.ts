import { error, info } from 'tauri-plugin-log-api';
import { invoke } from '@tauri-apps/api';
import {
  createRefDir,
  deleteRefDir,
  refExist,
  verifyExtension,
} from './helper';
import { MediaRef, GenerateID, NoteRef, Reftype } from './types';
import { copyFile } from '@tauri-apps/api/fs';
import { appDataDir, join, sep } from '@tauri-apps/api/path';
import { COLLECTIONS_DIR } from './config';
import { emit } from '@tauri-apps/api/event';

export const createMediaRef = async (
  mediaPath: string,
  collectionName: string,
): Promise<MediaRef | null> => {
  try {
    const segments = mediaPath.split(sep);
    const fileName = segments[segments.length - 1];
    const extension = fileName.split('.').pop();

    if (!extension) {
      error('Error: File has no extension');
      return null;
    }

    if (!verifyExtension(extension)) {
      info('Error: File extensino not supported');
      return null;
    }

    const mediaID = await generate_id({ lenght: 13, createDir: true });
    const destPath = await join(
      await appDataDir(),
      COLLECTIONS_DIR,
      mediaID,
      fileName,
    );

    await copyFile(mediaPath, destPath);

    const data: MediaRef = await invoke('generate_media_metadata', {
      refId: mediaID,
      fileName: fileName,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    error(
      `Error: Failed to create new media ref for file ${mediaPath} - ${e} `,
    );
    console.error(e);
    return null;
  }
};

export const createNoteRef = async (
  collectionName: string,
  content: string,
) => {
  try {
    const noteID = await generate_id({ lenght: 13, createDir: true });

    const data: NoteRef = await invoke('generate_note_metadata', {
      refId: noteID,
      collection: collectionName,
      noteContent: content,
    });

    if (data) {
      emit('ref_added', data);
    }
  } catch (e) {
    error(`Error: Failed to create new note ref - ${e} `);
    console.error(e);
  }
};

/// Change the name of a ref
export const renameRef = async (
  refID: string,
  newName: string,
  path: string,
  type: Reftype,
) => {
  try {
    await invoke('rename_ref', {
      refId: refID,
      path,
      newName: newName,
      refType: type,
    });
  } catch (e) {
    error(
      `Error: Failed rename_ref operation for the ref with id ${refID} - ${e}`,
    );
    console.error(e);
  }
};

// Delete a ref with its metadata
export const deleteRef = async (collectionID: string) => {
  try {
    await invoke('remove_ref', { refId: collectionID });
    await deleteRefDir(collectionID);
  } catch (e) {
    error(`Error: Failed to delete ref with id ${collectionID} - ${e} `);
    console.error(e);
  }
};

/// Add a tag to a ref
export const addTag = async (
  id: string,
  path: string,
  type: Reftype,
  tag: string,
) => {
  try {
    await invoke('add_tag', { refId: id, path, refType: type, tag: tag });
  } catch (e) {
    error(`Error: Failed add_tag operation for the ref with id ${id} - ${e}`);
    console.error(e);
  }
};

/// Remove the tag of a ref
export const removeTag = async (
  id: string,
  path: string,
  type: Reftype,
  tag: string,
) => {
  try {
    await invoke('remove_tag', {
      refId: id,
      path: path,
      refType: type,
      tag: tag,
    });
  } catch (e) {
    error(
      `Error: Failed remove_tag operation for the ref with id ${id} - ${e}`,
    );
    console.error(e);
  }
};

/// Change the content of a note
export const mutateNote = async (
  noteID: string,
  path: string,
  content: string,
) => {
  try {
    await invoke('change_note_content', {
      refId: noteID,
      path: path,
      noteContent: content,
      refType: 'note',
    });
  } catch (e) {
    error(
      `Error: Failed mutate_note operation for the ref with id ${noteID} - ${e}`,
    );
    console.error(e);
  }
};

/// Generate a nonexistent random id
export const generate_id = async ({
  lenght,
  createDir = false,
}: GenerateID) => {
  let randomID: string = '';

  while (true) {
    try {
      randomID = await invoke('generate_id', { lenght: lenght });
      const exist = await refExist(randomID);

      if (!exist) {
        if (createDir) {
          await createRefDir(randomID);
        }
        break;
      }
    } catch (e) {
      error(`Error: Failed to generate_id`);
      console.error(e);
    }
  }

  return randomID;
};
