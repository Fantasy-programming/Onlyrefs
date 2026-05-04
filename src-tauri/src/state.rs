use crate::config::{get_boards_path, get_collection_path, get_settings_path};
use crate::utils::convert_file_src;
use crate::{media, utils};
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::clone::Clone;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::AppHandle;

pub trait Metadata {
    fn set_name(&mut self, new_name: &str);
    fn add_tag(&mut self, tag: &str);
    fn remove_tag(&mut self, tag: &str);
    fn update_note(&mut self, note: &str);
    fn set_board_id(&mut self, board_id: Option<String>);
    fn get_board_id(&self) -> Option<&String>;
    fn set_rating(&mut self, rating: u8);
    fn set_source_url(&mut self, url: Option<String>);
}

// ============================================
// Board Types
// ============================================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Board {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: String,
    #[serde(default)]
    pub color: Option<String>,
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

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct StackRef {
    pub items: Vec<Box<Ref>>,
    pub metadata: Option<StackMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct DesignRef {
    pub design_path: String,
    pub thumbnail_path: String,
    pub metadata: Option<DesignMetadata>,
    pub metapath: String,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct ModelRef {
    pub model_path: String,
    pub thumbnail_path: String,
    pub metadata: Option<ModelMetadata>,
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration - will be converted to board_id
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub colors: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub dimensions: Option<(u32, u32)>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct NoteMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize, Debug, Deserialize, Clone, Default)]
pub struct LinkMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    pub source_uri: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DocMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub created_at: String,
    pub updated_at: String,
    pub note_text: String,
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct StackMetadata {
    pub id: String,
    pub name: String,
    pub ref_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    // Legacy field for migration
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    pub item_ids: Vec<String>,
    pub cover_id: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DesignMetadata {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub ref_type: String,
    pub media_type: String,
    #[serde(default)]
    pub dimensions: Option<(u32, u32)>,
    #[serde(deserialize_with = "utils::deserialize_file_size")]
    pub file_size: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    #[serde(default)]
    pub layer_count: Option<u32>,
    #[serde(default)]
    pub color_mode: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ModelMetadata {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub ref_type: String,
    pub media_type: String,
    #[serde(deserialize_with = "utils::deserialize_file_size")]
    pub file_size: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub board_id: Option<String>,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub collection: String,
    #[serde(default)]
    pub vertex_count: Option<u64>,
    #[serde(default)]
    pub face_count: Option<u64>,
    #[serde(default)]
    pub has_animations: bool,
    #[serde(default)]
    pub has_materials: bool,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub note_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub rating: u8,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

impl ImageRef {
    pub fn new(
        imagepath: &Path,
        lw_rs_imagpath: String,
        metadata: ImageMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            image_path: convert_file_src(imagepath)
                .map_err(|e| format!("Failed to convert image path: {}", e))?,
            low_res_imagepath: lw_rs_imagpath,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
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
            video_path: convert_file_src(videopath)
                .map_err(|e| format!("Failed to convert video path: {}", e))?,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
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
            audio_path: convert_file_src(audiopath)
                .map_err(|e| format!("Failed to convert audio path: {}", e))?,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
        })
    }
}

impl DocRef {
    pub fn new(docpath: &Path, metadata: DocMetadata, metapath: PathBuf) -> Result<Self, String> {
        Ok(Self {
            doc_path: convert_file_src(docpath)
                .map_err(|e| format!("Failed to convert doc path: {}", e))?,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
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
            Some(path) => convert_file_src(path)
                .map_err(|e| format!("Failed to convert snapshot path: {}", e))?,
            None => String::new(),
        };

        Ok(Self {
            snapshoot: snapshot_str,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
        })
    }
}

impl DesignRef {
    pub fn new(
        designpath: &Path,
        thumbnail_path: String,
        metadata: DesignMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            design_path: convert_file_src(designpath)
                .map_err(|e| format!("Failed to convert design path: {}", e))?,
            thumbnail_path,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
        })
    }
}

impl ModelRef {
    pub fn new(
        modelpath: &Path,
        thumbnail_path: String,
        metadata: ModelMetadata,
        metapath: PathBuf,
    ) -> Result<Self, String> {
        Ok(Self {
            model_path: convert_file_src(modelpath)
                .map_err(|e| format!("Failed to convert model path: {}", e))?,
            thumbnail_path,
            metadata: Some(metadata),
            metapath: metapath
                .to_str()
                .ok_or_else(|| "Invalid metapath encoding".to_string())?
                .to_string(),
        })
    }
}

impl ImageMetadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        board_id: Option<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            ref_type: "image".to_string(),
            media_type: media::determine_media_type(file_name),
            dimensions: media::analyze_dimensions(media_path),
            file_size: utils::analyze_file_size(media_path),
            board_id,
            collection: String::new(),
            colors: Vec::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
        })
    }
}

impl VideoMetadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        board_id: Option<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            ref_type: "video".to_string(),
            media_type: media::determine_media_type(file_name),
            file_size: utils::analyze_file_size(media_path),
            board_id,
            collection: String::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            dimensions: None,
            rating: 0,
            source_url: None,
        })
    }
}

impl AudioMetadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        board_id: Option<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            ref_type: "audio".to_string(),
            media_type: media::determine_media_type(file_name),
            file_size: utils::analyze_file_size(media_path),
            board_id,
            collection: String::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
        })
    }
}

impl LinkMetadata {
    pub fn new(id: &str, source_uri: &str, board_id: Option<String>) -> Result<Self, String> {
        Ok(Self {
            id: id.to_string(),
            name: String::new(),
            source_uri: source_uri.to_string(),
            ref_type: "link".to_string(),
            board_id,
            collection: String::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
        })
    }
}

