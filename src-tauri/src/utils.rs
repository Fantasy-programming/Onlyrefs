use log::info;
use palette::{white_point::D65, IntoColor, Lab, Srgba};
use rayon::prelude::*;
use serde::{de::Error, Deserialize, Deserializer};
use serde_json::Value;
use std::collections::{HashMap, VecDeque};
use std::fs::read_to_string;

use std::{fs, io, path::Path, path::PathBuf, sync::Mutex};

use crate::parser::{parse_refs, resolve_stack_items};
use crate::state::{AudioMetadata, AudioRef, Board, LinkMetadata, LinkRef, Metadata, RefMeta};
use crate::state::{DocMetadata, DocRef, NoteMetadata, NoteRef, StackMetadata, StackRef};
use crate::state::{ImageMetadata, ImageRef, Ref, Settings, VideoMetadata, VideoRef};
use crate::state::{DesignMetadata, DesignRef, ModelMetadata, ModelRef};

/// Return the size of a file in human readable format
pub fn analyze_file_size<P>(file_path: P) -> String
where
    P: AsRef<Path>,
{
    let size = fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0);
    human_size(size)
}

/// Get all subdirectories in the given path
fn get_all_refs(collections_dir: &Path) -> io::Result<Vec<Vec<PathBuf>>> {
    let result = fs::read_dir(collections_dir)?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.path().canonicalize().ok())
        .filter(|path| path.is_dir())
        .map(|dir| {
            fs::read_dir(&dir)
                .map(|entries| {
                    entries
                        .filter_map(|entry| entry.ok())
                        .map(|entry| entry.path())
                        .collect::<Vec<_>>()
                })
                .unwrap_or_else(|e| {
                    eprintln!("Failed to read directory {:?}: {}", dir, e);
                    Vec::new()
                })
        })
        .collect::<Vec<_>>();

    Ok(result)
}

// Get all references in the collections directory using parallel parsing
pub fn fetch_refs(collections_dir: &Path) -> io::Result<Mutex<Vec<Ref>>> {
    let all_refs = get_all_refs(collections_dir)?;

    // Parse refs in parallel using rayon for faster loading
    let results: Vec<Ref> = all_refs
        .par_iter()
        .filter_map(|ref_paths| match parse_refs(ref_paths) {
            Ok(ref_data) => Some(ref_data),
            Err(err) => {
                eprintln!("Failed to parse reference: {}", err);
                None
            }
        })
        .collect();

    let mut ref_vec = results;

    // Resolve stack items after all refs are loaded
    resolve_stack_items(&mut ref_vec);

    Ok(Mutex::new(ref_vec))
}

/// Fetch settings from file, returning default if file doesn't exist or is invalid
pub fn fetch_settings(settings_path: &Path) -> Mutex<Settings> {
    match fs::read_to_string(settings_path) {
        Ok(settings_str) => match serde_json::from_str(&settings_str) {
            Ok(settings) => Mutex::new(settings),
            Err(e) => {
                eprintln!("Failed to parse settings file: {}. Using defaults.", e);
                Mutex::new(Settings::default())
            }
        },
        Err(e) => {
            if e.kind() != io::ErrorKind::NotFound {
                eprintln!("Failed to read settings file: {}. Using defaults.", e);
            }
            Mutex::new(Settings::default())
        }
    }
}

/// Fetch boards from file, returning empty if file doesn't exist or is invalid
pub fn fetch_boards(boards_path: &Path) -> io::Result<Mutex<Vec<Board>>> {
    match fs::read_to_string(boards_path) {
        Ok(boards_str) => match serde_json::from_str(&boards_str) {
            Ok(boards) => Ok(Mutex::new(boards)),
            Err(e) => {
                eprintln!("Failed to parse boards file: {}. Using empty list.", e);
                Ok(Mutex::new(Vec::new()))
            }
        },
        Err(e) => {
            if e.kind() != io::ErrorKind::NotFound {
                eprintln!("Failed to read boards file: {}. Using empty list.", e);
            }
            Ok(Mutex::new(Vec::new()))
        }
    }
}

