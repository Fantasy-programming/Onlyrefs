import { invoke } from '@tauri-apps/api/core';
import { deleteRefDir } from './helper';
import {
  Ref,
  GenerateID,
  NoteRef,
  ImageRef,
  VideoRef,
  DocRef,
  AudioRef,
  LinkRef,
  StackRef,
  DesignRef,
  ModelRef,
  CanvasData,
  Board,
  Canvas,
} from './types';
import { emit } from '@tauri-apps/api/event';

export const createImageRef = async (
  imagePath: string,
  fileName: string,
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: ImageRef = await invoke('generate_image_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: imagePath,
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
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: VideoRef = await invoke('generate_video_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: videoPath,
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
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: AudioRef = await invoke('generate_audio_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: audioPath,
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
  boardId: string | null = null,
  content: string,
) => {
  try {
    const noteID = generate_id({ length: 13 });

    const data: NoteRef = await invoke('generate_note_metadata', {
      refId: noteID,
      boardId: boardId,
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
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: DocRef = await invoke('generate_doc_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: docPath,
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

export const createLinkRef = async (
  url: string,
  boardId: string | null = null,
) => {
  const linkID = generate_id({ length: 13 });

  const data: LinkRef = await invoke('generate_link_metadata', {
    refId: linkID,
    url,
    boardId: boardId,
  });

  if (data) {
    emit('ref_added', data);
  }

  return data;
};

export const createDesignRef = async (
  designPath: string,
  fileName: string,
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: DesignRef = await invoke('generate_design_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: designPath,
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

export const createModelRef = async (
  modelPath: string,
  fileName: string,
  boardId: string | null = null,
): Promise<Ref | null> => {
  try {
    const mediaID = generate_id({ length: 13 });

    const data: ModelRef = await invoke('generate_model_metadata', {
      refId: mediaID,
      fileName: fileName,
      boardId: boardId,
      sourcePath: modelPath,
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

/// Change the collection of a ref (legacy - use setBoardId instead)
export const setCollection = async (
  id: string,
  path: string,
  _collection: string,
) => {
  // Convert collection string to board_id = null for backward compatibility
  // This function is deprecated - use setBoardId
  try {
    await invoke('set_board_id', {
      refId: id,
      path: path,
      boardId: null,
    });
  } catch (e) {
    console.error(e);
  }
};

/// Set the board_id of a ref
export const setBoardId = async (
  id: string,
  path: string,
  boardId: string | null,
) => {
  try {
    await invoke('set_board_id', {
      refId: id,
      path: path,
      boardId: boardId,
    });
  } catch (e) {
    console.error(e);
  }
};

/// Set the rating of a ref (0-5 stars)
export const setRating = async (id: string, path: string, rating: number) => {
  try {
    await invoke('set_rating', {
      refId: id,
      path: path,
      rating: Math.min(5, Math.max(0, rating)),
    });
  } catch (e) {
    console.error(e);
  }
};

/// Set the source_url of a ref
export const setSourceUrl = async (
  id: string,
  path: string,
  url: string | null,
) => {
  try {
    await invoke('set_source_url', {
      refId: id,
      path: path,
      url: url,
    });
  } catch (e) {
    console.error(e);
  }
};

/// Generate a unique random id locally (no IPC calls)
export const generate_id = ({ length }: GenerateID): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const timestamp = Date.now().toString(36).toUpperCase(); // Add timestamp component for uniqueness
  const randomPart = length - Math.min(timestamp.length, 5);

  // Add random characters
  for (let i = 0; i < randomPart; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Add timestamp suffix for uniqueness (last 5 chars)
  result += timestamp.slice(-5);

  return result.slice(0, length);
};

// ============= Stack Commands =============

export const createStack = async (
  refIds: string[],
  boardId: string | null = null,
): Promise<StackRef | null> => {
  try {
    const data: StackRef = await invoke('create_stack', { refIds, boardId });
    if (data) {
      emit('ref_added', data);
    }
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const addToStack = async (
  stackId: string,
  refIds: string[],
): Promise<void> => {
  try {
    await invoke('add_to_stack', { stackId, refIds });
  } catch (e) {
    console.error(e);
  }
};

export const removeFromStack = async (
  stackId: string,
  refIds: string[],
): Promise<void> => {
  try {
    await invoke('remove_from_stack', { stackId, refIds });
  } catch (e) {
    console.error(e);
  }
};

export const unstack = async (stackId: string): Promise<void> => {
  try {
    await invoke('unstack', { stackId });
  } catch (e) {
    console.error(e);
  }
};

export const setStackCover = async (
  stackId: string,
  coverId: string,
): Promise<void> => {
  try {
    await invoke('set_stack_cover', { stackId, coverId });
  } catch (e) {
    console.error(e);
  }
};

// ============= Board Commands =============

/**
 * Get all boards
 */
export const getBoards = async (): Promise<Board[]> => {
  try {
    return await invoke('get_boards');
  } catch (e) {
    console.error('Failed to get boards:', e);
    return [];
  }
};

/**
 * Create a new board
 */
export const createBoard = async (
  name: string,
  parentId: string | null = null,
): Promise<Board | null> => {
  try {
    return await invoke('create_board', { name, parentId });
  } catch (e) {
    console.error('Failed to create board:', e);
    throw e;
  }
};

/**
 * Rename a board
 */
export const renameBoard = async (
  boardId: string,
  newName: string,
): Promise<void> => {
  try {
    await invoke('rename_board', { boardId, newName });
  } catch (e) {
    console.error('Failed to rename board:', e);
    throw e;
  }
};

/**
 * Update a board's color
 */
export const updateBoardColor = async (
  boardId: string,
  color: string | null,
): Promise<void> => {
  try {
    await invoke('update_board_color', { boardId, color });
  } catch (e) {
    console.error('Failed to update board color:', e);
    throw e;
  }
};

/**
 * Move a board to a new parent
 */
export const moveBoard = async (
  boardId: string,
  newParentId: string | null,
): Promise<void> => {
  try {
    await invoke('move_board', { boardId, newParentId });
  } catch (e) {
    console.error('Failed to move board:', e);
    throw e;
  }
};

/**
 * Delete a board (moves refs to parent)
 */
export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    await invoke('delete_board', { boardId });
  } catch (e) {
    console.error('Failed to delete board:', e);
    throw e;
  }
};

/**
 * Get all descendant board IDs for filtering
 */
export const getBoardDescendants = async (
  boardId: string,
): Promise<string[]> => {
  try {
    return await invoke('get_board_descendants', { boardId });
  } catch (e) {
    console.error('Failed to get board descendants:', e);
    return [];
  }
};

// ============= Independent Canvas Commands =============

/**
 * Get all canvases
 */
export const getCanvases = async (): Promise<Canvas[]> => {
  try {
    return await invoke('get_canvases');
  } catch (e) {
    console.error('Failed to get canvases:', e);
    return [];
  }
};

/**
 * Create a new independent canvas
 */
export const createIndependentCanvas = async (
  name: string,
): Promise<Canvas | null> => {
  try {
    return await invoke('create_canvas', { name });
  } catch (e) {
    console.error('Failed to create canvas:', e);
    throw e;
  }
};

/**
 * Rename a canvas
 */
export const renameIndependentCanvas = async (
  canvasId: string,
  newName: string,
): Promise<void> => {
  try {
    await invoke('rename_canvas', { canvasId, newName });
  } catch (e) {
    console.error('Failed to rename canvas:', e);
    throw e;
  }
};

/**
 * Delete an independent canvas
 */
export const deleteIndependentCanvas = async (
  canvasId: string,
): Promise<void> => {
  try {
    await invoke('delete_independent_canvas', { canvasId });
  } catch (e) {
    console.error('Failed to delete canvas:', e);
    throw e;
  }
};

/**
 * Load canvas data for an independent canvas
 */
export const loadIndependentCanvas = async (
  canvasId: string,
): Promise<CanvasData> => {
  try {
    return await invoke('load_independent_canvas', { canvasId });
  } catch (e) {
    console.error('Failed to load independent canvas:', e);
    // Return default canvas data on error
    return {
      version: 1,
      items: [],
      frames: [],
      annotations: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      settings: {
        style: 'minimal',
        showGrid: false,
        snapToGrid: false,
        gridSize: 20,
        showGuides: true,
      },
    };
  }
};

/**
 * Save canvas data for an independent canvas
 */
export const saveIndependentCanvas = async (
  canvasId: string,
  data: CanvasData,
): Promise<void> => {
  try {
    await invoke('save_independent_canvas', { canvasId, data });
  } catch (e) {
    console.error('Failed to save independent canvas:', e);
    throw e;
  }
};