impl DocMetadata {
    pub fn new(id: String, board_id: Option<String>) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            ref_type: "doc".to_string(),
            board_id,
            collection: String::new(),
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
        })
    }
}

impl StackMetadata {
    pub fn new(
        id: String,
        board_id: Option<String>,
        item_ids: Vec<String>,
        cover_id: String,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            ref_type: "stack".to_string(),
            board_id,
            collection: String::new(),
            item_ids,
            cover_id,
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
        })
    }
}

impl DesignMetadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        board_id: Option<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            ref_type: "design".to_string(),
            media_type: media::determine_media_type(file_name),
            dimensions: None,
            file_size: utils::analyze_file_size(media_path),
            board_id,
            collection: String::new(),
            layer_count: None,
            color_mode: None,
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
        })
    }
}

impl ModelMetadata {
    pub fn new(
        id: String,
        file_name: &str,
        media_path: &Path,
        board_id: Option<String>,
    ) -> Result<Self, String> {
        Ok(Self {
            id,
            name: String::new(),
            file_name: file_name.to_string(),
            ref_type: "model".to_string(),
            media_type: media::determine_media_type(file_name),
            file_size: utils::analyze_file_size(media_path),
            board_id,
            collection: String::new(),
            vertex_count: None,
            face_count: None,
            has_animations: false,
            has_materials: false,
            note_text: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new(); // Clear legacy field
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5); // Cap at 5 stars
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
    }
}

impl NoteMetadata {
    pub fn new(id: &str, board_id: Option<String>) -> Result<Self, String> {
        Ok(Self {
            id: id.to_string(),
            name: String::new(),
            ref_type: "note".to_string(),
            board_id,
            collection: String::new(),
            created_at: Local::now().to_string(),
            updated_at: Local::now().to_string(),
            note_text: String::new(),
            tags: Vec::new(),
            rating: 0,
            source_url: None,
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, _url: Option<String>) {
        // LinkMetadata uses source_uri instead, so this is a no-op
        // The source_uri is set at creation time
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
    }
}

impl Metadata for StackMetadata {
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
    }
}

impl Metadata for DesignMetadata {
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
    }
}

impl Metadata for ModelMetadata {
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
        self.updated_at = Local::now().to_string();
    }

    fn set_board_id(&mut self, board_id: Option<String>) {
        self.board_id = board_id;
        self.collection = String::new();
        self.updated_at = Local::now().to_string();
    }

    fn get_board_id(&self) -> Option<&String> {
        self.board_id.as_ref()
    }

    fn set_rating(&mut self, rating: u8) {
        self.rating = rating.min(5);
        self.updated_at = Local::now().to_string();
    }

    fn set_source_url(&mut self, url: Option<String>) {
        self.source_url = url;
        self.updated_at = Local::now().to_string();
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum Ref {
    Image(ImageRef),
    Video(VideoRef),
    Audio(AudioRef),
    Note(NoteRef),
    Link(LinkRef),
    Doc(DocRef),
    Stack(StackRef),
    Design(DesignRef),
    Model(ModelRef),
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
    Stack(StackMetadata),
    Design(DesignMetadata),
    Model(ModelMetadata),
}

impl Ref {
    pub fn get_id(&self) -> &str {
        match self {
            Ref::Image(image_ref) => &image_ref.metadata.as_ref().unwrap().id,
            Ref::Video(video_ref) => &video_ref.metadata.as_ref().unwrap().id,
            Ref::Audio(audio_ref) => &audio_ref.metadata.as_ref().unwrap().id,
            Ref::Note(note_ref) => &note_ref.metadata.as_ref().unwrap().id,
            Ref::Link(link_ref) => &link_ref.metadata.as_ref().unwrap().id,
            Ref::Doc(doc_ref) => &doc_ref.metadata.as_ref().unwrap().id,
            Ref::Stack(stack_ref) => &stack_ref.metadata.as_ref().unwrap().id,
            Ref::Design(design_ref) => &design_ref.metadata.as_ref().unwrap().id,
            Ref::Model(model_ref) => &model_ref.metadata.as_ref().unwrap().id,
        }
    }

    pub fn get_ref_meta(&mut self) -> Result<&mut dyn Metadata, String> {
        match self {
            Ref::Image(image_ref) => image_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Image metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Video(video_ref) => video_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Video metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Audio(audio_ref) => audio_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Audio metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Note(note_ref) => note_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Note metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Link(link_ref) => link_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Link metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Doc(doc_ref) => doc_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Doc metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Stack(stack_ref) => stack_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Stack metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Design(design_ref) => design_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Design metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
            Ref::Model(model_ref) => model_ref
                .metadata
                .as_mut()
                .ok_or_else(|| "Model metadata is None".to_string())
                .map(|m| m as &mut dyn Metadata),
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

/// Initialize an empty refs state for immediate app startup
/// Refs will be loaded asynchronously and pushed via event
pub fn init_media_ref_empty() -> Mutex<Vec<Ref>> {
    Mutex::new(Vec::new())
}

pub fn init_settings(app_handle: &AppHandle) -> Mutex<Settings> {
    let settings = get_settings_path(app_handle);
    utils::fetch_settings(&settings)
}

pub fn init_boards(app_handle: &AppHandle) -> Mutex<Vec<Board>> {
    let boards_path = get_boards_path(app_handle);
    match utils::fetch_boards(&boards_path) {
        Ok(boards) => boards,
        Err(e) => {
            eprintln!("Error initializing boards: {}", e);
            Mutex::new(Vec::new())
        }
    }
}
