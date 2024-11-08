import { onMount, createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { NoteRef, Ref } from '~/lib/types';
import { invoke } from '@tauri-apps/api';
import { getUpdatedAtTimestamp } from '~/lib/helper';

export interface RootState {
  readonly ref: Ref[];
  addRef: (ref: Ref) => void;
  deleteRef: (id: string) => void;
  mutateTag: (id: string, tags: string, type: 'add' | 'remove') => void;
  mutateName: (id: string, name: string) => void;
  mutateNote: (id: string, note: string) => void;
  mutateNoteText: (id: string, note: string) => void;
}

const Context = createContext<RootState>();

export const RefProvider: ParentComponent = (props) => {
  const [ref, setRef] = createStore<Ref[]>([]);

  const fetchRefs = async () => {
    try {
      let data: Ref[] = await invoke('get_all_refs');
      data = data.sort((a, b) => {
        const aUpdatedAt = getUpdatedAtTimestamp(a);
        const bUpdatedAt = getUpdatedAtTimestamp(b);
        return bUpdatedAt - aUpdatedAt;
      });

      setRef(data);
    } catch (e) {
      throw new Error('Failed to fetch refs at RefProvider fetchRef');
    }
  };

  onMount(fetchRefs);

  const mutateTag = (id: string, tagname: string, type: string) => {
    setRef(
      (meta) => meta.metadata.id === id,
      'metadata',
      'tags',
      produce((tags) => {
        if (type === 'add') {
          tags?.push(tagname);
        }
        if (type === 'remove') {
          const index = tags?.indexOf(tagname);
          if (index !== -1 && index !== undefined) {
            tags?.splice(index, 1);
          }
        }
      }),
    );
  };

  const addRef = (ref: Ref) => {
    setRef(produce((refs) => refs.unshift(ref)));
  };

  const mutateName = (id: string, name: string) => {
    setRef((meta) => meta.metadata.id === id, 'metadata', 'name', name);
  };

  const deleteRef = (id: string) => {
    setRef(
      produce((ref) => {
        const index = ref.findIndex((ref) => ref.metadata.id == id);
        if (index !== -1 && index !== undefined) {
          ref.splice(index, 1);
        }
      }),
    );
  };

  const mutateNote = (id: string, note: string) => {
    setRef(
      (meta) => meta.metadata.id === id,
      produce((meta) => {
        if (meta.metadata.ref_type === 'note') {
          (meta as NoteRef).content = note;
        }
      }),
    );
  };

  const mutateNoteText = (id: string, note: string) => {
    setRef((meta) => meta.metadata.id === id, 'metadata', 'note_text', note);
  };

  const rootState = {
    get ref() {
      return ref;
    },
    addRef,
    deleteRef,
    mutateTag,
    mutateName,
    mutateNote,
    mutateNoteText,
  };

  return (
    <Context.Provider value={rootState}>{props.children}</Context.Provider>
  );
};

export const useRefSelector = () => {
  const refSelector = useContext(Context);
  if (!refSelector) {
    throw new Error(
      'useRefSelectorContext should be called inside RefProvider',
    );
  }
  return refSelector;
};
