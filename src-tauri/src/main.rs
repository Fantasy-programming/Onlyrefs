// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use image::GenericImageView;
use mime_guess::from_path;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;
use window_shadows::set_shadow;

#[derive(Serialize, Deserialize)]
struct Metadata {
    id: String,
    file_name: String,
    media_type: String,
    dimensions: Option<(u32, u32)>,
    file_size: u64,
    collection: String,
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
        file_name: file_name.to_string(),
        media_type: determine_media_type(file_name),
        dimensions: analyze_dimensions(dest_file),
        file_size: analyze_file_size(dest_file),
        collection: collection.to_string(),
    };

    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    let metada_path = Path::new(dest_path).join("metadata.json");
    fs::write(metada_path, json_data).expect("Failed to write metadata file");
}

fn determine_media_type(file_name: &str) -> String {
    if let Some(media_type) = from_path(file_name).first() {
        media_type.to_string()
    } else {
        "application/octet-stream".to_string()
    }
}

fn analyze_dimensions(file_name: &str) -> Option<(u32, u32)> {
    // Use the image crate to open the image and retrieve its dimensions
    if let Ok(image) = image::open(file_name) {
        Some(image.dimensions())
    } else {
        // Return None if dimensions cannot be determined (e.g., non-image file)
        None
    }
}

fn analyze_file_size(file_path: &str) -> u64 {
    fs::metadata(file_path).map(|meta| meta.len()).unwrap_or(0)
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

#[tauri::command]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![generate_id, generate_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
