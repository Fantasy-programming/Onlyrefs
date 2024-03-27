use palette::white_point::D65;
use palette::{IntoColor, Lab, Srgba};
use serde::de::Error;
use serde::{Deserialize, Deserializer};
use serde_json::Value;

use crate::state::{MediaRef, Metadata, NoteMetadata, NoteRef, Ref};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

// Give the size of a file
pub fn analyze_file_size(file_path: &str) -> String {
    let size = fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0);
    human_size(size)
}

// Get all subdirectories in the collections_dir
fn get_all_refs(collections_dir: &Path) -> Vec<Vec<PathBuf>> {
    let mut refs = Vec::new();
    if let Ok(entries) = std::fs::read_dir(collections_dir) {
        for entry in entries.flatten() {
            if let Ok(path) = entry.path().canonicalize() {
                if path.is_dir() {
                    let mut children = Vec::new();
                    if let Ok(dir_entries) = std::fs::read_dir(&path) {
                        for child in dir_entries.flatten() {
                            children.push(child.path());
                        }
                    }
                    refs.push(children);
                }
            }
        }
    }
    refs
}

// Parse one reference array into a MediaRef struct
fn parse_refs(refs: &[PathBuf]) -> Ref {
    let mut media_ref = MediaRef {
        imagepath: String::new(),
        low_res_imagepath: String::new(),
        metapath: String::new(),
        metadata: None,
    };
    let mut note_ref = NoteRef {
        notepath: String::new(),
        metapath: String::new(),
        metadata: None,
    };

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.json" {
            media_ref.metapath = ref_path.to_str().unwrap().to_string();
            media_ref.metadata = Some(parse_metadata(ref_path));
        } else if ref_path.file_name().unwrap() == "metadata.note.json" {
            note_ref.metapath = ref_path.to_str().unwrap().to_string();
            note_ref.metadata = Some(parse_note_metadata(ref_path));
        } else if ref_path
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("lower_")
        {
            media_ref.low_res_imagepath = ref_path.to_str().unwrap().to_string();
        } else if ref_path
            .extension()
            .unwrap_or_default()
            .to_str()
            .unwrap_or_default()
            .ends_with("md")
        {
            note_ref.notepath = ref_path.to_str().unwrap().to_string();
        } else {
            media_ref.imagepath = ref_path.to_str().unwrap().to_string();
        }
    }

    if !media_ref.imagepath.is_empty() {
        Ref::Media(media_ref)
    } else if !note_ref.notepath.is_empty() {
        Ref::Note(note_ref)
    } else {
        panic!("Invalid input: neither a media nor a note reference found");
    }
}

fn parse_metadata(path: &Path) -> Metadata {
    let content = std::fs::read_to_string(path).unwrap();

    let mut metadata: Metadata = serde_json::from_str(&content).unwrap_or_default();

    if metadata.tags.is_empty() {
        metadata.tags = Vec::new();
    }

    metadata
}

fn parse_note_metadata(path: &Path) -> NoteMetadata {
    let content = std::fs::read_to_string(path).unwrap();
    let mut metadata: NoteMetadata = serde_json::from_str(&content).unwrap_or_default();

    if metadata.tags.is_empty() {
        metadata.tags = Vec::new();
    }

    metadata
}

pub fn fetch_refs(collections_dir: &Path) -> Mutex<Vec<Ref>> {
    let refs = get_all_refs(collections_dir);
    Mutex::new(
        refs.into_iter()
            .map(|ref_paths| parse_refs(&ref_paths))
            .collect(),
    )
}

pub fn add_tag(collections_dir: &Path, ref_id: &str, tag: &str) {
    let metadata_path = collections_dir.join(ref_id).join("metadata.json");
    let mut metadata: Metadata = parse_metadata(&metadata_path);
    metadata.tags.push(tag.to_string());
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(metadata_path, json_data).expect("Failed to write metadata file");
}

pub fn change_name(collections_dir: &Path, ref_type: &str, ref_id: &str, name: &str) {
    let metadata_path;
    let mut metadata_json;

    if ref_type == "video" || ref_type == "image" {
        metadata_path = collections_dir.join(ref_id).join("metadata.json");
        metadata_json = fs::read_to_string(&metadata_path).expect("Failed to read metadata file");
        let mut metadata: Metadata =
            serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
        metadata.name = name.to_string();
        metadata_json =
            serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    } else if ref_type == "note" {
        metadata_path = collections_dir.join(ref_id).join("metadata.note.json");
        metadata_json = fs::read_to_string(&metadata_path).expect("Failed to read metadata file");
        let mut metadata: NoteMetadata =
            serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
        metadata.name = name.to_string();
        metadata_json =
            serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    } else {
        println!("Unknown ref_type: {}", ref_type);
        return;
    }

    fs::write(metadata_path, metadata_json).expect("Failed to write metadata file");
}

pub fn remove_tag(collections_dir: &Path, ref_id: &str, tag: &str) {
    let metadata_path = collections_dir.join(ref_id).join("metadata.json");
    let mut metadata: Metadata = parse_metadata(&metadata_path);
    metadata.tags.retain(|t| t != tag);
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(metadata_path, json_data).expect("Failed to write metadata file");
}

fn human_size(size: u64) -> String {
    let multiplier = 1000f64;
    let units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    let mut size = size as f64;
    if size < multiplier {
        return format!("{:.0}B", size);
    };
    for unit in &units {
        size /= multiplier;
        let precision: usize;
        if size < multiplier {
            if size < 10f64 {
                precision = 2;
            } else if size < 100f64 {
                precision = 1;
            } else {
                precision = 0;
            }
            return format!("{:.*}{}", precision, round_up(size, precision), unit);
        }
    }
    format!("{:.0}{}", size.ceil(), units[units.len() - 1])
}

fn round_up(value: f64, precision: usize) -> f64 {
    let multiplier = 10u64.pow(precision as u32) as f64;
    (value * multiplier).ceil() / multiplier
}

pub fn cached_srgba_to_lab<'a>(
    rgb: impl Iterator<Item = &'a Srgba<u8>>,
    map: &mut fxhash::FxHashMap<[u8; 3], Lab<D65, f32>>,
    lab_pixels: &mut Vec<Lab<D65, f32>>,
) {
    lab_pixels.extend(rgb.map(|color| {
        *map.entry([color.red, color.green, color.blue])
            .or_insert_with(|| color.into_linear::<_, f32>().into_color())
    }))
}

pub fn deserialize_file_size<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Value::deserialize(deserializer)?;

    match value {
        Value::String(s) => Ok(s),
        Value::Number(n) => Ok(human_size(n.as_u64().unwrap())),
        _ => Err(D::Error::custom("Invalid file_size value")),
    }
}
