import { Metadata, NoteMetadata } from '~/lib/types';

export interface ViewBoxInfoProps {
  metadata: Metadata | NoteMetadata;
  path: string;
  type: string;
}
