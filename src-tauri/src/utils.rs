use palette::white_point::D65;
use palette::{IntoColor, Lab, Srgba};
use serde::de::Error;
use serde::{Deserialize, Deserializer};
use serde_json::Value;

use crate::state::{MediaRef, Metadata};
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
fn parse_refs(refs: &[PathBuf]) -> MediaRef {
    let mut result = MediaRef {
        imagepath: String::new(),
        low_res_imagepath: String::new(),
        metapath: String::new(),
        metadata: None,
    };

    for ref_path in refs {
        if ref_path.file_name().unwrap() == "metadata.json" {
            result.metapath = ref_path.to_str().unwrap().to_string();
            result.metadata = Some(parse_metadata(ref_path));
        } else if ref_path
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("lower_")
        {
            result.low_res_imagepath = ref_path.to_str().unwrap().to_string();
        } else {
            result.imagepath = ref_path.to_str().unwrap().to_string();
        }
    }

    result
}

fn parse_metadata(path: &Path) -> Metadata {
    let content = std::fs::read_to_string(path).unwrap();

    let mut metadata: Metadata = serde_json::from_str(&content).unwrap_or_default();

    if metadata.tags.is_empty() {
        metadata.tags = Vec::new();
    }

    metadata = Metadata {
        id: metadata.id,
        file_name: metadata.file_name,
        name: metadata.name,
        media_type: metadata.media_type,
        dimensions: metadata.dimensions,
        file_size: metadata.file_size,
        collection: metadata.collection,
        colors: metadata.colors,
        created_at: metadata.created_at,
        updated_at: metadata.updated_at,
        tags: metadata.tags,
    };

    metadata
}

pub fn fetch_refs(collections_dir: &Path) -> Mutex<Vec<MediaRef>> {
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
