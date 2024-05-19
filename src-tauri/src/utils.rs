use log::info;
use palette::{white_point::D65, IntoColor, Lab, Srgba};
use serde::{de::Error, Deserialize, Deserializer};
use serde_json::Value;
use std::collections::{HashMap, VecDeque};
use std::fs::read_to_string;
use std::panic::PanicInfo;
use std::{fs, path::Path, path::PathBuf, sync::Mutex};

use crate::parser::parse_refs;
use crate::state::{AudioMetadata, AudioRef, LinkMetadata, LinkRef, Metadata, RefMeta};
use crate::state::{DocMetadata, DocRef, NoteMetadata, NoteRef};
use crate::state::{ImageMetadata, ImageRef, Ref, Settings, VideoMetadata, VideoRef};

/// Return the size of a file in human readable format
pub fn analyze_file_size<P>(file_path: P) -> String
where
    P: AsRef<Path>,
{
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

/// Get all references in the collections directory
pub fn fetch_refs(collections_dir: &Path) -> Mutex<Vec<Ref>> {
    let mut ref_vec: Vec<Ref> = Vec::new();
    let mut error_queue: VecDeque<std::io::Error> = VecDeque::new();

    for ref_paths in get_all_refs(collections_dir) {
        match parse_refs(&ref_paths) {
            Ok(ref_data) => ref_vec.push(ref_data),
            Err(err) => error_queue.push_back(err),
        }
    }

    if !error_queue.is_empty() {
        eprintln!("Errors encountered during reference parsing:");
        for err in error_queue.drain(..) {
            eprintln!(" - {}", err);
        }
    }

    Mutex::new(ref_vec)
}

pub fn fetch_settings(settings_path: &Path) -> Mutex<Settings> {
    let settings = fs::read_to_string(settings_path).unwrap_or_default();
    Mutex::new(serde_json::from_str(&settings).unwrap_or_else(|_| Settings::default()))
}

/// Change name of a ref
pub fn change_name(metadata_path: &Path, new_name: &str) -> Result<(), std::io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut image_ref) => (*image_ref).set_name(new_name),
        RefMeta::Video(ref mut video_ref) => (*video_ref).set_name(new_name),
        RefMeta::Audio(ref mut audio_ref) => (*audio_ref).set_name(new_name),
        RefMeta::Note(ref mut note_ref) => (*note_ref).set_name(new_name),
        RefMeta::Doc(ref mut doc_ref) => (*doc_ref).set_name(new_name),
        RefMeta::Link(ref mut link_ref) => (*link_ref).set_name(new_name),
    }

    // Convert the updated Ref back to JSON
    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    info!("Updated JSON: {}", updated_json);

    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Add tags to a ref
pub fn add_tag(metadata_path: &Path, tag: &str) -> Result<(), std::io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut image_ref) => (*image_ref).add_tag(tag),
        RefMeta::Video(ref mut video_ref) => (*video_ref).add_tag(tag),
        RefMeta::Audio(ref mut audio_ref) => (*audio_ref).add_tag(tag),
        RefMeta::Note(ref mut note_ref) => (*note_ref).add_tag(tag),
        RefMeta::Doc(ref mut doc_ref) => (*doc_ref).add_tag(tag),
        RefMeta::Link(ref mut link_ref) => (*link_ref).add_tag(tag),
    }

    // Convert the updated Ref back to JSON
    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

pub fn remove_tag(metadata_path: &Path, tag: &str) -> Result<(), std::io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut image_ref) => (*image_ref).remove_tag(tag),
        RefMeta::Video(ref mut video_ref) => (*video_ref).remove_tag(tag),
        RefMeta::Audio(ref mut audio_ref) => (*audio_ref).remove_tag(tag),
        RefMeta::Note(ref mut note_ref) => (*note_ref).remove_tag(tag),
        RefMeta::Doc(ref mut doc_ref) => (*doc_ref).remove_tag(tag),
        RefMeta::Link(ref mut link_ref) => (*link_ref).remove_tag(tag),
    }

    // Convert the updated Ref back to JSON
    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Mutate note component from a ref
pub fn mutate_note(metadata_path: &Path, text: &str) -> Result<(), std::io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut image_ref) => (*image_ref).update_note(text),
        RefMeta::Video(ref mut video_ref) => (*video_ref).update_note(text),
        RefMeta::Audio(ref mut audio_ref) => (*audio_ref).update_note(text),
        RefMeta::Note(ref mut note_ref) => (*note_ref).update_note(text),
        RefMeta::Doc(ref mut doc_ref) => (*doc_ref).update_note(text),
        RefMeta::Link(ref mut link_ref) => (*link_ref).update_note(text),
    }

    // Convert the updated Ref back to JSON
    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
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

