import { onCleanup } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import { UnlistenFn } from '@tauri-apps/api/event';
import {
  addRefs,
  deleteRef,
  mutateName,
  mutateNote,
  mutateNoteText,
  mutateTag,
} from '~/resources/refs.resource';
import refService from '~/services/refs.service';
import { Ref, changeNameEvent, changeNoteEvent, tagEvent } from '~/lib/types';

export function useEventListeners() {
  let unlisteners: UnlistenFn[] = [];

  const setupListeners = async () => {
    try {
      unlisteners.push(
        await listen('deleteRef', (event) => {
          refService.deleteRef(event.payload as string);
          deleteRef(event.payload as string);
        }),
      );

      unlisteners.push(
        await listen('ref_added', (event) => {
          addRefs(event.payload as Ref);
        }),
      );

      unlisteners.push(
        await listen('ref_name_changed', (event) => {
          const { id, name, path } = event.payload as changeNameEvent;
          refService.renameRef(id, name, path);
          mutateName(id, name);
        }),
      );

      unlisteners.push(
        await listen('note_changed', (event) => {
          const { id, path, content } = event.payload as changeNoteEvent;
          refService.mutateNote(id, path, content);
          mutateNote(id, content);
        }),
      );

      unlisteners.push(
        await listen('note_text_changed', (event) => {
          const { id, path, content } = event.payload as changeNoteEvent;
          refService.mutateNoteText(id, path, content);
          mutateNoteText(id, content);
        }),
      );

      unlisteners.push(
        await listen('tag_added', (event) => {
          const { id, path, tag } = event.payload as tagEvent;
          refService.addTag(id, path, tag);
          mutateTag(id, tag, 'add');
        }),
      );

      unlisteners.push(
        await listen('tag_removed', (event) => {
          const { id, path, tag } = event.payload as tagEvent;
          refService.removeTag(id, path, tag);
          mutateTag(id, tag, 'remove');
        }),
      );
    } catch (e) {
      console.error('Error setting up listeners:', e);
      throw e;
    }
  };

  setupListeners();

  onCleanup(() => {
    unlisteners.forEach((unlistener) => unlistener());
  });
}
