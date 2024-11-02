import { copyFile } from '@tauri-apps/plugin-fs';
import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

import { createRefDir, deleteRefDir, makepath } from '@/lib/helper';
import { refExist, getUpdatedAtTimestamp } from '@/lib/helper';

import { Ref, NoteRef, ImageRef, VideoRef, AudioRef } from '@/lib/types';
import { GenerateID, DocRef, LinkRef } from '@/lib/types';

const getRefs = async (): Promise<Ref[]> => {
  try {
    const data: Ref[] = await invoke('get_all_refs');

    // Sort the data and returns it
    return [...data].sort((a, b) => {
      const aUpdatedAt = getUpdatedAtTimestamp(a);
      const bUpdatedAt = getUpdatedAtTimestamp(b);
      return bUpdatedAt - aUpdatedAt;
    });
  } catch (e) {
    throw new Error('Failed to fetch refs at RefProvider fetchRef');
  }
};

const createImageRef = async (
  imagePath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref> => {
  try {
    const mediaID = await generate_id({ lenght: 13, createDir: true });
    const destPath = await makepath(mediaID, fileName);
    await copyFile(imagePath, destPath);

    const data: ImageRef = await invoke('generate_image_metadata', {
      refId: mediaID,
      fileName: fileName,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    console.error(e);
    throw new Error('failed ot create an image ref');
  }
};

// Create a videoRef on the backend
const createVideoRef = async (
  videoPath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref> => {
  try {
    const mediaID = await generate_id({ lenght: 13, createDir: true });
    const destPath = await makepath(mediaID, fileName);
    await copyFile(videoPath, destPath);

    const data: VideoRef = await invoke('generate_video_metadata', {
      refId: mediaID,
      fileName: fileName,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    console.error(e);
    throw new Error('failed to create an video ref');
  }
};

// Create an audioRef on the backend
const createAudioRef = async (
  audioPath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref | null> => {
  try {
    const mediaID = await generate_id({ lenght: 13, createDir: true });
    const destPath = await makepath(mediaID, fileName);
    await copyFile(audioPath, destPath);

    const data: AudioRef = await invoke('generate_audio_metadata', {
      refId: mediaID,
      fileName: fileName,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    console.error(e);
    throw new Error('failed to create an audio ref');
  }
};

// Create a note ref on the backend
const createNoteRef = async (collectionName: string, content: string) => {
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
    console.error(e);
    throw new Error('failed to create an note ref');
  }
};

// Create a document ref on the backend
const createDocumentRef = async (
  docPath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref | null> => {
  try {
    const mediaID = await generate_id({ lenght: 13, createDir: true });
    const destPath = await makepath(mediaID, fileName);
    await copyFile(docPath, destPath);

    const data: DocRef = await invoke('generate_audio_metadata', {
      refId: mediaID,
      fileName: fileName,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    console.error(e);
    throw new Error('failed to create an document ref');
  }
};

// Create a link ref on the backend
const createLinkRef = async (url: string, collectionName: string) => {
  try {
    const linkID = await generate_id({ lenght: 13, createDir: true });
    const data: LinkRef = await invoke('generate_link_metadata', {
      refId: linkID,
      url,
      collection: collectionName,
    });

    if (data) {
      emit('ref_added', data);
    }

    return data;
  } catch (e) {
    console.error(e);
    throw new Error('failed to create an video ref');
  }
};

/// Change the name of a ref
const renameRef = async (refID: string, newName: string, path: string) => {
  try {
    await invoke('rename_ref', {
      refId: refID,
      path,
      newName: newName,
    });
  } catch (e) {
    console.error(e);
    throw new Error('failed to rename ref');
  }
};

/// Change the content of a note
const mutateNote = async (noteID: string, path: string, content: string) => {
  try {
    console.log('here');
    await invoke('change_note_content', {
      refId: noteID,
      path: path,
      noteContent: content,
    });
  } catch (e) {
    console.error(e);
    throw new Error('failed to mutate note ref');
  }
};

///??
const mutateNoteText = async (id: string, path: string, text: string) => {
  try {
    await invoke('change_note_text', {
      refId: id,
      path: path,
      noteText: text,
    });
  } catch (e) {
    console.error(e);
    throw new Error('failed to mutate note ref text');
  }
};

/// Remove the tag of a ref
const removeTag = async (id: string, path: string, tag: string) => {
  try {
    await invoke('remove_tag', {
      refId: id,
      path: path,
      tag: tag,
    });
  } catch (e) {
    console.error(e);
    throw new Error('failed to remove ref tags');
  }
};

/// Generate a nonexistent random id
const generate_id = async ({ lenght, createDir = false }: GenerateID) => {
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
      console.error(e);
      throw new Error('failed to generate id');
    }
  }

  return randomID;
};

// Delete a ref with its metadata
const deleteRef = async (collectionID: string) => {
  try {
    await invoke('remove_ref', { refId: collectionID });
    await deleteRefDir(collectionID);
  } catch (e) {
    console.error(e);
    throw new Error('failed to delete ref');
  }
};

/// Add a tag to a ref
const addTag = async (id: string, path: string, tag: string) => {
  try {
    await invoke('add_tag', { refId: id, path, tag: tag });
  } catch (e) {
    console.error(e);
    throw new Error('failed to craet a new ref');
  }
};

export default {
  getRefs,
  createImageRef,
  createVideoRef,
  createNoteRef,
  createAudioRef,
  createLinkRef,
  createDocumentRef,
  addTag,
  mutateNote,
  removeTag,
  mutateNoteText,
  deleteRef,
  renameRef,
};
