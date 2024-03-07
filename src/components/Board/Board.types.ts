import { Accessor } from "solid-js";
import { MediaRef } from "../../lib/types";

export interface BoardProps {
  collection: string;
  refs: MediaRef[];
  home?: boolean;
}

export interface ProgressionProps {
  total: number;
  completed: number;
}

export type useFileSelectorReturnType = [
  selectFrom: (collection: string) => Promise<void>,
  selectDrop: (collection: string) => Promise<void>,
  progress: Accessor<ProgressionProps>,
];

export interface SourceRef {
  source: string;
  fileName: string | undefined;
}