pub fn convert_file_src(file_path: &Path) -> String {
    let protocol = "asset";
    let encoded_path = urlencoding::encode(file_path.to_str().unwrap()).into_owned();
    let os_name = get_os_name();
    if os_name == "windows" || os_name == "android" {
        format!("https://{}.localhost/{}", protocol, encoded_path)
    } else {
        format!("{}://localhost/{}", protocol, encoded_path)
    }
}

fn get_os_name() -> String {
    let os_name = std::env::consts::OS;
    if os_name == "macos" {
        "darwin".to_string()
    } else {
        os_name.to_string()
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};

    const IMAGE_METADATA_PATH: &str = "resources/metadata.image.json";
    const NOTE_METADATA_PATH: &str = "resources/metadata.note.json";

    fn setup(
        test_name: &str,
        original_file_path: &str,
        original_file_name: &str,
    ) -> (PathBuf, String, PathBuf) {
        let temp_dir_name = format!("test_{}_location", test_name);
        let temp_dir = Path::new(&temp_dir_name);
        let file_dir = temp_dir.join(original_file_name);
        let content = "random stuff";

        fs::create_dir(temp_dir).expect("Failed to copy media metadata file");
        fs::copy(original_file_path, &file_dir).expect("Failed to copy media metadata file");

        (file_dir, content.to_string(), temp_dir.to_path_buf())
    }

    fn teardown(temp_dir: PathBuf) {
        fs::remove_dir_all(temp_dir).expect("Failed to delete test collections directory");
    }

    #[test]
    fn test_analyze_file_size() {
        let file_path = Path::new("test_file.txt");
        fs::write(file_path, "This is a test file.").expect("Failed to create test file");
        let file_size = analyze_file_size(file_path);
        assert_eq!(file_size, "20B");
        fs::remove_file(file_path).expect("Failed to delete test file");
    }

    #[test]
    fn test_get_all_refs() {
        let collection_dir = Path::new("test_all_refs");
        let _ = fs::create_dir_all(collection_dir.join("dir1"));
        let _ = fs::create_dir_all(collection_dir.join("dir2"));

        let refs = get_all_refs(collection_dir);
        assert_eq!(refs.len(), 2);
        assert_eq!(refs[0].len(), 0);
        assert_eq!(refs[1].len(), 0);

        teardown(collection_dir.to_path_buf())
    }

    #[test]
    fn test_change_name() {
        let (meta_path, new_name, f) = setup("name_1", IMAGE_METADATA_PATH, "metadata.image.json");

        // Test for image metadata
        let _ = change_name(&meta_path, &new_name);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.name, new_name);
        teardown(f);

        // Test for note metadata
        let (meta_path, new_name, f) = setup("name_2", NOTE_METADATA_PATH, "metadata.note.json");

        let _ = change_name(&meta_path, &new_name);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: NoteMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.name, new_name);
        teardown(f);
    }

    #[test]
    fn test_add_remove_tags() {
        let (meta_path, new_name, f) = setup("tag_1", IMAGE_METADATA_PATH, "metadata.image.json");

        //Test adding a tag from a media reference
        let _ = add_tag(&meta_path, &new_name);
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert!(updated_metadata.tags.contains(&new_name.to_string()));

        //Test removing a tag from a media reference
        let _ = remove_tag(&meta_path, &new_name);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert!(!updated_metadata.tags.contains(&new_name.to_string()));

        teardown(f);

        let (meta_path, new_name, f) = setup("tag_2", NOTE_METADATA_PATH, "metadata.note.json");

        //Test adding a tag from a media reference
        let _ = add_tag(&meta_path, &new_name);
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: NoteMetadata = serde_json::from_str(&result).unwrap();
        assert!(updated_metadata.tags.contains(&new_name.to_string()));

        //Test removing a tag from a media reference
        let _ = remove_tag(&meta_path, &new_name);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: NoteMetadata = serde_json::from_str(&result).unwrap();
        assert!(!updated_metadata.tags.contains(&new_name.to_string()));

        teardown(f);
    }

    #[test]
    fn test_mutate_note() {
        let (meta_path, new_content, f) =
            setup("note_1", IMAGE_METADATA_PATH, "metadata.image.json");

        let _ = mutate_note(&meta_path, &new_content);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.note_text, new_content);
        teardown(f);

        let (meta_path, new_content, f) = setup("note_2", NOTE_METADATA_PATH, "metadata.note.json");

        let _ = mutate_note(&meta_path, &new_content);
        let result = fs::read_to_string(meta_path).unwrap();
        let updated_metadata: NoteMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.note_text, new_content);
        teardown(f);
    }
}
