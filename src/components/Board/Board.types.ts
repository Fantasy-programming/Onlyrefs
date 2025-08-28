import type { Ref } from '../../lib/types';

export interface BoardProps {
  collection: string;
  refs: Ref[];
  home?: boolean;
}

export interface ProgressionProps {
  total: number;
  completed: number;
}

export type useFileSelectorReturnType = [
  selectFrom: (collection: string) => Promise<void>,
  selectDrop: (collection: string) => Promise<void>,
  progress: ProgressionProps,
];

export interface SourceRef {
  source: string;
  fileName: string | undefined;
}
