import { SourceRef } from '../Board/Board.types.ts';
import { MediaRef } from '~/lib/types.ts';

export interface BoardItemProps {
  image: MediaRef;
}

export interface BoardItemType {
  image: SourceRef;
}

export interface RefContextMenuProps {
  collectionName: string;
  refID: string;
  // collections: Accessor<FileEntry[]>;
}
