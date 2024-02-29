import { SourceRef } from "../Board/Board.types.ts";
import { Accessor } from "solid-js";
import { FileEntry } from "@tauri-apps/api/fs";

export interface BoardItemProps {
  image: SourceRef;
  collection: string;
  collections: Accessor<FileEntry[]>;
  refresh: () => void;
  index: number;
}

export interface BoardItemType {
  image: SourceRef;
  index: number;
}

export interface RefContextMenuProps {
  collectionName: string;
  collections: Accessor<FileEntry[]>;
  refresh: () => void;
  refID: string | undefined;
}
