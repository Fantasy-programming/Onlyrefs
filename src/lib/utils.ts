import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  addTag,
  mutateNote,
  renameRef,
  deleteRef,
  removeTag,
  mutateNoteText,
} from './commands';
import { RootState } from '~/state/refstore';
import { Ref, changeNameEvent, changeNoteEvent, tagEvent } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanState() {
  if (window.location.hostname !== 'tauri.localhost') {
    return;
  }

  document.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault();
      return false;
    },
    { capture: true },
  );
}

export async function setupListeners(root: RootState): Promise<UnlistenFn[]> {
  const unlisteners: UnlistenFn[] = [];

  try {
    const deleteRefListener = await listen('deleteRef', (event) => {
      deleteRef(event.payload as string);
      root.deleteRef(event.payload as string);
    });

    unlisteners.push(deleteRefListener);

    const refAddedListener = await listen('ref_added', (event) => {
      root.addRef(event.payload as Ref);
    });

    unlisteners.push(refAddedListener);

    const refNameChangedListener = await listen('ref_name_changed', (event) => {
      const values = event.payload as changeNameEvent;
      renameRef(values.id, values.name, values.path);
      root.mutateName(values.id, values.name);
    });

    unlisteners.push(refNameChangedListener);

    const noteChangedListener = await listen('note_changed', (event) => {
      const values = event.payload as changeNoteEvent;
      mutateNote(values.id, values.path, values.content);
      root.mutateNote(values.id, values.content);
    });

    unlisteners.push(noteChangedListener);

    const noteTextChangedListener = await listen(
      'note_text_changed',
      (event) => {
        const values = event.payload as changeNoteEvent;
        mutateNoteText(values.id, values.path, values.content);
        root.mutateNoteText(values.id, values.content);
      },
    );

    unlisteners.push(noteTextChangedListener);

    const tagAddedListener = await listen('tag_added', (event) => {
      const values = event.payload as tagEvent;
      addTag(values.id, values.path, values.tag);
      root.mutateTag(values.id, values.tag, 'add');
    });

    unlisteners.push(tagAddedListener);

    const tagRemovedListener = await listen('tag_removed', (event) => {
      const values = event.payload as tagEvent;
      removeTag(values.id, values.path, values.tag);
      root.mutateTag(values.id, values.tag, 'remove');
    });

    unlisteners.push(tagRemovedListener);
  } catch (e) {
    console.error(e);
    throw e;
  }

  return unlisteners;
}
