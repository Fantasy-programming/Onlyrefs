import { ContextMenu } from 'tauri-plugin-context-menu';

export interface ImageRef {
  image_path: string;
  low_res_imagepath: string;
  metapath: string;
  metadata: ImageMetadata;
}

export interface VideoRef {
  video_path: string;
  metadata: VideoMetadata;
  metapath: string;
}

export interface AudioRef {
  audio_path: string;
  metadata: AudioMetadata;
  metapath: string;
}

export interface NoteRef {
  content: string;
  metapath: string;
  metadata: NoteMetadata;
}

export interface LinkRef {
  snapshoot: string;
  metapath: string;
  metadata: LinkMetadata;
}

export interface DocRef {
  doc_path: string;
  metapath: string;
  metadata: DocMetadata;
}

export interface ImageMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'image';
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

export interface VideoMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'video';
  media_type: string;
  dimensions: [number, number];
  file_size: string;
  collection: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
}

export interface AudioMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'audio';
  media_type: string;
  file_size: string;
  collection: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
}

export interface NoteMetadata {
  id: string;
  name: string;
  ref_type: 'note';
  collection: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
}

export interface LinkMetadata {
  id: string;
  name: string;
  ref_type: 'link';
  source_uri: string;
  collection: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
}

export interface DocMetadata {
  id: string;
  name: string;
  ref_type: 'doc';
  collection: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
}

export interface GenerateID {
  lenght: number;
  createDir?: boolean;
}

export type Reftype = 'video' | 'image' | 'note';
export type Ref = ImageRef | VideoRef | AudioRef | NoteRef | LinkRef | DocRef;
export type RefMeta =
  | ImageMetadata
  | VideoMetadata
  | AudioMetadata
  | NoteMetadata
  | LinkMetadata
  | DocMetadata;

export type contextItemType = ContextMenu.Item[];

export interface tagEvent {
  id: string;
  path: string;
  tag: string;
}

export interface changeNameEvent {
  id: string;
  name: string;
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
  video_ref_autoplay: boolean;
}

interface BehaviorSettings {
  sort_by: BehaviorSettingsSortBy;
}

enum BehaviorSettingsSortBy {
  creation_time,
  modification_time,
}
