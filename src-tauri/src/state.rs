use crate::config::get_collection_path;
use crate::utils;
use serde::{Deserialize, Serialize};
use std::clone::Clone;
use std::iter::FromIterator;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone)]
pub struct MediaRef {
    pub imagepath: String,
    pub low_res_imagepath: String,
    pub metapath: String,
    pub metadata: Option<Metadata>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NoteRef {
    pub notepath: String,
    pub metapath: String,
    pub metadata: Option<NoteMetadata>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NoteMetadata {
    pub id: String,
    pub note_name: String,
    pub media_type: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Metadata {
    pub id: String,
    pub file_name: String,
    pub name: String,
    pub media_type: String,
    pub dimensions: Option<(u32, u32)>,
    #[serde(deserialize_with = "utils::deserialize_file_size")]
    pub file_size: String,
    pub collection: String,
    pub colors: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub enum Ref {
    Media(MediaRef),
    Note(NoteRef),
}

pub fn init_media_ref(app_handle: AppHandle) -> Mutex<Vec<Ref>> {
    let collections_dir = get_collection_path(&app_handle);
    utils::fetch_refs(&collections_dir)
}
