import { onMount, createContext, ParentComponent, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MediaRef } from "../lib/types";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";

const refStore = createStore<MediaRef[]>([]);

export const RefService = () => {
  const [ref, setRef] = refStore;

  onMount(async () => {
    let data: MediaRef[] = await invoke("get_media_refs");
    data = data.map((ref) => {
      return {
        ...ref,
        imagepath: convertFileSrc(ref.imagepath),
        low_res_imagepath:
          ref.low_res_imagepath === ""
            ? convertFileSrc(ref.imagepath)
            : convertFileSrc(ref.low_res_imagepath),
      };
    });

    setRef(data);
  });

  const refetchRefs = async () => {
    let data: MediaRef[] = await invoke("get_media_refs");
    data = data.map((ref) => {
      return {
        ...ref,
        imagepath: convertFileSrc(ref.imagepath),
        low_res_imagepath:
          ref.low_res_imagepath === ""
            ? convertFileSrc(ref.imagepath)
            : convertFileSrc(ref.low_res_imagepath),
      };
    });
    setRef(data);
  };

  return { ref, refetchRefs };
};

// Context Stuff

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
