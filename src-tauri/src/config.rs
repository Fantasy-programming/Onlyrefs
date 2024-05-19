use std::{fs, path::Path, path::PathBuf};
use tauri::AppHandle;

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
    handle.path_resolver().app_data_dir().unwrap()
}

pub fn get_settings_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("preferences.json")
}

pub fn get_collection_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("collections")
}

pub fn init(handle: AppHandle) {
    let collection_path = get_collection_path(&handle);
    let settings_path = get_settings_path(&handle);

    if !(collection_path.exists()) {
        fs::create_dir_all(&collection_path).unwrap();
    }

    if !(settings_path.exists()) {
        fs::write(settings_path, DEFAULT_SETTINGS).unwrap();
    }
}
