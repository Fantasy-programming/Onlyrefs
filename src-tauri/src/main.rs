// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(unused_imports)]
use tauri::Manager;
use tauri_plugin_log::LogTarget;
use window_shadows::set_shadow;

mod commands;
mod config;
mod media;
mod parser;
mod state;
mod utils;

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_context_menu::init())
        .plugin(tauri_plugin_snapshot::init())
        .setup(|app| {
            let handle = app.handle();
            config::init(handle);

            app.manage(state::init_media_ref(app.handle()));
            app.manage(state::init_settings(app.handle()));

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
