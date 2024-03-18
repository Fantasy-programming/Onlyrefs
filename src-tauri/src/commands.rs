use crate::config::get_collection_path;
use crate::media;
use crate::state::{MediaRef, Metadata};
use crate::utils;
use chrono::Local;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::default::Default;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::State;

//TODO: Change to add to the state
#[tauri::command]
async fn generate_metadata(
    dest_path: &str,
    dest_file: &str,
    ref_id: &str,
    file_name: &str,
    collection: &str,
    state: State<'_, Mutex<Vec<MediaRef>>>,
) -> Result<(), String> {
    let metadata = Metadata {
        id: ref_id.to_string(),
        name: file_name.to_string(),
        file_name: file_name.to_string(),
        media_type: media::determine_media_type(file_name),
        dimensions: media::analyze_dimensions(dest_file),
        file_size: utils::analyze_file_size(dest_file),
        collection: collection.to_string(),
        colors: media::extract_colors(dest_file),
        created_at: Local::now().to_string(),
        updated_at: Local::now().to_string(),
        tags: Vec::new(),
    };

    // Write Json metadata file
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    let metadata_path = Path::new(dest_path).join("metadata.json");
    fs::write(metadata_path.clone(), json_data).expect("Failed to write metadata file");

    // Generate lower image
    media::generate_image(file_name, dest_file, dest_path, 500, 500, 500);

    // Store into state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let new_ref = MediaRef {
        imagepath: dest_file.to_string(),
        low_res_imagepath: dest_path.to_string() + "/lower_" + file_name,
        metapath: metadata_path.to_str().unwrap().to_string(),
        metadata: Some(metadata),
    };

    state_guard.push(new_ref);
    Ok(())
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
async fn get_media_refs(state: State<'_, Mutex<Vec<MediaRef>>>) -> Result<Vec<MediaRef>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    Ok(state_guard.clone())
}

#[tauri::command]
async fn remove_ref(ref_id: &str, state: State<'_, Mutex<Vec<MediaRef>>>) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    state_guard.retain(|media_ref| {
        if let Some(metadata) = &media_ref.metadata {
            metadata.id != ref_id
        } else {
            true
        }
    });
    Ok(())
}

#[tauri::command]
async fn add_tag(
    ref_id: &str,
    tag: &str,
    app_handle: tauri::AppHandle,
    state: State<'_, Mutex<Vec<MediaRef>>>,
) -> Result<(), String> {
    // Add tags manually
    let collections_dir = get_collection_path(&app_handle);
    utils::add_tag(&collections_dir, ref_id, tag);

    // Update state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    if let Some(media_ref) = state_guard.iter_mut().find(|media_ref| {
        if let Some(metadata) = &media_ref.metadata {
            metadata.id == ref_id
        } else {
            false
        }
    }) {
        // Add the tag to the media reference's metadata
        if let Some(metadata) = &mut media_ref.metadata {
            metadata.tags.push(tag.to_string());
            Ok(())
        } else {
            Err("Metadata is missing for the media reference".to_string())
        }
    } else {
        Err(format!("Media reference with ID '{}' not found", ref_id))
    }
}

#[tauri::command]
async fn remove_tag(
    ref_id: &str,
    tag: &str,
    app_handle: tauri::AppHandle,
    state: State<'_, Mutex<Vec<MediaRef>>>,
) -> Result<(), String> {
    let collections_dir = get_collection_path(&app_handle);
    utils::remove_tag(&collections_dir, ref_id, tag);

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    if let Some(media_ref) = state_guard.iter_mut().find(|media_ref| {
        if let Some(metadata) = &media_ref.metadata {
            metadata.id == ref_id
        } else {
            false
        }
    }) {
        if let Some(metadata) = &mut media_ref.metadata {
            metadata.tags.retain(|existing_tag| *existing_tag != tag);
            Ok(())
        } else {
            Err("Metadata is missing for the media reference".to_string())
        }
    } else {
        Err(format!("Media reference with ID '{}' not found", ref_id))
    }
}

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
    Box::new(tauri::generate_handler![
        get_media_refs,
        generate_id,
        generate_metadata,
        remove_ref,
        add_tag,
        remove_tag
    ])
}
