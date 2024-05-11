use std::{fs, path::Path, path::PathBuf};
use tauri::AppHandle;

fn get_app_data_dir_path(handle: &AppHandle) -> PathBuf {
    handle.path_resolver().app_data_dir().unwrap()
}

pub fn get_settings_path(handle: &AppHandle) -> String {
    let app_data_dir = get_app_data_dir_path(handle);
    format!("{}/preferences.json", app_data_dir.display())
}

pub fn get_collection_path(handle: &AppHandle) -> PathBuf {
    let app_data_dir = get_app_data_dir_path(handle);
    app_data_dir.join("collections")
}

pub fn init(handle: AppHandle) {
    let collection_path = get_collection_path(&handle);

    if !Path::new(&collection_path).exists() {
        fs::create_dir_all(&collection_path).unwrap();
    }

    if !Path::new(&get_settings_path(&handle)).exists() {
        let default_settings = r#"{
            "theme": "light",
            "language": "en"
        }"#;

        fs::write(get_settings_path(&handle), default_settings).unwrap();
    }
}
