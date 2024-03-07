export interface Metadata {
  id: string;
  file_name: string;
  name: string;
  media_type: string;
  dimensions: [number, number];
  file_size: number;
  collection: string;
  colors: string[];
  created_at: string;
  updated_at: string;
}

export interface MediaRef {
  imagepath: string;
  low_res_imagepath: string;
  metapath: string;
  metadata: Metadata;
}
