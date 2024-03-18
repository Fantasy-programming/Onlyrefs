use crate::state::{MediaRef, Metadata};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

// Give the size of a file
pub fn analyze_file_size(file_path: &str) -> u64 {
    fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0)
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
