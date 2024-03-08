import { SourceRef } from "../Board/Board.types.ts";
import { MediaRef } from "../../lib/types.ts";

export interface BoardItemProps {
  image: MediaRef;
  refresh: () => void;
}

export interface BoardItemType {
  image: SourceRef;
}

export interface RefContextMenuProps {
  collectionName: string;
  // collections: Accessor<FileEntry[]>;
  refresh: () => void;
  refID: string;
}
