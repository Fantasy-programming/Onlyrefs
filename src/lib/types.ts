export interface Metadata {
  id: string;
  file_name: string;
  media_type: string;
  dimensions: [number, number];
  file_size: number;
  collection: string;
}

export interface MediaRef {
  imagepath: string;
  metapath: string;
  metadata: Metadata;
}
