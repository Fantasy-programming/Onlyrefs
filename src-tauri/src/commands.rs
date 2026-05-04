use chrono::Local;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{default::Default, fs, path::Path, sync::Mutex, thread};
use tauri::ipc::Invoke;
use tauri::{generate_handler, AppHandle, Emitter, EventTarget, Manager, State};

use crate::config::{get_boards_path, get_collection_path, get_settings_path};
use crate::media;
use crate::state::{
    AudioMetadata, AudioRef, Board, DocMetadata, DocRef, ImageMetadata, ImageRef, LinkMetadata,
    LinkRef, NoteMetadata, NoteRef, Ref, Settings, StackMetadata, StackRef, VideoMetadata,
    VideoRef, DesignMetadata, DesignRef, ModelMetadata, ModelRef,
};
use crate::utils::{self, change_board_id, convert_file_src, mutate_note, save_boards};

// Get all the user refs (files)
#[tauri::command]
async fn get_all_refs(state: State<'_, Mutex<Vec<Ref>>>) -> Result<Vec<Ref>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    Ok(state_guard.clone())
}

// Get all the user settigns
#[tauri::command]
async fn get_settings(state: State<'_, Mutex<Settings>>) -> Result<Settings, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    Ok(state_guard.clone())
}

#[tauri::command]
async fn save_settings(
    settings: Settings,
    state: State<'_, Mutex<Settings>>,
    handle: AppHandle,
) -> Result<(), String> {
    let settings_path = get_settings_path(&handle);

    let json_data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, json_data)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;

    // Update the in-memory state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    *state_guard = settings.clone();

    Ok(())
}

#[tauri::command]
async fn generate_image_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<ImageRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.image.json");
    let media_path = base_path.join(file_name);
    let low_res_media_path = base_path.join("lower_".to_string() + file_name);

    // Copy file from source path to destination (backend handles the copy now)
    fs::copy(source_path, &media_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, media_path, e
        )
    })?;

    let metadata = ImageMetadata::new(ref_id.clone(), file_name, &media_path, board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, json_data)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;

    // Generate thumbnail in background thread for better performance
    let base_path_clone = base_path.clone();
    let file_name_clone = file_name.to_string();
    let media_path_clone = media_path.clone();

    let low_res_imagepath = convert_file_src(&low_res_media_path)
        .or_else(|_| convert_file_src(&media_path))
        .map_err(|e| format!("Failed to convert path: {}", e))?;

    // Spawn thumbnail generation in background
    thread::spawn(move || {
        media::generate_image(&file_name_clone, &base_path_clone, 500, 500, 500);
    });

    let new_ref = ImageRef::new(&media_path, low_res_imagepath, metadata, meta_path.clone())?;

    // Add to state before spawning color extraction thread
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    state_guard.push(Ref::Image(new_ref.clone()));
    drop(state_guard); // Release lock before spawning thread

    let ref_id_thread = ref_id.clone();
    let meta_path_thread = meta_path.clone();

    // Handle colors in a separate thread
    thread::spawn(move || -> Result<(), String> {
        // Extract colors
        let colors = media::extract_colors(&media_path_clone);

        // Update state
        let state_mutex = handle.state::<Mutex<Vec<Ref>>>();
        let mut state = state_mutex
            .lock()
            .map_err(|_| "Failed to acquire lock on state".to_string())?;

        // Find and update the reference in the state
        if let Some(ref_instance) = state.iter_mut().find(|r| r.get_id() == ref_id_thread) {
            if let Ref::Image(image_ref) = ref_instance {
                if let Some(metadata) = &mut image_ref.metadata {
                    metadata.colors = colors.clone();

                    // Write updated metadata to file
                    let json_data = serde_json::to_string_pretty(&metadata)
                        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
                    fs::write(&meta_path_thread, json_data)
                        .map_err(|e| format!("Failed to write metadata file: {}", e))?;
                }
            }
        }

        drop(state); // Release lock before emitting

        // Emit color extracted event
        handle
            .emit_to(EventTarget::any(), "colors-added", Some(colors))
            .map_err(|e| format!("Failed to emit event: {}", e))?;

        Ok(())
    });

    Ok(new_ref)
}

