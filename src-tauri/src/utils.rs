use palette::white_point::D65;
use palette::{IntoColor, Lab, Srgba};
use serde::de::Error;
use serde::{Deserialize, Deserializer};
use serde_json::Value;

use crate::state::{MediaRef, Metadata, NoteMetadata, NoteRef, Ref};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// Return the size of a file in human readable format
pub fn analyze_file_size(file_path: &str) -> String {
    let size = fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0);
    human_size(size)
}

/// Get all subdirectories in the given path
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

/// Parse a pathbuffer array into a Ref struct
fn parse_refs(refs: &[PathBuf]) -> Ref {
    let mut media_ref = MediaRef {
        imagepath: String::new(),
        low_res_imagepath: String::new(),
        metapath: String::new(),
        metadata: None,
    };
    let mut note_ref = NoteRef {
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
        } else {
            media_ref.imagepath = ref_path.to_str().unwrap().to_string();
        }
    }

    if !media_ref.imagepath.is_empty() {
        Ref::Media(media_ref)
    } else if !note_ref.metapath.is_empty() {
        Ref::Note(note_ref)
    } else {
        panic!("Invalid input: neither a media nor a note reference found");
    }
}

/// parse a media metadata file
fn parse_metadata(path: &Path) -> Metadata {
    let content = std::fs::read_to_string(path).unwrap();
    let metadata: Metadata = serde_json::from_str(&content).unwrap_or_default();

    metadata
}

/// parse a note metadata file
fn parse_note_metadata(path: &Path) -> NoteMetadata {
    let content = std::fs::read_to_string(path).unwrap();
    let metadata: NoteMetadata = serde_json::from_str(&content).unwrap_or_default();

    metadata
}

/// Get all references in the collections directory
pub fn fetch_refs(collections_dir: &Path) -> Mutex<Vec<Ref>> {
    let refs = get_all_refs(collections_dir);
    Mutex::new(
        refs.into_iter()
            .map(|ref_paths| parse_refs(&ref_paths))
            .collect(),
    )
}

