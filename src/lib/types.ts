// Context menu item type (legacy, not currently used)
export interface ContextMenuItem {
  event: string;
  label: string;
  payload?: string;
  shortcut?: string;
}

// ============================================
// Board Types
// ============================================

export interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  color?: string;
}

// ============================================
// Canvas Entity (Independent Canvas Metadata)
// ============================================

export interface Canvas {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

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

export interface DesignRef {
  design_path: string;
  thumbnail_path: string;
  metapath: string;
  metadata: DesignMetadata;
}

export interface ModelRef {
  model_path: string;
  thumbnail_path: string;
  metapath: string;
  metadata: ModelMetadata;
}

export interface ImageMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'image';
  media_type: string;
  dimensions: [number, number];
  file_size: string;
  board_id: string | null;
  colors: string[];
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
  rating?: number;
  source_url?: string;
}

export interface VideoMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'video';
  media_type: string;
  dimensions: [number, number];
  file_size: string;
  board_id: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
  rating?: number;
  source_url?: string;
}

export interface AudioMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'audio';
  media_type: string;
  file_size: string;
  board_id: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags?: string[];
  rating?: number;
  source_url?: string;
}

export interface NoteMetadata {
  id: string;
  name: string;
  ref_type: 'note';
  board_id: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
  source_url?: string;
}

export interface LinkMetadata {
  id: string;
  name: string;
  ref_type: 'link';
  source_uri: string;
  board_id: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
}

export interface DocMetadata {
  id: string;
  name: string;
  ref_type: 'doc';
  board_id: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
  source_url?: string;
}

export interface DesignMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'design';
  media_type: string;
  dimensions: [number, number] | null;
  file_size: string;
  board_id: string | null;
  layer_count: number | null;
  color_mode: string | null;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
  source_url?: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  file_name: string;
  ref_type: 'model';
  media_type: string;
  file_size: string;
  board_id: string | null;
  vertex_count: number | null;
  face_count: number | null;
  has_animations: boolean;
  has_materials: boolean;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
  source_url?: string;
}

export interface StackRef {
  items: Ref[];
  metapath: string;
  metadata: StackMetadata;
}

export interface StackMetadata {
  id: string;
  name: string;
  ref_type: 'stack';
  board_id: string | null;
  item_ids: string[];
  cover_id: string;
  created_at: string;
  updated_at: string;
  note_text: string;
  tags: string[];
  rating?: number;
  source_url?: string;
}

export interface GenerateID {
  length: number;
  createDir?: boolean;
}

export type Reftype =
  | 'video'
  | 'image'
  | 'note'
  | 'stack'
  | 'audio'
  | 'link'
  | 'doc'
  | 'design'
  | 'model';
export type Ref =
  | ImageRef
  | VideoRef
  | AudioRef
  | NoteRef
  | LinkRef
  | DocRef
  | StackRef
  | DesignRef
  | ModelRef;
export type RefMeta =
  | ImageMetadata
  | VideoMetadata
  | AudioMetadata
  | NoteMetadata
  | LinkMetadata
  | DocMetadata
  | StackMetadata
  | DesignMetadata
  | ModelMetadata;

export type contextItemType = ContextMenuItem[];

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

// ============================================
// Canvas / Moodboard Types
// ============================================

// Position on canvas
export interface CanvasPosition {
  x: number;
  y: number;
}

// Size dimensions
export interface CanvasSize {
  width: number;
  height: number;
}

// Canvas item - a ref placed on canvas
export interface CanvasItem {
  id: string;
  refId: string;
  position: CanvasPosition;
  size: CanvasSize;
  rotation: number; // degrees
  zIndex: number;
  locked: boolean;
  frameId?: string; // parent frame if any
}

// Frame - visual grouping container
export interface CanvasFrame {
  id: string;
  title: string;
  position: CanvasPosition;
  size: CanvasSize;
  color: string; // background color
  zIndex: number;
  locked: boolean;
}

// Text annotation style
export interface CanvasTextStyle {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

// Text annotation
export interface CanvasAnnotation {
  id: string;
  type: 'text';
  position: CanvasPosition;
  size: CanvasSize;
  rotation: number;
  zIndex: number;
  locked: boolean;
  content: string; // TipTap JSON or plain text
  style: CanvasTextStyle;
  frameId?: string;
}

// Canvas visual style
export type CanvasStyleTheme = 'minimal' | 'tactile' | 'neutral';

// Canvas settings
export interface CanvasSettings {
  style: CanvasStyleTheme;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showGuides: boolean;
}

// Viewport state
export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

// Full canvas data (persisted)
export interface CanvasData {
  version: number;
  items: CanvasItem[];
  frames: CanvasFrame[];
  annotations: CanvasAnnotation[];
  viewport: CanvasViewport;
  settings: CanvasSettings;
}

// Default canvas settings
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  style: 'minimal',
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  showGuides: true,
};

// Default canvas data
export const DEFAULT_CANVAS_DATA: CanvasData = {
  version: 1,
  items: [],
  frames: [],
  annotations: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  settings: DEFAULT_CANVAS_SETTINGS,
};

// Canvas constraints
export const CANVAS_CONSTRAINTS = {
  item: {
    minWidth: 50,
    minHeight: 50,
    maxWidth: 10000,
    maxHeight: 10000,
  },
  canvas: {
    minX: -50000,
    maxX: 50000,
    minY: -50000,
    maxY: 50000,
  },
  zoom: {
    min: 0.1,
    max: 5,
  },
  grid: {
    defaultSize: 20,
  },
};
