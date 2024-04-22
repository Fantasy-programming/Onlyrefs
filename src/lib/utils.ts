import { listen } from '@tauri-apps/api/event';
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  addTag,
  changeNoteContent,
  changeRefName,
  deleteRef,
  deleteTag,
} from './helper';
import { RootState } from '~/state/refstore';
import { Ref, changeNameEvent, changeNoteEvent, tagEvent } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function disableMenu() {
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
  // document.addEventListener(
  //   'selectstart',
  //   (e) => {
  //     e.preventDefault();
  //     return false;
  //   },
  //   { capture: true },
  // );
}

export function setupListeners(root: RootState) {
  listen('deleteRef', (event) => {
    deleteRef(event.payload as string);
    root.deleteRef(event.payload as string);
  });

  listen('ref_added', (event) => {
    root.addRef(event.payload as Ref);
  });

  listen('ref_name_changed', (event) => {
    const values = event.payload as changeNameEvent;
    changeRefName(values.id, values.name, values.path, values.type);
    root.mutateName(values.id, values.name);
  });

  listen('note_changed', (event) => {
    const values = event.payload as changeNoteEvent;
    changeNoteContent(values.id, values.path, values.content);
    root.mutateNote(values.id, values.content);
  });

  listen('tag_added', (event) => {
    const values = event.payload as tagEvent;
    addTag(values.id, values.path, values.type, values.tag);
    root.mutateTag(values.id, values.tag, 'add');
  });

  listen('tag_removed', (event) => {
    const values = event.payload as tagEvent;
    deleteTag(values.id, values.path, values.type, values.tag);
    root.mutateTag(values.id, values.tag, 'remove');
  });
}
