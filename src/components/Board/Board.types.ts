import { Accessor } from "solid-js";

export interface BoardProps {
  collection: string;
  home?: boolean;
}

export interface ProgressionProps {
  total: number;
  completed: number;
}

export type useFileSelectorReturnType = [
  selectFrom: (collection: string) => Promise<void>,
  selectDrop: (collection: string, files: string[]) => Promise<void>,
  progress: Accessor<ProgressionProps>,
];