#[tauri::command]
async fn generate_video_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<VideoRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.video.json");
    let media_path = base_path.join(file_name);

    // Copy file from source path to destination
    fs::copy(source_path, &media_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, media_path, e
        )
    })?;

    let metadata = VideoMetadata::new(ref_id.clone(), file_name, &media_path, board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let new_ref = VideoRef::new(&media_path, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Video(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
async fn generate_audio_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<AudioRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.audio.json");
    let media_path = base_path.join(file_name);

    // Copy file from source path to destination
    fs::copy(source_path, &media_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, media_path, e
        )
    })?;

    let metadata = AudioMetadata::new(ref_id.clone(), file_name, &media_path, board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let new_ref = AudioRef::new(&media_path, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Audio(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
fn generate_note_metadata(
    ref_id: &str,
    board_id: Option<String>,
    note_content: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<NoteRef, String> {
    let base_path = get_collection_path(&handle).join(ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let note_path = base_path.join("note.text");
    let meta_path = base_path.join("metadata.note.json");

    let note_metadata = NoteMetadata::new(ref_id, board_id)?;
    let json_data = serde_json::to_string_pretty(&note_metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, json_data)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;
    fs::write(&note_path, note_content)
        .map_err(|e| format!("Failed to write note content: {}", e))?;

    // Store into state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let new_note_ref = NoteRef {
        content: note_content.to_string(),
        metadata: Some(note_metadata),
        metapath: meta_path
            .to_str()
            .ok_or("Invalid path encoding")?
            .to_string(),
    };

    state_guard.push(Ref::Note(new_note_ref.clone()));
    Ok(new_note_ref)
}

#[tauri::command]
async fn generate_doc_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<DocRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.doc.json");
    let doc_path = base_path.join(file_name);

    // Copy file from source path to destination
    fs::copy(source_path, &doc_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, doc_path, e
        )
    })?;

    let metadata = DocMetadata::new(ref_id.clone(), board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let new_ref = DocRef::new(&doc_path, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Doc(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
async fn generate_link_metadata(
    ref_id: String,
    url: String,
    board_id: Option<String>,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<LinkRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.link.json");

    let metadata = LinkMetadata::new(&ref_id, &url, board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let new_ref = LinkRef::new(None, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Link(new_ref.clone()));

    Ok(new_ref)
}

#[tauri::command]
async fn generate_design_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<DesignRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.design.json");
    let design_path = base_path.join(file_name);

    // Copy file from source path to destination
    fs::copy(source_path, &design_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, design_path, e
        )
    })?;

    let mut metadata = DesignMetadata::new(ref_id.clone(), file_name, &design_path, board_id)?;
    
    // Try to extract additional info for PSD files
    let extension = file_name.split('.').last().unwrap_or("").to_lowercase();
    if extension == "psd" {
        if let Ok(psd_info) = media::extract_psd_info(&design_path) {
            metadata.dimensions = psd_info.dimensions;
            metadata.layer_count = psd_info.layer_count;
            metadata.color_mode = psd_info.color_mode;
        }
    }

    let json_data = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, json_data)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;

    // Generate thumbnail in background for PSD files
    let thumbnail_path_str = if extension == "psd" {
        let base_path_clone = base_path.clone();
        let file_name_clone = file_name.to_string();
        let design_path_clone = design_path.clone();
        
        thread::spawn(move || {
            media::generate_psd_thumbnail(&file_name_clone, &base_path_clone, &design_path_clone);
        });
        
        // Return expected thumbnail path (will be created async)
        let thumbnail_file = format!("thumbnail_{}.png", file_name);
        let thumb_path = base_path.join(&thumbnail_file);
        utils::convert_file_src(&thumb_path).unwrap_or_default()
    } else {
        String::new()
    };

    let new_ref = DesignRef::new(&design_path, thumbnail_path_str, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Design(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
async fn generate_model_metadata(
    ref_id: String,
    board_id: Option<String>,
    file_name: &str,
    source_path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<ModelRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.model.json");
    let model_path = base_path.join(file_name);

    // Copy file from source path to destination
    fs::copy(source_path, &model_path).map_err(|e| {
        format!(
            "Failed to copy file from {} to {:?}: {}",
            source_path, model_path, e
        )
    })?;

    let metadata = ModelMetadata::new(ref_id.clone(), file_name, &model_path, board_id)?;
    let json_data = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, json_data)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;

    // No server-side thumbnail for 3D models - handled in frontend with Three.js
    let new_ref = ModelRef::new(&model_path, String::new(), metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Model(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
async fn rename_ref(
    ref_id: &str,
    new_name: &str,
    path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::change_name(location, new_name).map_err(|e| format!("Failed to change name: {}", e))?;

    // Now update the state with the new name
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Find reference by ID
    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    // Handle missing reference
    let metadata = found_ref.get_ref_meta()?;
    metadata.set_name(new_name);

    Ok(())
}

#[tauri::command]
async fn remove_ref(ref_id: &str, state: State<'_, Mutex<Vec<Ref>>>) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let initial_len = state_guard.len();
    state_guard.retain(|ref_instance| ref_instance.get_id() != ref_id);

    if state_guard.len() == initial_len {
        return Err(format!("Reference with ID '{}' not found", ref_id));
    }

    Ok(())
}

#[tauri::command]
async fn add_tag(
    ref_id: &str,
    path: &str,
    tag: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::add_tag(location, tag).map_err(|e| format!("Failed to add tag: {}", e))?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.add_tag(tag);

    Ok(())
}

#[tauri::command]
async fn remove_tag(
    ref_id: &str,
    path: &str,
    tag: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::remove_tag(location, tag).map_err(|e| format!("Failed to remove tag: {}", e))?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.remove_tag(tag);

    Ok(())
}

#[tauri::command]
async fn change_note_content(
    ref_id: &str,
    note_content: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<(), String> {
    // Write to file first
    let base_path = get_collection_path(&handle).join(ref_id).join("note.text");
    fs::write(&base_path, note_content)
        .map_err(|e| format!("Failed to write note content: {}", e))?;

    // Update the state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    if let Ref::Note(note_ref) = found_ref {
        note_ref.content = note_content.to_string();
        Ok(())
    } else {
        Err("Invalid reference type for note content".to_string())
    }
}

#[tauri::command]
async fn change_note_text(
    ref_id: &str,
    note_text: &str,
    path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    mutate_note(location, note_text).map_err(|e| format!("Failed to mutate note: {}", e))?;

    // Update the state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.update_note(note_text);

    Ok(())
}

#[tauri::command]
async fn set_board_id(
    ref_id: &str,
    board_id: Option<String>,
    path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    change_board_id(location, board_id.clone())
        .map_err(|e| format!("Failed to change board_id: {}", e))?;

    // Update the state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.set_board_id(board_id);

    Ok(())
}

#[tauri::command]
async fn set_rating(
    ref_id: &str,
    rating: u8,
    path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::change_rating(location, rating)
        .map_err(|e| format!("Failed to change rating: {}", e))?;

    // Update the state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.set_rating(rating);

    Ok(())
}

#[tauri::command]
async fn set_source_url(
    ref_id: &str,
    url: Option<String>,
    path: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::change_source_url(location, url.clone())
        .map_err(|e| format!("Failed to change source_url: {}", e))?;

    // Update the state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id)
        .ok_or_else(|| format!("Reference with ID '{}' not found", ref_id))?;

    let metadata = found_ref.get_ref_meta()?;
    metadata.set_source_url(url);

    Ok(())
}

#[tauri::command]
fn generate_id(length: usize) -> String {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::rng();

    let id: String = (0..length)
        .map(|_| {
            let idx = rng.random_range(0..characters.len());
            characters.chars().nth(idx).unwrap()
        })
        .collect();

    id
}

// ============= Stack Commands =============

/// Create a stack from selected refs
#[tauri::command]
async fn create_stack(
    ref_ids: Vec<String>,
    board_id: Option<String>,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<StackRef, String> {
    if ref_ids.len() < 2 {
        return Err("A stack requires at least 2 items".to_string());
    }

    // Generate stack ID
    let stack_id = generate_id(13);
    let base_path = get_collection_path(&handle).join(&stack_id);

    // Ensure directory exists
    fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let meta_path = base_path.join("metadata.stack.json");

    // Cover is the last item (most recently added)
    let cover_id = ref_ids.last().cloned().unwrap_or_default();

    // Create metadata
    let metadata = StackMetadata::new(stack_id.clone(), board_id, ref_ids.clone(), cover_id)?;
    let json_data = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, json_data)
        .map_err(|e| format!("Failed to write metadata file: {}", e))?;

    // Resolve items from state
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let items: Vec<Box<Ref>> = ref_ids
        .iter()
        .filter_map(|id| {
            state_guard
                .iter()
                .find(|r| r.get_id() == id)
                .map(|r| Box::new(r.clone()))
        })
        .collect();

    drop(state_guard);

    let new_stack = StackRef {
        items,
        metadata: Some(metadata),
        metapath: meta_path
            .to_str()
            .ok_or("Invalid path encoding")?
            .to_string(),
    };

    // Add to state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    state_guard.push(Ref::Stack(new_stack.clone()));

    Ok(new_stack)
}

/// Add refs to an existing stack
#[tauri::command]
async fn add_to_stack(
    stack_id: String,
    ref_ids: Vec<String>,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // First, collect the new items while borrowing state_guard immutably
    let new_items: Vec<Box<Ref>> = ref_ids
        .iter()
        .filter_map(|id| {
            state_guard
                .iter()
                .find(|r| r.get_id() == *id && !matches!(r, Ref::Stack(_)))
                .map(|r| Box::new(r.clone()))
        })
        .collect();

    // Now find the stack and modify it
    let stack = state_guard
        .iter_mut()
        .find(|r| r.get_id() == stack_id)
        .ok_or_else(|| format!("Stack with ID '{}' not found", stack_id))?;

    if let Ref::Stack(stack_ref) = stack {
        let metadata = stack_ref
            .metadata
            .as_mut()
            .ok_or("Stack metadata is None")?;

        // Add new item IDs (avoid duplicates)
        for id in &ref_ids {
            if !metadata.item_ids.contains(id) {
                metadata.item_ids.push(id.clone());
            }
        }

        // Update cover to most recently added
        if let Some(last_id) = ref_ids.last() {
            metadata.cover_id = last_id.clone();
        }

        metadata.updated_at = Local::now().to_string();

        // Write updated metadata to file
        let json_data = serde_json::to_string_pretty(&metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        fs::write(&stack_ref.metapath, json_data)
            .map_err(|e| format!("Failed to write metadata file: {}", e))?;

        // Add the resolved items to stack
        stack_ref.items.extend(new_items);

        Ok(())
    } else {
        Err("Reference is not a stack".to_string())
    }
}

/// Remove refs from a stack (but keep the refs themselves)
#[tauri::command]
async fn remove_from_stack(
    stack_id: String,
    ref_ids: Vec<String>,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Find the stack index
    let stack_idx = state_guard
        .iter()
        .position(|r| r.get_id() == stack_id)
        .ok_or_else(|| format!("Stack with ID '{}' not found", stack_id))?;

    if let Ref::Stack(stack_ref) = &mut state_guard[stack_idx] {
        let metadata = stack_ref
            .metadata
            .as_mut()
            .ok_or("Stack metadata is None")?;

        // Remove item IDs
        metadata.item_ids.retain(|id| !ref_ids.contains(id));

        // Remove from resolved items
        stack_ref
            .items
            .retain(|item| !ref_ids.contains(&item.get_id().to_string()));

        // If stack has 0-1 items, auto-unstack
        if metadata.item_ids.len() <= 1 {
            // Delete the stack metadata file
            let base_path = get_collection_path(&handle).join(&stack_id);
            if base_path.exists() {
                fs::remove_dir_all(&base_path)
                    .map_err(|e| format!("Failed to delete stack directory: {}", e))?;
            }

            // Remove stack from state
            state_guard.remove(stack_idx);

            return Ok(());
        }

        // Update cover if it was removed
        if ref_ids.contains(&metadata.cover_id) {
            metadata.cover_id = metadata.item_ids.last().cloned().unwrap_or_default();
        }

        metadata.updated_at = Local::now().to_string();

        // Write updated metadata to file
        let json_data = serde_json::to_string_pretty(&metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        fs::write(&stack_ref.metapath, json_data)
            .map_err(|e| format!("Failed to write metadata file: {}", e))?;

        Ok(())
    } else {
        Err("Reference is not a stack".to_string())
    }
}

/// Unstack - delete stack but keep all contained refs
#[tauri::command]
async fn unstack(
    stack_id: String,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Find and remove the stack
    let stack_idx = state_guard
        .iter()
        .position(|r| r.get_id() == stack_id)
        .ok_or_else(|| format!("Stack with ID '{}' not found", stack_id))?;

    // Delete the stack metadata file/directory
    let base_path = get_collection_path(&handle).join(&stack_id);
    if base_path.exists() {
        fs::remove_dir_all(&base_path)
            .map_err(|e| format!("Failed to delete stack directory: {}", e))?;
    }

    // Remove stack from state (refs remain)
    state_guard.remove(stack_idx);

    Ok(())
}

/// Set a specific cover for a stack
#[tauri::command]
async fn set_stack_cover(
    stack_id: String,
    cover_id: String,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Find the stack
    let stack = state_guard
        .iter_mut()
        .find(|r| r.get_id() == stack_id)
        .ok_or_else(|| format!("Stack with ID '{}' not found", stack_id))?;

    if let Ref::Stack(stack_ref) = stack {
        let metadata = stack_ref
            .metadata
            .as_mut()
            .ok_or("Stack metadata is None")?;

        // Verify cover_id is in the stack
        if !metadata.item_ids.contains(&cover_id) {
            return Err(format!("Item '{}' is not in this stack", cover_id));
        }

        metadata.cover_id = cover_id;
        metadata.updated_at = Local::now().to_string();

        // Write updated metadata to file
        let json_data = serde_json::to_string_pretty(&metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        fs::write(&stack_ref.metapath, json_data)
            .map_err(|e| format!("Failed to write metadata file: {}", e))?;

        Ok(())
    } else {
        Err("Reference is not a stack".to_string())
    }
}

// ============= Board Commands =============

/// Get all boards
#[tauri::command]
async fn get_boards(state: State<'_, Mutex<Vec<Board>>>) -> Result<Vec<Board>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;
    Ok(state_guard.clone())
}

/// Create a new board
#[tauri::command]
async fn create_board(
    name: String,
    parent_id: Option<String>,
    state: State<'_, Mutex<Vec<Board>>>,
    handle: AppHandle,
) -> Result<Board, String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    // Check for unique name among siblings
    let has_duplicate = state_guard
        .iter()
        .any(|b| b.name == name && b.parent_id == parent_id);

    if has_duplicate {
        return Err(format!(
            "A board named '{}' already exists at this level",
            name
        ));
    }

    // Generate board ID
    let board_id = generate_id(13);

    let new_board = Board {
        id: board_id.clone(),
        name,
        parent_id,
        created_at: Local::now().to_string(),
        color: None,
    };

    state_guard.push(new_board.clone());

    // Persist to file
    let boards_path = get_boards_path(&handle);
    save_boards(&boards_path, &state_guard).map_err(|e| format!("Failed to save boards: {}", e))?;

    Ok(new_board)
}

/// Rename a board
#[tauri::command]
async fn rename_board(
    board_id: String,
    new_name: String,
    state: State<'_, Mutex<Vec<Board>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    // Find the board
    let board = state_guard
        .iter_mut()
        .find(|b| b.id == board_id)
        .ok_or_else(|| format!("Board with ID '{}' not found", board_id))?;

    let parent_id = board.parent_id.clone();

    // Check for unique name among siblings (excluding self)
    let has_duplicate = state_guard
        .iter()
        .any(|b| b.id != board_id && b.name == new_name && b.parent_id == parent_id);

    if has_duplicate {
        return Err(format!(
            "A board named '{}' already exists at this level",
            new_name
        ));
    }

    // Update the name
    let board = state_guard.iter_mut().find(|b| b.id == board_id).unwrap();
    board.name = new_name;

    // Persist to file
    let boards_path = get_boards_path(&handle);
    save_boards(&boards_path, &state_guard).map_err(|e| format!("Failed to save boards: {}", e))?;

    Ok(())
}

/// Update a board's color
#[tauri::command]
async fn update_board_color(
    board_id: String,
    color: Option<String>,
    state: State<'_, Mutex<Vec<Board>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    // Find and update the board's color
    let board = state_guard
        .iter_mut()
        .find(|b| b.id == board_id)
        .ok_or_else(|| format!("Board with ID '{}' not found", board_id))?;

    board.color = color;

    // Persist to file
    let boards_path = get_boards_path(&handle);
    save_boards(&boards_path, &state_guard).map_err(|e| format!("Failed to save boards: {}", e))?;

    Ok(())
}

/// Move a board to a new parent
#[tauri::command]
async fn move_board(
    board_id: String,
    new_parent_id: Option<String>,
    state: State<'_, Mutex<Vec<Board>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    // Find the board
    let board = state_guard
        .iter()
        .find(|b| b.id == board_id)
        .ok_or_else(|| format!("Board with ID '{}' not found", board_id))?;

    let board_name = board.name.clone();

    // Check we're not moving to self or a descendant
    if let Some(ref new_parent) = new_parent_id {
        if new_parent == &board_id {
            return Err("Cannot move board to itself".to_string());
        }
        // Check if new_parent is a descendant of board_id
        let mut current = new_parent.clone();
        while let Some(parent) = state_guard.iter().find(|b| b.id == current) {
            if let Some(ref pid) = parent.parent_id {
                if pid == &board_id {
                    return Err("Cannot move board to one of its descendants".to_string());
                }
                current = pid.clone();
            } else {
                break;
            }
        }
    }

    // Check for unique name among new siblings
    let has_duplicate = state_guard
        .iter()
        .any(|b| b.id != board_id && b.name == board_name && b.parent_id == new_parent_id);

    if has_duplicate {
        return Err(format!(
            "A board named '{}' already exists at the destination",
            board_name
        ));
    }

    // Update the parent
    let board = state_guard.iter_mut().find(|b| b.id == board_id).unwrap();
    board.parent_id = new_parent_id;

    // Persist to file
    let boards_path = get_boards_path(&handle);
    save_boards(&boards_path, &state_guard).map_err(|e| format!("Failed to save boards: {}", e))?;

    Ok(())
}

/// Delete a board (moves refs to parent)
#[tauri::command]
async fn delete_board(
    board_id: String,
    boards_state: State<'_, Mutex<Vec<Board>>>,
    refs_state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut boards_guard = boards_state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    // Find the board to delete
    let board_idx = boards_guard
        .iter()
        .position(|b| b.id == board_id)
        .ok_or_else(|| format!("Board with ID '{}' not found", board_id))?;

    let parent_id = boards_guard[board_idx].parent_id.clone();

    // Move all child boards to the deleted board's parent
    for board in boards_guard.iter_mut() {
        if board.parent_id == Some(board_id.clone()) {
            board.parent_id = parent_id.clone();
        }
    }

    // Remove the board
    boards_guard.remove(board_idx);

    // Persist boards to file
    let boards_path = get_boards_path(&handle);
    save_boards(&boards_path, &boards_guard)
        .map_err(|e| format!("Failed to save boards: {}", e))?;

    drop(boards_guard);

    // Move refs from deleted board to parent board
    let mut refs_guard = refs_state
        .lock()
        .map_err(|_| "Failed to acquire lock on refs state".to_string())?;

    let collections_dir = get_collection_path(&handle);

    for ref_instance in refs_guard.iter_mut() {
        let metadata = ref_instance.get_ref_meta()?;
        if metadata.get_board_id() == Some(&board_id) {
            metadata.set_board_id(parent_id.clone());

            // Update the metadata file on disk
            let ref_id = ref_instance.get_id();
            let ref_dir = collections_dir.join(ref_id);

            // Find the metadata file
            if let Ok(entries) = fs::read_dir(&ref_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        if name.starts_with("metadata.") && name.ends_with(".json") {
                            let _ = change_board_id(&path, parent_id.clone());
                            break;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// Get all descendant board IDs for a given board (for filtering)
#[tauri::command]
async fn get_board_descendants(
    board_id: String,
    state: State<'_, Mutex<Vec<Board>>>,
) -> Result<Vec<String>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on boards state".to_string())?;

    let mut descendants = Vec::new();
    let mut to_process = vec![board_id.clone()];

    while let Some(current_id) = to_process.pop() {
        for board in state_guard.iter() {
            if board.parent_id == Some(current_id.clone()) {
                descendants.push(board.id.clone());
                to_process.push(board.id.clone());
            }
        }
    }

    Ok(descendants)
}

/// Open a file in the system's default external application
#[tauri::command]
async fn open_file_external(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    
    Ok(())
}

pub fn get_handlers() -> impl Fn(Invoke<tauri::Wry>) -> bool + Send + Sync + 'static {
    generate_handler![
        generate_id,
        generate_image_metadata,
        generate_video_metadata,
        generate_audio_metadata,
        generate_note_metadata,
        generate_doc_metadata,
        generate_link_metadata,
        generate_design_metadata,
        generate_model_metadata,
        get_all_refs,
        get_settings,
        save_settings,
        rename_ref,
        remove_ref,
        add_tag,
        remove_tag,
        change_note_content,
        change_note_text,
        set_board_id,
        set_rating,
        set_source_url,
        create_stack,
        add_to_stack,
        remove_from_stack,
        unstack,
        set_stack_cover,
        // Board commands
        get_boards,
        create_board,
        rename_board,
        update_board_color,
        move_board,
        delete_board,
        get_board_descendants,
        // File operations
        open_file_external,
        // Independent canvas commands
        crate::canvas::get_canvases,
        crate::canvas::create_canvas,
        crate::canvas::rename_canvas,
        crate::canvas::delete_independent_canvas,
        crate::canvas::load_independent_canvas,
        crate::canvas::save_independent_canvas,
    ]
}
