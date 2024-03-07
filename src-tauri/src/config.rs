use std::fs;
use std::path::{Path, PathBuf};

use tauri::AppHandle;

pub fn get_app_data_dir_path(handle: AppHandle) -> PathBuf {
    handle.path_resolver().app_data_dir().unwrap()
}

pub fn get_settings_path(handle: AppHandle) -> String {
    let app_data_dir = get_app_data_dir_path(handle);
    format!("{}/settings.json", app_data_dir.display())
}

pub fn get_collection_path(handle: AppHandle) -> String {
    let app_data_dir = get_app_data_dir_path(handle);
    format!("{}/collections", app_data_dir.display())
}

pub fn init(handle: AppHandle) {
    let collection_path = get_collection_path(handle);
    if !Path::new(&collection_path).exists() {
        fs::create_dir_all(&collection_path).unwrap();
    }
}
