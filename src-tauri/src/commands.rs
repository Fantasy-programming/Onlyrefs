use chrono::Local;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::thread::sleep;
use std::time::Duration;
use std::{default::Default, fs, path::Path, sync::Mutex, thread};
use tauri::{AppHandle, Manager, State, WindowBuilder, WindowUrl};
use tauri_plugin_snapshot::{snapshot, Options, Region};

use crate::config::get_collection_path;
use crate::media;
use crate::state::{
    AudioMetadata, AudioRef, DocMetadata, DocRef, ImageMetadata, ImageRef, LinkMetadata, LinkRef,
    NoteMetadata, NoteRef, Ref, Settings, VideoMetadata, VideoRef,
};
use crate::utils::{self, convert_file_src};

#[tauri::command]
async fn get_all_refs(state: State<'_, Mutex<Vec<Ref>>>) -> Result<Vec<Ref>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    Ok(state_guard.clone())
}

#[tauri::command]
async fn get_settings(state: State<'_, Mutex<Settings>>) -> Result<Settings, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;
    Ok(state_guard.clone())
}

#[tauri::command]
async fn generate_image_metadata(
    ref_id: String,
    collection: &str,
    file_name: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<ImageRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);
    let meta_path = base_path.join("metadata.image.json");
    let media_path = base_path.join(file_name);
    let low_res_media_path = base_path.join("lower_".to_string() + file_name);

    let metadata = ImageMetadata::new(ref_id.clone(), file_name, &media_path, collection)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let low_res_imagepath = if media::generate_image(file_name, &base_path, 500, 500, 500) {
        convert_file_src(&low_res_media_path)
    } else {
        convert_file_src(&media_path)
    };

    let new_ref = ImageRef::new(&media_path, low_res_imagepath, metadata, meta_path.clone())?;

    let new_rf_thread = new_ref.clone();
    let ref_id_thread = ref_id.clone();

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Handle colors in a separate thread
    thread::spawn(move || -> Result<(), String> {
        // extract colors
        let colors = media::extract_colors(&media_path);
        let mut metadata = new_rf_thread.metadata.as_ref().unwrap().clone();
        metadata.colors = colors.clone();

        let json_data = serde_json::to_string_pretty(&metadata).unwrap();
        fs::write(meta_path, json_data).expect("Failed to write metadata file");

        let state_mutex = handle.state::<Mutex<Vec<Ref>>>();
        let state = state_mutex
            .lock()
            .map_err(|_| "Failed to acquire lock on state".to_string())?;

        // find the reference in the state and update the colors
        state.iter().find(|ref_instance| match ref_instance {
            Ref::Image(media_ref) => {
                if let Some(metadata) = &media_ref.metadata {
                    metadata.id == ref_id_thread
                } else {
                    false
                }
            }
            _ => false,
        });

        //emit color extracted event
        handle.emit_all("colors-added", Some(colors)).unwrap();

        Ok(())
    });

    state_guard.push(Ref::Image(new_ref.clone()));
    Ok(new_ref)
}

#[tauri::command]
async fn generate_video_metadata(
    ref_id: String,
    collection: &str,
    file_name: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<VideoRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);
    let meta_path = base_path.join("metadata.video.json");
    let media_path = base_path.join(file_name);

    let metadata = VideoMetadata::new(ref_id.clone(), file_name, &media_path, collection)?;
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
    collection: &str,
    file_name: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<AudioRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);
    let meta_path = base_path.join("metadata.audio.json");
    let media_path = base_path.join(file_name);

    let metadata = AudioMetadata::new(ref_id.clone(), file_name, &media_path, collection)?;
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
    collection: &str,
    note_content: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<NoteRef, String> {
    let meta_path = get_collection_path(&handle)
        .join(ref_id)
        .join("metadata.note.json");

    let note_metadata = NoteMetadata::new(ref_id, collection)?;
    let json_data = serde_json::to_string_pretty(&note_metadata).unwrap();
    fs::write(&meta_path, json_data).expect("Failed to write metadata file");

    // Store into state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let new_note_ref = NoteRef {
        content: note_content.to_string(),
        metadata: Some(note_metadata),
        metapath: meta_path.to_str().unwrap().to_string(),
    };

    state_guard.push(Ref::Note(new_note_ref.clone()));
    Ok(new_note_ref)
}

