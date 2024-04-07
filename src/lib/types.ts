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

export type Ref = MediaRef | NoteRef;
