import { onMount, createContext, ParentComponent, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { MediaRef, NoteRef, Ref, backendRef } from '~/lib/types';
import { invoke } from '@tauri-apps/api';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { getUpdatedAtTimestamp } from '~/lib/helper';

const refStore = createStore<Ref[]>([]);

export const RefService = () => {
  const [ref, setRef] = refStore;

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

  const mutateTag = (id: string, tags: string, type: string) => {
    console.log('mutation');
    setRef((prev) => {
      const newrefs = prev.map((ref) => {
        if (ref.metadata.id === id) {
          if (type === 'add') {
            ref.metadata.tags?.push(tags);
          } else {
            ref.metadata.tags = ref?.metadata?.tags?.filter(
              (tag) => tag !== tags,
            );
          }
        }
        return ref;
      });
      return newrefs;
    });
  };

  const mutateName = (id: string, name: string) => {
    setRef((prev) => {
      const newrefs = prev.map((ref) => {
        if (ref.metadata.id === id) {
          console.log(ref.metadata.name, name);
          ref.metadata.name = name;
        }
        return ref;
      });
      return newrefs;
    });
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

  return { ref, refetchRefs, mutateTag, mutateName };
};

export type RootState = {
  refService: ReturnType<typeof RefService>;
};

const Context = createContext<RootState>({} as RootState);

export const useRefSelector = () => useContext(Context);

export const RefProvider: ParentComponent<{
  refService: ReturnType<typeof RefService>;
}> = (props) => {
  const rootState: RootState = {
    refService: props.refService,
  };

  return (
    <Context.Provider value={rootState}>{props.children}</Context.Provider>
  );
};
