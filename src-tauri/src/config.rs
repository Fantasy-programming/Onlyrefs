use std::{fs, path::Path, path::PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_SETTINGS: &str = r#"
{
  "appearance": {
    "show_media_info": true,
    "video_ref_autoplay": false
  },
  "behavior": {
    "sort_by": "CreationTime"
  }
}"#;

fn get_app_data_dir_path(handle: &AppHandle) -> PathBuf {
    let resolver = handle.path();
    // Use app_data_dir() to get the app-specific directory (e.g., AppData/Roaming/com.onlyref)
    // instead of data_dir() which returns just AppData/Roaming
    return resolver.app_data_dir().unwrap();
}

pub fn get_settings_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("preferences.json")
}

pub fn get_collection_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("collections")
}

pub fn get_boards_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("boards.json")
}

pub fn get_canvases_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("canvases.json")
}

pub fn get_canvases_data_dir(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("_canvases")
}

pub fn init(handle: &AppHandle) {
    let collection_path = get_collection_path(handle);
    let settings_path = get_settings_path(handle);

    if !(collection_path.exists()) {
        fs::create_dir_all(&collection_path).unwrap();
    }

    if !(settings_path.exists()) {
        fs::write(&settings_path, DEFAULT_SETTINGS).unwrap();
    }
}
