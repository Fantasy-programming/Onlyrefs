import { onMount, createContext, ParentComponent, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MediaRef } from "../lib/types";
import { fetchRefs } from "../lib/helper";

const refStore = createStore<MediaRef[]>([]);

export const RefService = () => {
  const [ref, setRef] = refStore;

  onMount(async () => {
    const data = await fetchRefs();
    setRef(data);
  });

  const refetchRefs = async () => {
    const data = await fetchRefs();
    setRef(data);
  };

  return { ref, refetchRefs };
};

// Context Stuff

export type RootState = {
  refService: ReturnType<typeof RefService>;
};

const initialState: RootState = {
  refService: RefService(),
};

const Context = createContext<RootState>(initialState);

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
