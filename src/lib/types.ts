import { ContextMenu } from 'tauri-plugin-context-menu';

export interface Metadata {
  id: string;
  file_name: string;
  name: string;
  media_type: string;
  dimensions: [number, number];
  file_size: string;
  collection: string;
  colors: string[];
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
}

export interface MediaRef {
  imagepath: string;
  low_res_imagepath: string;
  metapath: string;
  metadata: Metadata;
}

export interface NoteRef {
  metapath: string;
  metadata: NoteMetadata;
}

export interface NoteMetadata {
  id: string;
  name: string;
  media_type: string;
  note_text: string;
  collection: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export type backendRef = {
  Media?: MediaRef;
  Note?: NoteRef;
};

export type contextItemType = ContextMenu.Item[];

export type Ref = MediaRef | NoteRef;

export interface tagEvent {
  id: string;
  path: string;
  type: string;
  tag: string;
}

export interface changeNameEvent {
  id: string;
  name: string;
  type: string;
  path: string;
}

export interface changeNoteEvent {
  id: string;
  content: string;
  path: string;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
}

interface AppearanceSettings {
  show_media_info: boolean;
  compact_mode: boolean;
}

interface BehaviorSettings {
  sort_by: BehaviorSettingsSortBy;
}

enum BehaviorSettingsSortBy {
  creation_time,
  modification_time,
}
