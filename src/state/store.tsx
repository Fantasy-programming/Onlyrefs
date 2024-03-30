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
}

const Context = createContext<RootState>();

export const RefProvider: ParentComponent = (props) => {
  const [ref, setRef] = createStore<Ref[]>([]);

  onMount(async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');

      let parsedData: Ref[] = data.map((ref) => {
        if ('Media' in ref) {
          const mediaref = ref.Media as MediaRef;
          return {
            ...mediaref,
            imagepath: convertFileSrc(mediaref.imagepath),
            low_res_imagepath:
              mediaref.low_res_imagepath === ''
                ? convertFileSrc(mediaref.imagepath)
                : convertFileSrc(mediaref.low_res_imagepath),
          } as MediaRef;
        } else {
          const noteref = ref.Note as NoteRef;
          return {
            ...noteref,
          } as NoteRef;
        }
      });

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
          tags = tags?.filter((tag) => tag !== tagname);
        }
      }),
    );
  };

  const mutateName = (id: string, name: string) => {
    setRef((meta) => meta.metadata.id === id, 'metadata', 'name', name);
  };

  const refetchRefs = async () => {
    try {
      let data: backendRef[] = await invoke('get_media_refs');

      let parsedData: Ref[] = data.map((ref) => {
        if ('Media' in ref) {
          const mediaref = ref.Media as MediaRef;
          return {
            ...mediaref,
            imagepath: convertFileSrc(mediaref.imagepath),
            low_res_imagepath:
              mediaref.low_res_imagepath === ''
                ? convertFileSrc(mediaref.imagepath)
                : convertFileSrc(mediaref.low_res_imagepath),
          } as MediaRef;
        } else {
          const noteref = ref.Note as NoteRef;
          return {
            ...noteref,
          } as NoteRef;
        }
      });

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
