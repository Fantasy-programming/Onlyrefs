use crate::config::{get_collection_path, get_settings_path};
use crate::utils::convert_file_src;
use crate::{media, utils};
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::clone::Clone;
use std::iter::FromIterator;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct MediaRef {
    pub imagepath: String,
    pub low_res_imagepath: String,
    pub metapath: String,
    pub metadata: Option<Metadata>,
}

impl MediaRef {
    pub fn new(
        imagepath: &Path,
        lw_rs_imagpath: String,
        metapath: &Path,
        metadata: Metadata,
    ) -> Result<Self, String> {
        Ok(Self {
            imagepath: convert_file_src(imagepath),
            low_res_imagepath: lw_rs_imagpath,
            metapath: metapath.to_str().unwrap().to_string(),
            metadata: Some(metadata),
        })
    }
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NoteRef {
    pub metapath: String,
    pub metadata: Option<NoteMetadata>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct NoteMetadata {
    pub id: String,
    pub name: String,
    pub media_type: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
}

impl NoteMetadata {
    pub fn new(id: &str, content: &str, collection: &str) -> Result<Self, String> {
        Ok(Self {
            id: id.to_string(),
            name: String::new(),
            media_type: "note".to_string(),
            collection: collection.to_string(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            note_text: content.to_string(),
            tags: Vec::new(),
        })
    }
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
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

// create a new method for metadata
impl Metadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        collection: &str,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            media_type: media::determine_media_type(file_name),
            dimensions: media::analyze_dimensions(media_path),
            file_size: utils::analyze_file_size(media_path),
            collection: collection.to_string(),
            colors: Vec::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
        })
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub enum Ref {
    Media(MediaRef),
    Note(NoteRef),
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Settings {
    pub appearance: AppearanceSettings,
    pub behavior: BehaviorSettings,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct AppearanceSettings {
    pub show_media_info: bool,
    pub compact_mode: bool,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct BehaviorSettings {
    pub sort_by: SortBy,
}

#[derive(Clone, Serialize, Default, Deserialize, Debug)]
pub enum SortBy {
    #[default]
    CreationTime,
    ModificationTime,
}

pub fn init_media_ref(app_handle: AppHandle) -> Mutex<Vec<Ref>> {
    let collections_dir = get_collection_path(&app_handle);
    utils::fetch_refs(&collections_dir)
}

pub fn init_settings(app_handle: AppHandle) -> Mutex<Settings> {
    let settings = get_settings_path(&app_handle);
    utils::fetch_settings(&settings)
}
