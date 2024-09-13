import type { Accessor, Resource } from 'solid-js';
import type { Ref } from '../../lib/types';

export interface BoardProps {
  collection: string;
  refs: Resource<Ref[]>;
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
