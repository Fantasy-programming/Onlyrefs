// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused_imports)]
use tauri::Manager;
use window_shadows::set_shadow;

mod commands;
mod config;
mod media;
mod state;
mod utils;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            config::init(handle);

            app.manage(state::init_media_ref(app.handle()));

            // Set window shadow (macos & windows only)
            #[cfg(any(windows, target_os = "macos"))]
            {
                let window = app.get_window("main").unwrap();
                set_shadow(&window, true).expect("Unsupported platform");
            }
            Ok(())
        })
        .invoke_handler(commands::get_handlers())
        .run(tauri::generate_context!())
        .expect("Onlyref couldn't be run");
}
