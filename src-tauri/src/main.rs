#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused_imports)]
use tauri::{Emitter, Manager};

mod canvas;
mod commands;
mod config;
mod media;
mod parser;
mod state;
mod utils;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle();

            config::init(&handle);
            // Initialize with empty refs for immediate window display
            app.manage(state::init_media_ref_empty());
            app.manage(state::init_settings(&handle));
            app.manage(state::init_boards(&handle));
            app.manage(canvas::init_canvases(&handle));

            // Load refs asynchronously in background thread
            let handle_clone = handle.clone();
            std::thread::spawn(move || {
                let collections_dir = config::get_collection_path(&handle_clone);
                match utils::fetch_refs(&collections_dir) {
                    Ok(refs) => {
                        let refs_data = refs.lock().unwrap().clone();
                        // Update the managed state
                        let state = handle_clone.state::<std::sync::Mutex<Vec<state::Ref>>>();
                        *state.lock().unwrap() = refs_data.clone();
                        // Emit event to frontend with loaded refs
                        if let Err(e) = handle_clone.emit("refs_loaded", refs_data) {
                            eprintln!("Failed to emit refs_loaded event: {}", e);
                        }
                    }
                    Err(e) => {
                        eprintln!("Error loading refs in background: {}", e);
                        // Emit empty array so frontend knows loading is complete
                        let _ = handle_clone.emit("refs_loaded", Vec::<state::Ref>::new());
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(commands::get_handlers())
        .run(tauri::generate_context!())
        .expect("Onlyref couldn't be run");
}
