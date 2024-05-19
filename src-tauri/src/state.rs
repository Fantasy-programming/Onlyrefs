use crate::config::{get_collection_path, get_settings_path};
use crate::utils::convert_file_src;
use crate::{media, utils};
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::clone::Clone;
use std::iter::FromIterator;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

pub trait Metadata {
    fn set_name(&mut self, new_name: &str);
    fn add_tag(&mut self, tag: &str);
    fn remove_tag(&mut self, tag: &str);
    fn update_note(&mut self, note: &str);
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct ImageRef {
    pub image_path: String,
    pub low_res_imagepath: String,
    pub metadata: Option<ImageMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct VideoRef {
    pub video_path: String,
    pub metadata: Option<VideoMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct AudioRef {
    pub audio_path: String,
    pub metadata: Option<AudioMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct NoteRef {
    pub content: String,
    pub metadata: Option<NoteMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct LinkRef {
    pub snapshoot: String,
    pub metadata: Option<LinkMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct DocRef {
    pub doc_path: String,
    pub metadata: Option<DocMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct ImageMetadata {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub ref_type: String,
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

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct VideoMetadata {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub ref_type: String,
    pub media_type: String,
    #[serde(deserialize_with = "utils::deserialize_file_size")]
    pub file_size: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct AudioMetadata {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub ref_type: String,
    pub media_type: String,
    #[serde(deserialize_with = "utils::deserialize_file_size")]
    pub file_size: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct NoteMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct LinkMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    pub source_uri: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DocMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
}

impl ImageRef {
    pub fn new(
        imagepath: &Path,
        lw_rs_imagpath: String,
        metadata: ImageMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            image_path: convert_file_src(imagepath),
            low_res_imagepath: lw_rs_imagpath,
            metadata: Some(metadata),
            metapath: metapath.to_str().unwrap().to_string(),
        })
    }
}

impl VideoRef {
    pub fn new(
        videopath: &Path,
        metadata: VideoMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            video_path: convert_file_src(videopath),
            metadata: Some(metadata),
            metapath: metapath.to_str().unwrap().to_string(),
        })
    }
}

impl AudioRef {
    pub fn new(
        audiopath: &Path,
        metadata: AudioMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            audio_path: convert_file_src(audiopath),
            metadata: Some(metadata),
            metapath: metapath.to_str().unwrap().to_string(),
        })
    }
}

impl DocRef {
    pub fn new(docpath: &Path, metadata: DocMetadata, metapath: PathBuf) -> Result<Self, String> {
        Ok(Self {
            doc_path: convert_file_src(docpath),
            metadata: Some(metadata),
            metapath: metapath.to_str().unwrap().to_string(),
        })
    }
}

impl LinkRef {
    pub fn new(
        snapshoot: Option<&Path>,
        metadata: LinkMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        let snapshot_str = match snapshoot {
            Some(path) => convert_file_src(path),
            None => String::new(),
        };

        Ok(Self {
            snapshoot: snapshot_str,
            metadata: Some(metadata),
            metapath: metapath.to_str().unwrap().to_string(),
        })
    }
}

impl ImageMetadata {
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
            ref_type: "image".to_string(),
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

impl VideoMetadata {
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
            ref_type: "video".to_string(),
            media_type: media::determine_media_type(file_name),
            file_size: utils::analyze_file_size(media_path),
            collection: collection.to_string(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
        })
    }
}

impl AudioMetadata {
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
            ref_type: "audio".to_string(),
            media_type: media::determine_media_type(file_name),
            file_size: utils::analyze_file_size(media_path),
            collection: collection.to_string(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
        })
    }
}

impl LinkMetadata {
    pub fn new(id: &str, source_uri: &str, collection: &str) -> Result<Self, String> {
        Ok(Self {
            id: id.to_string(),
            name: String::new(),
            source_uri: source_uri.to_string(),
            ref_type: "link".to_string(),
            collection: collection.to_string(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
        })
    }
}

impl DocMetadata {
    pub fn new(id: String, collection: &str) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            ref_type: "link".to_string(),
            collection: collection.to_string(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
        })
    }
}

impl Metadata for ImageMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

impl Metadata for VideoMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

impl Metadata for AudioMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

impl NoteMetadata {
    pub fn new(id: &str, collection: &str) -> Result<Self, String> {
        Ok(Self {
            id: id.to_string(),
            name: String::new(),
            ref_type: "note".to_string(),
            collection: collection.to_string(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            note_text: String::new(),
            tags: Vec::new(),
        })
    }
}

impl Metadata for NoteMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

impl Metadata for LinkMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

impl Metadata for DocMetadata {
    fn set_name(&mut self, new_name: &str) {
        self.name = new_name.to_string();
        self.updated_at = Local::now().to_string();
    }

    fn add_tag(&mut self, tag: &str) {
        self.tags.push(tag.to_string());
        self.updated_at = Local::now().to_string();
    }

    fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
        self.updated_at = Local::now().to_string();
    }

    fn update_note(&mut self, note: &str) {
        self.note_text = note.to_string();
    }
}

// create a new method for metadata

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum Ref {
    Image(ImageRef),
    Video(VideoRef),
    Audio(AudioRef),
    Note(NoteRef),
    Link(LinkRef),
    Doc(DocRef),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum RefMeta {
    Image(ImageMetadata),
    Video(VideoMetadata),
    Audio(AudioMetadata),
    Note(NoteMetadata),
    Link(LinkMetadata),
    Doc(DocMetadata),
}

impl Ref {
    pub fn get_id(&self) -> &str {
        match self {
            Ref::Image(ref image_ref) => &image_ref.metadata.as_ref().unwrap().id,
            Ref::Video(ref video_ref) => &video_ref.metadata.as_ref().unwrap().id,
            Ref::Audio(ref audio_ref) => &audio_ref.metadata.as_ref().unwrap().id,
            Ref::Note(ref note_ref) => &note_ref.metadata.as_ref().unwrap().id,
            Ref::Link(ref link_ref) => &link_ref.metadata.as_ref().unwrap().id,
            Ref::Doc(ref doc_ref) => &doc_ref.metadata.as_ref().unwrap().id,
        }
    }

    pub fn get_ref_meta(&mut self) -> Result<&mut dyn Metadata, String> {
        match self {
            Ref::Image(ref mut image_ref) => Ok(image_ref.metadata.as_mut().unwrap()),
            Ref::Video(ref mut video_ref) => Ok(video_ref.metadata.as_mut().unwrap()),
            Ref::Audio(ref mut audio_ref) => Ok(audio_ref.metadata.as_mut().unwrap()),
            Ref::Note(ref mut note_ref) => Ok(note_ref.metadata.as_mut().unwrap()),
            Ref::Link(ref mut link_ref) => Ok(link_ref.metadata.as_mut().unwrap()),
            Ref::Doc(ref mut doc_ref) => Ok(doc_ref.metadata.as_mut().unwrap()),
        }
    }
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct Settings {
    pub appearance: AppearanceSettings,
    pub behavior: BehaviorSettings,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone)]
pub struct AppearanceSettings {
    pub show_media_info: bool,
    pub video_ref_autoplay: bool,
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