/// Save boards to file
pub fn save_boards(boards_path: &Path, boards: &[Board]) -> io::Result<()> {
    let json_data = serde_json::to_string_pretty(boards)?;
    fs::write(boards_path, json_data)?;
    Ok(())
}

/// Change name of a ref
pub fn change_name(metadata_path: &Path, new_name: &str) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Video(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Audio(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Note(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Doc(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Link(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Stack(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Design(ref mut metadata) => metadata.set_name(new_name),
        RefMeta::Model(ref mut metadata) => metadata.set_name(new_name),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Add tags to a ref
pub fn add_tag(metadata_path: &Path, tag: &str) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Video(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Audio(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Note(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Doc(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Link(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Stack(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Design(ref mut metadata) => metadata.add_tag(tag),
        RefMeta::Model(ref mut metadata) => metadata.add_tag(tag),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Remove tag from a ref
pub fn remove_tag(metadata_path: &Path, tag: &str) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Video(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Audio(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Note(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Doc(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Link(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Stack(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Design(ref mut metadata) => metadata.remove_tag(tag),
        RefMeta::Model(ref mut metadata) => metadata.remove_tag(tag),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Mutate note component from a ref
pub fn mutate_note(metadata_path: &Path, text: &str) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.update_note(text),
        RefMeta::Video(ref mut metadata) => metadata.update_note(text),
        RefMeta::Audio(ref mut metadata) => metadata.update_note(text),
        RefMeta::Note(ref mut metadata) => metadata.update_note(text),
        RefMeta::Doc(ref mut metadata) => metadata.update_note(text),
        RefMeta::Link(ref mut metadata) => metadata.update_note(text),
        RefMeta::Stack(ref mut metadata) => metadata.update_note(text),
        RefMeta::Design(ref mut metadata) => metadata.update_note(text),
        RefMeta::Model(ref mut metadata) => metadata.update_note(text),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Change board_id for a ref
pub fn change_board_id(metadata_path: &Path, board_id: Option<String>) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Video(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Audio(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Note(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Doc(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Link(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Stack(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Design(ref mut metadata) => metadata.set_board_id(board_id),
        RefMeta::Model(ref mut metadata) => metadata.set_board_id(board_id),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Change rating for a ref (0-5 stars)
pub fn change_rating(metadata_path: &Path, rating: u8) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Video(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Audio(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Note(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Doc(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Link(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Stack(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Design(ref mut metadata) => metadata.set_rating(rating),
        RefMeta::Model(ref mut metadata) => metadata.set_rating(rating),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Change source_url for a ref
pub fn change_source_url(metadata_path: &Path, url: Option<String>) -> Result<(), io::Error> {
    let metadata_json = fs::read_to_string(metadata_path)?;
    let mut ref_data: RefMeta = serde_json::from_str(&metadata_json)?;

    match ref_data {
        RefMeta::Image(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Video(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Audio(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Note(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Doc(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Link(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Stack(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Design(ref mut metadata) => metadata.set_source_url(url),
        RefMeta::Model(ref mut metadata) => metadata.set_source_url(url),
    }

    let updated_json = serde_json::to_string_pretty(&ref_data)?;
    fs::write(metadata_path, updated_json)?;

    Ok(())
}

/// Convert a file path to a string representation
/// Returns an error if the path contains invalid UTF-8
pub fn convert_file_src(file_path: &Path) -> Result<String, io::Error> {
    file_path.to_str().map(|s| s.to_string()).ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Path contains invalid UTF-8: {:?}", file_path),
        )
    })
}

/// Convert size in bytes to human-readable format
fn human_size(size: u64) -> String {
    const UNITS: [&str; 7] = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    const MULTIPLIER: f64 = 1000.0;

    let mut size = size as f64;

    if size < MULTIPLIER {
        return format!("{:.0}B", size);
    }

    for unit in &UNITS {
        size /= MULTIPLIER;
        if size < MULTIPLIER {
            let precision = if size < 10.0 {
                2
            } else if size < 100.0 {
                1
            } else {
                0
            };
            return format!("{:.*}{}", precision, round_up(size, precision), unit);
        }
    }

    format!("{:.0}{}", size.ceil(), UNITS[UNITS.len() - 1])
}

/// Round up to the specified precision
fn round_up(value: f64, precision: usize) -> f64 {
    let multiplier = 10u64.pow(precision as u32) as f64;
    (value * multiplier).ceil() / multiplier
}

/// Cache SRGBA to Lab conversions for performance
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

/// Deserialize file size from either string or number
pub fn deserialize_file_size<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Value::deserialize(deserializer)?;

    match value {
        Value::String(s) => Ok(s),
        Value::Number(n) => {
            let size = n
                .as_u64()
                .ok_or_else(|| D::Error::custom("File size number is not a valid u64"))?;
            Ok(human_size(size))
        }
        _ => Err(D::Error::custom(
            "Invalid file_size value: expected string or number",
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{ImageMetadata, NoteMetadata};
    use std::fs;
    use std::path::PathBuf;

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

        fs::create_dir(temp_dir).expect("Failed to create temp dir");
        fs::copy(original_file_path, &file_dir).expect("Failed to copy metadata file");

        (file_dir, content.to_string(), temp_dir.to_path_buf())
    }

    fn teardown(temp_dir: PathBuf) {
        fs::remove_dir_all(temp_dir).expect("Failed to delete test directory");
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

        let refs = get_all_refs(collection_dir).unwrap_or_default();
        assert_eq!(refs.len(), 2);
        assert_eq!(refs[0].len(), 0);
        assert_eq!(refs[1].len(), 0);

        teardown(collection_dir.to_path_buf())
    }

    #[test]
    fn test_change_name() {
        let (meta_path, new_name, temp_dir) =
            setup("name_1", IMAGE_METADATA_PATH, "metadata.image.json");

        // Test for image metadata
        change_name(&meta_path, &new_name).expect("Failed to change name");
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.name, new_name);
        teardown(temp_dir);

        // Test for note metadata
        let (meta_path, new_name, temp_dir) =
            setup("name_2", NOTE_METADATA_PATH, "metadata.note.json");

        change_name(&meta_path, &new_name).expect("Failed to change name");
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: NoteMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.name, new_name);
        teardown(temp_dir);
    }

    #[test]
    fn test_add_remove_tags() {
        let (meta_path, tag, temp_dir) = setup("tag_1", IMAGE_METADATA_PATH, "metadata.image.json");

        // Test adding a tag
        add_tag(&meta_path, &tag).expect("Failed to add tag");
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert!(updated_metadata.tags.contains(&tag.to_string()));

        // Test removing a tag
        remove_tag(&meta_path, &tag).expect("Failed to remove tag");
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert!(!updated_metadata.tags.contains(&tag.to_string()));

        teardown(temp_dir);
    }

    #[test]
    fn test_mutate_note() {
        let (meta_path, new_content, temp_dir) =
            setup("note_1", IMAGE_METADATA_PATH, "metadata.image.json");

        mutate_note(&meta_path, &new_content).expect("Failed to mutate note");
        let result = fs::read_to_string(&meta_path).unwrap();
        let updated_metadata: ImageMetadata = serde_json::from_str(&result).unwrap();
        assert_eq!(updated_metadata.note_text, new_content);
        teardown(temp_dir);
    }

    #[test]
    fn test_human_size() {
        assert_eq!(human_size(500), "500B");
        assert_eq!(human_size(1500), "1.50KB");
        assert_eq!(human_size(1_500_000), "1.50MB");
        assert_eq!(human_size(1_500_000_000), "1.50GB");
    }
}
