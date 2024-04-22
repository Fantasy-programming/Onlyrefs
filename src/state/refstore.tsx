import { onMount, createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { MediaRef, NoteRef, Ref, backendRef } from '~/lib/types';
import { invoke } from '@tauri-apps/api';
import { getUpdatedAtTimestamp } from '~/lib/helper';

export interface RootState {
  readonly ref: Ref[];
  addRef: (ref: Ref) => void;
  refetchRefs: () => Promise<void>;
  deleteRef: (id: string) => void;
  mutateTag: (id: string, tags: string, type: 'add' | 'remove') => void;
  mutateName: (id: string, name: string) => void;
  mutateNote: (id: string, note: string) => void;
}

const Context = createContext<RootState>();

export const RefProvider: ParentComponent = (props) => {
  const [ref, setRef] = createStore<Ref[]>([]);

  onMount(async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');
      let parsedData: Ref[] = [];

      for (let i = 0; i < data.length; i++) {
        const ref = data[i];

        if ('Media' in ref) {
          parsedData.push(ref.Media as MediaRef);
        } else {
          parsedData.push(ref.Note as NoteRef);
        }
      }

      parsedData = parsedData.sort((a, b) => {
        const aUpdatedAt = getUpdatedAtTimestamp(a);
        const bUpdatedAt = getUpdatedAtTimestamp(b);
        return bUpdatedAt - aUpdatedAt;
      });

      setRef(parsedData);
    } catch (e) {
      console.error(e);
    }
  });

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

  const addRef = (ref: MediaRef | NoteRef) => {
    setRef(produce((refs) => refs.push(ref)));
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
      'metadata',
      produce((metadata) => {
        if ('note_text' in metadata) {
          metadata.note_text = note;
        }
      }),
    );
  };

  const refetchRefs = async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');
      let parsedData: Ref[] = [];

      for (let i = 0; i < data.length; i++) {
        const ref = data[i];

        if ('Media' in ref) {
          parsedData.push(ref.Media as MediaRef);
        } else {
          parsedData.push(ref.Note as NoteRef);
        }
      }

      parsedData = parsedData.sort((a, b) => {
        const aUpdatedAt = getUpdatedAtTimestamp(a);
        const bUpdatedAt = getUpdatedAtTimestamp(b);
        return bUpdatedAt - aUpdatedAt;
      });

      setRef(parsedData);
    } catch (e) {
      console.error(e);
    }
  };

  const rootState = {
    get ref() {
      return ref;
    },
    addRef,
    refetchRefs,
    deleteRef,
    mutateTag,
    mutateName,
    mutateNote,
  };

  return (
    <Context.Provider value={rootState}>{props.children}</Context.Provider>
  );
};

export const useRefSelector = () => {
  const refSelector = useContext(Context);
  if (!refSelector) {
    throw new Error(
      'useRefSelectorContext should be called inside its ContextProvider',
    );
  }
  return refSelector;
};
