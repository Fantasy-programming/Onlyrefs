use crate::utils;
use chrono::Local;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct Metadata {
    id: String,
    file_name: String,
    name: String,
    media_type: String,
    dimensions: Option<(u32, u32)>,
    file_size: u64,
    collection: String,
    colors: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[tauri::command]
fn generate_metadata(
    dest_path: &str,
    dest_file: &str,
    ref_id: &str,
    file_name: &str,
    collection: &str,
) {
    let metadata = Metadata {
        id: ref_id.to_string(),
        name: file_name.to_string(),
        file_name: file_name.to_string(),
        media_type: utils::determine_media_type(file_name),
        dimensions: utils::analyze_dimensions(dest_file),
        file_size: utils::analyze_file_size(dest_file),
        collection: collection.to_string(),
        colors: utils::extract_colors(dest_file),
        created_at: Local::now().to_string(),
        updated_at: Local::now().to_string(),
    };

    // Write Json metadata file
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    let metada_path = Path::new(dest_path).join("metadata.json");
    fs::write(metada_path, json_data).expect("Failed to write metadata file");

    // Generate lower image
    utils::generate_image(file_name, dest_file, dest_path, 500, 500, 500);
}

#[tauri::command]
fn generate_id(lenght: usize) -> String {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();

    let id: String = (0..lenght)
        .map(|_| {
            let idx = rng.gen_range(0..characters.len());
            characters.chars().nth(idx).unwrap()
        })
        .collect();

    id
}

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
    Box::new(tauri::generate_handler![generate_id, generate_metadata])
}
