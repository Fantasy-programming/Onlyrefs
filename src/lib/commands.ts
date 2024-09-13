import { invoke } from '@tauri-apps/api';
import { createRefDir, deleteRefDir, makepath, refExist } from './helper';
import {
  Ref,
  GenerateID,
  NoteRef,
  ImageRef,
  VideoRef,
  DocRef,
  AudioRef,
  LinkRef,
} from './types';
import { copyFile } from '@tauri-apps/api/fs';
import { emit } from '@tauri-apps/api/event';

export const createImageRef = async (
  imagePath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref | null> => {
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
    return null;
  }
};

export const createVideoRef = async (
  videoPath: string,
  fileName: string,
  collectionName: string,
): Promise<Ref | null> => {
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
    return null;
  }
};

export const createAudioRef = async (
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
    console.error(e);
  }
};

export const createDocumentRef = async (
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
    return null;
  }
};

export const createLinkRef = async (url: string, collectionName: string) => {
  const linkID = await generate_id({ lenght: 13, createDir: true });

  console.log('here');
  const data: LinkRef = await invoke('generate_link_metadata', {
    refId: linkID,
    url,
    collection: collectionName,
  });

  if (data) {
    emit('ref_added', data);
  }

  return data;
};

/// Change the name of a ref
export const renameRef = async (
  refID: string,
  newName: string,
  path: string,
) => {
  try {
    await invoke('rename_ref', {
      refId: refID,
      path,
      newName: newName,
    });
  } catch (e) {
    console.error(e);
  }
};

// Delete a ref with its metadata
export const deleteRef = async (collectionID: string) => {
  try {
    await invoke('remove_ref', { refId: collectionID });
    await deleteRefDir(collectionID);
  } catch (e) {
    console.error(e);
  }
};

/// Add a tag to a ref
export const addTag = async (id: string, path: string, tag: string) => {
  try {
    await invoke('add_tag', { refId: id, path, tag: tag });
  } catch (e) {
    console.error(e);
  }
};

/// Remove the tag of a ref
export const removeTag = async (id: string, path: string, tag: string) => {
  try {
    await invoke('remove_tag', {
      refId: id,
      path: path,
      tag: tag,
    });
  } catch (e) {
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
    console.log('here');
    await invoke('change_note_content', {
      refId: noteID,
      path: path,
      noteContent: content,
    });
  } catch (e) {
    console.error(e);
  }
};

export const mutateNoteText = async (
  id: string,
  path: string,
  text: string,
) => {
  try {
    await invoke('change_note_text', {
      refId: id,
      path: path,
      noteText: text,
    });
  } catch (e) {
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
      console.error(e);
    }
  }

  return randomID;
};
