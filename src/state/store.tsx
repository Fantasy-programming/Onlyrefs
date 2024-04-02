import { onMount, createContext, ParentComponent, useContext } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { MediaRef, NoteRef, Ref, backendRef } from '~/lib/types';
import { invoke } from '@tauri-apps/api';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { getUpdatedAtTimestamp } from '~/lib/helper';

interface RootState {
  readonly ref: Ref[];
  refetchRefs: () => Promise<void>;
  mutateTag: (id: string, tags: string, type: 'add' | 'remove') => void;
  mutateName: (id: string, name: string) => void;
  mutateNote: (id: string, note: string) => void;
}

const Context = createContext<RootState>();

// A way to do this in hte backend would be cool
export const RefProvider: ParentComponent = (props) => {
  const [ref, setRef] = createStore<Ref[]>([]);

  onMount(async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');

      let parsedData: Ref[] = [];
      for (let i = 0; i < data.length; i++) {
        const ref = data[i];
        if ('Media' in ref) {
          const mediaref = ref.Media as MediaRef;
          const parsedRef: MediaRef = {
            ...mediaref,
            imagepath: convertFileSrc(mediaref.imagepath),
            low_res_imagepath: !Boolean(mediaref.low_res_imagepath)
              ? convertFileSrc(mediaref.imagepath)
              : convertFileSrc(mediaref.low_res_imagepath),
          };
          parsedData.push(parsedRef);
        } else {
          const noteref = ref.Note as NoteRef;
          const parsedRef: NoteRef = { ...noteref };
          parsedData.push(parsedRef);
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

  const mutateName = (id: string, name: string) => {
    setRef((meta) => meta.metadata.id === id, 'metadata', 'name', name);
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

  // move this to the backend
  const refetchRefs = async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');

      let parsedData: Ref[] = [];
      for (let i = 0; i < data.length; i++) {
        const ref = data[i];
        if ('Media' in ref) {
          const mediaref = ref.Media as MediaRef;
          const parsedRef: MediaRef = {
            ...mediaref,
            imagepath: convertFileSrc(mediaref.imagepath),
            low_res_imagepath: !Boolean(mediaref.low_res_imagepath)
              ? convertFileSrc(mediaref.imagepath)
              : convertFileSrc(mediaref.low_res_imagepath),
          };
          parsedData.push(parsedRef);
        } else {
          const noteref = ref.Note as NoteRef;
          const parsedRef: NoteRef = { ...noteref };
          parsedData.push(parsedRef);
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
    refetchRefs,
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
