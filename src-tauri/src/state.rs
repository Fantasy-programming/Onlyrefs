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

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Metadata {
    pub id: String,
    pub file_name: String,
    pub name: String,
    pub media_type: String,
    pub dimensions: Option<(u32, u32)>,
    pub file_size: String,
    pub collection: String,
    pub colors: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

pub fn init_media_ref(app_handle: AppHandle) -> Mutex<Vec<MediaRef>> {
    let collections_dir = get_collection_path(&app_handle);
    utils::fetch_refs(&collections_dir)
}
