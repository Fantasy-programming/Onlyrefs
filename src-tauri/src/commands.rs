use chrono::Local;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{default::Default, fs, path::Path, sync::Mutex, thread};
use tauri::{AppHandle, Manager, State, WindowBuilder, WindowUrl};

use crate::config::get_collection_path;
use crate::media;
use crate::state::{MediaRef, Metadata, NoteMetadata, NoteRef, Ref, Settings};
use crate::utils::{self, convert_file_src};

#[tauri::command]
async fn generate_media_metadata(
    ref_id: String,
    file_name: &str,
    collection: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
    handle: AppHandle,
) -> Result<MediaRef, String> {
    // Get setup paths
    let base_path = get_collection_path(&handle).join(&ref_id);
    let media_path = base_path.join(file_name);
    let meta_path = base_path.join("metadata.json");
    let low_res_media_path = base_path.join("lower_".to_string() + file_name);

    let metadata = Metadata::new(ref_id.clone(), file_name, &media_path, collection)?;

    let json_data = serde_json::to_string_pretty(&metadata).expect("Failed to serialize metadata");
    fs::write(meta_path.clone(), json_data).expect("Failed to write metadata file");

    let low_res_imagepath = if media::generate_image(file_name, &base_path, 500, 500, 500) {
        convert_file_src(&low_res_media_path)
    } else {
        convert_file_src(&media_path)
    };

    let new_ref = MediaRef::new(&media_path, low_res_imagepath, &meta_path, metadata)?;

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
            Ref::Media(media_ref) => {
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

    state_guard.push(Ref::Media(new_ref.clone()));
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

    let note_metadata = NoteMetadata::new(ref_id, note_content, collection)?;
    let json_data = serde_json::to_string_pretty(&note_metadata).unwrap();

    fs::write(&meta_path, json_data).expect("Failed to write metadata file");

    // Store into state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    let new_note_ref = NoteRef {
        metapath: meta_path.to_str().unwrap().to_string(),
        metadata: Some(note_metadata),
    };

    state_guard.push(Ref::Note(new_note_ref.clone()));
    Ok(new_note_ref)
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
async fn get_media_refs(state: State<'_, Mutex<Vec<Ref>>>) -> Result<Vec<Ref>, String> {
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
async fn rename_ref(
    ref_id: &str,
    new_name: &str,
    path: &str,
    ref_type: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::change_name(location, ref_type, new_name);

    // Now update the state with the new name
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    for ref_instance in state_guard.iter_mut() {
        match ref_instance {
            Ref::Media(media_ref)
                if media_ref.metadata.as_ref().map(|m| m.id.as_str()) == Some(ref_id) =>
            {
                if let Some(metadata) = media_ref.metadata.as_mut() {
                    metadata.name = new_name.to_string();
                }
            }
            Ref::Note(note_ref)
                if note_ref.metadata.as_ref().map(|m| m.id.as_str()) == Some(ref_id) =>
            {
                if let Some(metadata) = note_ref.metadata.as_mut() {
                    metadata.name = new_name.to_string();
                }
            }
            _ => {}
        }
    }

    Ok(())
}

#[tauri::command]
async fn change_note_content(
    ref_id: &str,
    path: &str,
    note_content: &str,
    ref_type: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::mutate_note(location, ref_type, note_content);

    // Now update the state with the new name
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    for ref_instance in state_guard.iter_mut() {
        match ref_instance {
            Ref::Note(note_ref)
                if note_ref.metadata.as_ref().map(|m| m.id.as_str()) == Some(ref_id) =>
            {
                if let Some(metadata) = note_ref.metadata.as_mut() {
                    metadata.note_text = note_content.to_string();
                }
            }
            _ => {}
        }
    }

    Ok(())
}

#[tauri::command]
async fn remove_ref(ref_id: &str, state: State<'_, Mutex<Vec<Ref>>>) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    state_guard.retain(|ref_instance| match ref_instance {
        Ref::Media(media_ref) => {
            if let Some(metadata) = &media_ref.metadata {
                metadata.id != ref_id
            } else {
                true
            }
        }
        Ref::Note(note_ref) => {
            if let Some(metadata) = &note_ref.metadata {
                metadata.id != ref_id
            } else {
                true
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn add_tag(
    ref_id: &str,
    path: &str,
    tag: &str,
    ref_type: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::add_tag(location, ref_type, tag);

    // Update state
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    if let Some(ref_instance) = state_guard
        .iter_mut()
        .find(|ref_instance| match ref_instance {
            Ref::Media(media_ref) => {
                if let Some(metadata) = &media_ref.metadata {
                    metadata.id == ref_id
                } else {
                    false
                }
            }
            Ref::Note(note_ref) => {
                if let Some(metadata) = &note_ref.metadata {
                    metadata.id == ref_id
                } else {
                    false
                }
            }
        })
    {
        match ref_instance {
            Ref::Media(media_ref) => {
                if let Some(metadata) = &mut media_ref.metadata {
                    metadata.tags.push(tag.to_string());
                    Ok(())
                } else {
                    Err("Metadata is missing for the media reference".to_string())
                }
            }
            Ref::Note(note_ref) => {
                if let Some(metadata) = &mut note_ref.metadata {
                    metadata.tags.push(tag.to_string());
                    Ok(())
                } else {
                    Err("Metadata is missing for the note reference".to_string())
                }
            }
        }
    } else {
        Err(format!("Reference with ID '{}' not found", ref_id))
    }
}

#[tauri::command]
async fn remove_tag(
    ref_id: &str,
    path: &str,
    tag: &str,
    ref_type: &str,
    state: State<'_, Mutex<Vec<Ref>>>,
) -> Result<(), String> {
    let location = Path::new(path);
    utils::remove_tag(location, ref_type, tag);

    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on state".to_string())?;

    if let Some(ref_instance) = state_guard
        .iter_mut()
        .find(|ref_instance| match ref_instance {
            Ref::Media(media_ref) => {
                if let Some(metadata) = &media_ref.metadata {
                    metadata.id == ref_id
                } else {
                    false
                }
            }
            Ref::Note(note_ref) => {
                if let Some(metadata) = &note_ref.metadata {
                    metadata.id == ref_id
                } else {
                    false
                }
            }
        })
    {
        match ref_instance {
            Ref::Media(media_ref) => {
                if let Some(metadata) = &mut media_ref.metadata {
                    metadata.tags.retain(|existing_tag| *existing_tag != tag);
                    Ok(())
                } else {
                    Err("Metadata is missing for the media reference".to_string())
                }
            }
            Ref::Note(note_ref) => {
                if let Some(metadata) = &mut note_ref.metadata {
                    metadata.tags.retain(|existing_tag| *existing_tag != tag);
                    Ok(())
                } else {
                    Err("Metadata is missing for the note reference".to_string())
                }
            }
        }
    } else {
        Err(format!("Reference with ID '{}' not found", ref_id))
    }
}

// #[tauri::command]
// async fn add_link(url: &str, handle: AppHandle) -> Result<(), String> {
//     let window_builder = WindowBuilder::new(
//         &handle,
//         "capture",
//         WindowUrl::External(url.parse().unwrap()),
//     )
//     .visible(false);
//
//     let window = window_builder.build().unwrap();
//     window.with_webview(|webview| {
//         webview.inner().;
//     });
//     let _ = window.eval(
//         r#"
//             new Promise((resolve, reject) => {
//                 const canvas = document.createElement('canvas');
//                 const context = canvas.getContext('2d');
//                 const rect = document.body.getBoundingClientRect();
//                 canvas.width = rect.width;
//                 canvas.height = rect.height;
//                 context.drawWindow(window, rect.left, rect.top, rect.width, rect.height, "rgb(255,255,255)");
//                 canvas.toBlob(blob => {
//                     const reader = new FileReader();
//                     reader.readAsDataURL(blob);
//                     reader.onloadend = () => resolve(reader.result);
//                 }, 'image/png', 1.0);
//             })
//         "#,
//     ).map_err(|err| err.to_string())?;
//
//     // let screen_shot = screen_shot_data.split(",").last().unwrap().to_string();
//     Ok(())
// }

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
    Box::new(tauri::generate_handler![
        generate_id,
        generate_media_metadata,
        generate_note_metadata,
        get_media_refs,
        get_settings,
        rename_ref,
        remove_ref,
        add_tag,
        remove_tag,
        change_note_content,
    ])
}