#[tauri::command]
async fn generate_doc_metadata(
    ref_id: String,
    collection: &str,
    file_name: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<DocRef, String> {
    let base_path = get_collection_path(&handle).join(&ref_id);
    let meta_path = base_path.join("metadata.doc.json");
    let doc_path = base_path.join(file_name);

    let metadata = DocMetadata::new(ref_id.clone(), collection)?;
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
    collection: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<LinkRef, String> {
    let meta_path = get_collection_path(&handle)
        .join(&ref_id)
        .join("metadata.link.json");

    let metadata = LinkMetadata::new(&ref_id, &url, collection)?;
    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let new_ref = LinkRef::new(None, metadata, meta_path.clone())?;

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.push(Ref::Link(new_ref.clone()));

    std::thread::spawn(move || -> Result<(), String> {
        let window = tauri::WindowBuilder::new(
            &handle,
            "capture",
            WindowUrl::External(url.parse().unwrap()),
        )
        .build()
        .unwrap();

        let options = Options {
            capture: None,
            region: Some(Region::Document),
            save: None,
        };

        let _ = window.hide();

        // wait 30s then take the shoot
        sleep(Duration::from_secs(30));
        let img_buffer = snapshot(window.clone(), options).map_err(|error| error.to_string());
        let _ = window.close();

        // save image to disk
        let img_path = get_collection_path(&handle).join("snapshot.png");
        fs::write(&img_path, img_buffer.unwrap()).expect("Failed to write image to disk");

        // update the image state

        let state_mutex = handle.state::<Mutex<Vec<Ref>>>();
        let mut state = state_mutex
            .lock()
            .map_err(|_| "Failed to acquire lock on state".to_string())?;

        let found_ref = state
            .iter_mut()
            .find(|ref_instance| ref_instance.get_id() == ref_id);

        match found_ref.unwrap() {
            Ref::Link(ref mut link_ref) => {
                link_ref.snapshoot = convert_file_src(&img_path);
                Ok(())
            }
            _ => Err("Invalid reference type for note content".to_string()),
        }
    });

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
    let result = utils::change_name(location, new_name);
    result.map_err(|e| e.to_string())?;

    // Now update the state with the new name
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    // Find reference by ID
    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id);

    // Handle missing reference
    if found_ref.is_none() {
        return Err(format!("Reference with ID '{}' not found", ref_id));
    }

    let metadata = found_ref.unwrap().get_ref_meta().unwrap();
    metadata.set_name(new_name);
    Ok(())
}

#[tauri::command]
async fn remove_ref(ref_id: &str, state: State<'_, Mutex<Vec<Ref>>>) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.retain(|ref_instance| ref_instance.get_id() != ref_id);

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
    let _ = utils::add_tag(location, tag);

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id);

    if found_ref.is_none() {
        return Err(format!("Reference with ID '{}' not found", ref_id));
    }

    let metadata = found_ref.unwrap().get_ref_meta().unwrap();
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
    let _ = utils::remove_tag(location, tag);

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id);

    if found_ref.is_none() {
        return Err(format!("Reference with ID '{}' not found", ref_id));
    }

    let metadata = found_ref.unwrap().get_ref_meta().unwrap();
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
    // Write to file
    let base_path = get_collection_path(&handle).join(ref_id).join("note.text");
    fs::write(base_path, note_content).expect("Failed to write note content to disk");

    // Now update the state with the new name
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let found_ref = state_guard
        .iter_mut()
        .find(|ref_instance| ref_instance.get_id() == ref_id);

    match found_ref.unwrap() {
        Ref::Note(ref mut note_ref) => {
            note_ref.content = note_content.to_string();
            Ok(())
        }
        _ => Err("Invalid reference type for note content".to_string()),
    }
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
    Box::new(tauri::generate_handler![
        generate_id,
        generate_image_metadata,
        generate_video_metadata,
        generate_audio_metadata,
        generate_note_metadata,
        generate_doc_metadata,
        generate_link_metadata,
        get_all_refs,
        get_settings,
        rename_ref,
        remove_ref,
        add_tag,
        remove_tag,
        change_note_content,
    ])
}
