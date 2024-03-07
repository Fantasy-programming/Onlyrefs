// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused_imports)]
use window_shadows::set_shadow;

mod commands;
mod config;
mod utils;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize the config
            let handle = app.handle();
            config::init(handle);

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
