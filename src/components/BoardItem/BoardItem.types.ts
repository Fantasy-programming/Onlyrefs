import { SourceRef } from '../Board/Board.types.ts';
import { Ref } from '~/lib/types.ts';
import type { Editor } from '@tiptap/core';
import { JSX } from 'solid-js';

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
  class: string;
  editor: Editor;
  title: string;
  key: string;
  onChange: () => void;
  isActive?: (editor: Editor) => boolean;
  children: JSX.Element;
}

export interface ToolbarProps {
  editor: Editor;
}
