import { SourceRef } from '../Board/Board.types';
import { Ref } from '@/lib/types';
import type { Editor } from '@tiptap/core';

export interface BoardItemProps {
  refItem: Ref;
}

export interface BoardItemType {
  ref: SourceRef;
}

export interface RefContextMenuProps {
  type?: string;
  collectionName: string;
  refID: string;
}

export interface ControlProps {
  className: string;
  editor: Editor;
  title: string;
  key: string;
  onChange: () => void;
  isActive?: (editor: Editor) => boolean;
  children: React.ReactNode;
}

export interface ToolbarProps {
  editor: Editor;
}