/// Change name of a ref
pub fn change_name(metadata_path: &Path, ref_type: &str, new_name: &str) {
    let mut metadata_json =
        fs::read_to_string(metadata_path).expect("Failed to read metadata file");

    match ref_type {
        "video" | "image" => {
            let mut metadata: Metadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.name = new_name.to_string();
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        "note" => {
            let mut metadata: NoteMetadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.name = new_name.to_string();
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        _ => {
            println!("Unknown ref_type: {}", ref_type);
            return;
        }
    }

    fs::write(metadata_path, metadata_json).expect("Failed to write metadata file");
}

/// Add tags to a ref
pub fn add_tag(metadata_path: &Path, ref_type: &str, tag: &str) {
    let mut metadata_json =
        fs::read_to_string(metadata_path).expect("Failed to read metadata file");

    match ref_type {
        "video" | "image" => {
            let mut metadata: Metadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.tags.push(tag.to_string());
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        "note" => {
            let mut metadata: NoteMetadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.tags.push(tag.to_string());
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        _ => {
            println!("Unknown ref_type: {}", ref_type);
            return;
        }
    };

    fs::write(metadata_path, metadata_json).expect("Failed to write metadata file");
}

/// Remove tags from a ref
pub fn remove_tag(metadata_path: &Path, ref_type: &str, tag: &str) {
    let mut metadata_json =
        fs::read_to_string(metadata_path).expect("Failed to read metadata file");

    match ref_type {
        "video" | "image" => {
            let mut metadata: Metadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.tags.retain(|t| t != tag);
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        "note" => {
            let mut metadata: NoteMetadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.tags.retain(|t| t != tag);
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        _ => {
            println!("Unknown ref_type: {}", ref_type);
            return;
        }
    };

    fs::write(metadata_path, metadata_json).expect("Failed to write metadata file");
}

/// Mutate note component from a ref
pub fn mutate_note(metadata_path: &Path, ref_type: &str, note_content: &str) {
    let mut metadata_json =
        fs::read_to_string(metadata_path).expect("Failed to read metadata file");

    match ref_type {
        "note" => {
            let mut metadata: NoteMetadata =
                serde_json::from_str(&metadata_json).expect("Failed to parse metadata");
            metadata.note_text = note_content.to_string();
            metadata_json =
                serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
        }
        _ => {
            println!("Unknown ref_type: {}", ref_type);
            return;
        }
    };

    fs::write(metadata_path, metadata_json).expect("Failed to write metadata file");
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

#[cfg(test)]
mod tests {

    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};
    const MEDIA_METADATA_PATH: &str = "resources/metadata.json";
    const NOTE_METADATA_PATH: &str = "resources/metadata.note.json";

    #[test]
    fn test_analyze_file_size() {
        let file_path = "test_file.txt";
        fs::write(file_path, "This is a test file.").expect("Failed to create test file");
        let file_size = analyze_file_size(file_path);
        assert_eq!(file_size, "20B");
        fs::remove_file(file_path).expect("Failed to delete test file");
    }

    #[test]
    fn test_get_all_refs() {
        let collections_dir = Path::new("test_all_refs");
        fs::create_dir_all(collections_dir).expect("Failed to create test collections directory");
        fs::create_dir(collections_dir.join("dir1")).expect("Failed to create test directory");
        fs::create_dir(collections_dir.join("dir2")).expect("Failed to create test directory");

        let refs = get_all_refs(collections_dir);
        assert_eq!(refs.len(), 2);
        assert_eq!(refs[0].len(), 0);
        assert_eq!(refs[1].len(), 0);

        fs::remove_dir_all(collections_dir).expect("Failed to delete test collections directory");
    }

    #[test]
    fn test_change_name() {
        // Setup the environment
        let temp_dir = Path::new("test_name_location");
        let new_name = "good ref";
        fs::create_dir_all(temp_dir).expect("Failed to create test collections directory");

        let media_metadata_path = temp_dir.join("metadata.json");
        fs::copy(MEDIA_METADATA_PATH, media_metadata_path.clone())
            .expect("Failed to copy media metadata file");

        let note_metadata_path = temp_dir.join("metadata.note.json");
        fs::copy(NOTE_METADATA_PATH, note_metadata_path.clone())
            .expect("Failed to copy note metadata file");

        // Test changing the name of a media reference
        change_name(&media_metadata_path, "image", new_name);

        let updated_metadata: Metadata = serde_json::from_str(
            &fs::read_to_string(media_metadata_path).expect("Failed to read media metadata file"),
        )
        .expect("Failed to parse media metadata");

        assert_eq!(updated_metadata.name, new_name);

        // Test changing the name of a note reference
        change_name(&note_metadata_path, "note", new_name);
        let updated_note_metadata: NoteMetadata = serde_json::from_str(
            &fs::read_to_string(note_metadata_path).expect("Failed to read note metadata file"),
        )
        .expect("Failed to parse note metadata");

        assert_eq!(updated_note_metadata.name, new_name);

        // cleanup the environment
        fs::remove_dir_all(temp_dir).expect("failed to delete test collections directory");
    }

    #[test]
    fn test_add_remove_tags() {
        // Setup the environment
        let temp_dir = Path::new("test_tags_location");
        let tag_name = "testor";
        fs::create_dir_all(temp_dir).expect("Failed to create test collections directory");

        let media_metadata_path = temp_dir.join("metadata.json");
        fs::copy(MEDIA_METADATA_PATH, media_metadata_path.clone())
            .expect("Failed to copy media metadata file");

        let note_metadata_path = temp_dir.join("metadata.note.json");
        fs::copy(NOTE_METADATA_PATH, note_metadata_path.clone())
            .expect("Failed to copy note metadata file");

        // Test adding a tag to a media reference
        add_tag(&media_metadata_path, "image", tag_name);
        let updated_metadata: Metadata = serde_json::from_str(
            &fs::read_to_string(media_metadata_path.clone())
                .expect("Failed to read media metadata file"),
        )
        .expect("Failed to parse media metadata");
        assert!(updated_metadata.tags.contains(&tag_name.to_string()));

        // Test removing a tag from a media reference
        remove_tag(&media_metadata_path, "image", tag_name);
        let updated_metadata: Metadata = serde_json::from_str(
            &fs::read_to_string(media_metadata_path.clone())
                .expect("Failed to read media metadata file"),
        )
        .expect("Failed to parse media metadata");
        assert!(!updated_metadata.tags.contains(&tag_name.to_string()));

        // Test adding a tag to a note reference
        add_tag(&note_metadata_path, "note", tag_name);
        let updated_note_metadata: NoteMetadata = serde_json::from_str(
            &fs::read_to_string(note_metadata_path.clone())
                .expect("Failed to read note metadata file"),
        )
        .expect("Failed to parse note metadata");
        assert!(updated_note_metadata.tags.contains(&tag_name.to_string()));

        // Test removing a tag from a note reference
        remove_tag(&note_metadata_path, "note", tag_name);
        let updated_note_metadata: NoteMetadata = serde_json::from_str(
            &fs::read_to_string(note_metadata_path).expect("Failed to read note metadata file"),
        )
        .expect("Failed to parse note metadata");
        assert!(!updated_note_metadata.tags.contains(&tag_name.to_string()));

        // cleanup the environment
        fs::remove_dir_all(temp_dir).expect("failed to delete test collections directory");
    }

    #[test]
    fn test_mutate_note() {
        // Setup the environment
        let temp_dir = Path::new("test_mutate_note_location");
        fs::create_dir_all(temp_dir).expect("Failed to create test collections directory");

        let note_metadata_path = temp_dir.join("metadata.note.json");
        fs::copy(NOTE_METADATA_PATH, note_metadata_path.clone())
            .expect("Failed to copy note metadata file");

        // Test mutating the note content
        let new_note_content = "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.";

        mutate_note(&note_metadata_path, "note", new_note_content);

        let updated_note_metadata: NoteMetadata = serde_json::from_str(
            &fs::read_to_string(note_metadata_path).expect("Failed to read note metadata file"),
        )
        .expect("Failed to parse note metadata");
        assert_eq!(updated_note_metadata.note_text, new_note_content);

        // Cleanup the environment
        fs::remove_dir_all(temp_dir).expect("Failed to delete test collections directory");
    }
}
