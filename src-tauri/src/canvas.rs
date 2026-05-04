use chrono::Local;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, State};

use crate::config::{get_canvases_data_dir, get_canvases_path};

// ============================================
// Canvas Entity (Independent Canvas Metadata)
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Canvas {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

// ============================================
// Canvas Data Structures
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasSize {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasItem {
    pub id: String,
    pub ref_id: String,
    pub position: CanvasPosition,
    pub size: CanvasSize,
    pub rotation: f64,
    pub z_index: i32,
    pub locked: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasFrame {
    pub id: String,
    pub title: String,
    pub position: CanvasPosition,
    pub size: CanvasSize,
    pub color: String,
    pub z_index: i32,
    pub locked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasTextStyle {
    pub font_size: String, // "sm" | "md" | "lg" | "xl"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasAnnotation {
    pub id: String,
    #[serde(rename = "type")]
    pub annotation_type: String, // "text"
    pub position: CanvasPosition,
    pub size: CanvasSize,
    pub rotation: f64,
    pub z_index: i32,
    pub locked: bool,
    pub content: String,
    pub style: CanvasTextStyle,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasViewport {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasSettings {
    pub style: String, // "minimal" | "tactile" | "neutral"
    pub show_grid: bool,
    pub snap_to_grid: bool,
    pub grid_size: i32,
    pub show_guides: bool,
}

impl Default for CanvasSettings {
    fn default() -> Self {
        Self {
            style: "minimal".to_string(),
            show_grid: false,
            snap_to_grid: false,
            grid_size: 20,
            show_guides: true,
        }
    }
}

impl Default for CanvasViewport {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            zoom: 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasData {
    pub version: i32,
    pub items: Vec<CanvasItem>,
    pub frames: Vec<CanvasFrame>,
    pub annotations: Vec<CanvasAnnotation>,
    pub viewport: CanvasViewport,
    pub settings: CanvasSettings,
}

impl Default for CanvasData {
    fn default() -> Self {
        Self {
            version: 1,
            items: Vec::new(),
            frames: Vec::new(),
            annotations: Vec::new(),
            viewport: CanvasViewport::default(),
            settings: CanvasSettings::default(),
        }
    }
}

// ============================================
// Helper Functions
// ============================================

/// Get the canvas data file path for an independent canvas
fn get_canvas_data_path(handle: &AppHandle, canvas_id: &str) -> PathBuf {
    let canvases_dir = get_canvases_data_dir(handle);
    canvases_dir.join(format!("{}.json", canvas_id))
}

/// Generate a unique ID
fn generate_canvas_id() -> String {
    use rand::Rng;
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::rng();

    (0..13)
        .map(|_| {
            let idx = rng.random_range(0..characters.len());
            characters.chars().nth(idx).unwrap()
        })
        .collect()
}

/// Save canvases list to file
fn save_canvases_list(path: &PathBuf, canvases: &[Canvas]) -> Result<(), String> {
    let json_data = serde_json::to_string_pretty(canvases)
        .map_err(|e| format!("Failed to serialize canvases: {}", e))?;
    fs::write(path, json_data).map_err(|e| format!("Failed to write canvases file: {}", e))?;
    Ok(())
}

// ============================================
// State Initialization
// ============================================

pub fn init_canvases(handle: &AppHandle) -> Mutex<Vec<Canvas>> {
    let canvases_path = get_canvases_path(handle);

    if !canvases_path.exists() {
        return Mutex::new(Vec::new());
    }

    match fs::read_to_string(&canvases_path) {
        Ok(content) => match serde_json::from_str::<Vec<Canvas>>(&content) {
            Ok(canvases) => Mutex::new(canvases),
            Err(e) => {
                eprintln!("Failed to parse canvases.json: {}", e);
                Mutex::new(Vec::new())
            }
        },
        Err(e) => {
            eprintln!("Failed to read canvases.json: {}", e);
            Mutex::new(Vec::new())
        }
    }
}

// ============================================
// Tauri Commands (Independent Canvases)
// ============================================

/// Get all canvases
#[tauri::command]
pub async fn get_canvases(state: State<'_, Mutex<Vec<Canvas>>>) -> Result<Vec<Canvas>, String> {
    let state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on canvases state".to_string())?;
    Ok(state_guard.clone())
}

/// Create a new independent canvas
#[tauri::command]
pub async fn create_canvas(
    name: String,
    state: State<'_, Mutex<Vec<Canvas>>>,
    handle: AppHandle,
) -> Result<Canvas, String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on canvases state".to_string())?;

    // Check for unique name
    let has_duplicate = state_guard.iter().any(|c| c.name == name);

    if has_duplicate {
        return Err(format!("A canvas named '{}' already exists", name));
    }

    // Generate canvas ID
    let canvas_id = generate_canvas_id();
    let now = Local::now().to_string();

    let new_canvas = Canvas {
        id: canvas_id.clone(),
        name,
        created_at: now.clone(),
        updated_at: now,
    };

    state_guard.push(new_canvas.clone());

    // Persist to file
    let canvases_path = get_canvases_path(&handle);
    save_canvases_list(&canvases_path, &state_guard)
        .map_err(|e| format!("Failed to save canvases: {}", e))?;

    // Create empty canvas data file
    let canvases_dir = get_canvases_data_dir(&handle);
    fs::create_dir_all(&canvases_dir)
        .map_err(|e| format!("Failed to create canvases directory: {}", e))?;

    let canvas_data_path = get_canvas_data_path(&handle, &canvas_id);
    let default_data = CanvasData::default();
    let json_data = serde_json::to_string_pretty(&default_data)
        .map_err(|e| format!("Failed to serialize canvas data: {}", e))?;
    fs::write(&canvas_data_path, json_data)
        .map_err(|e| format!("Failed to write canvas data file: {}", e))?;

    Ok(new_canvas)
}

/// Rename a canvas
#[tauri::command]
pub async fn rename_canvas(
    canvas_id: String,
    new_name: String,
    state: State<'_, Mutex<Vec<Canvas>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on canvases state".to_string())?;

    // Check for unique name (excluding self)
    let has_duplicate = state_guard
        .iter()
        .any(|c| c.id != canvas_id && c.name == new_name);

    if has_duplicate {
        return Err(format!("A canvas named '{}' already exists", new_name));
    }

    // Find and update the canvas
    let canvas = state_guard
        .iter_mut()
        .find(|c| c.id == canvas_id)
        .ok_or_else(|| format!("Canvas with ID '{}' not found", canvas_id))?;

    canvas.name = new_name;
    canvas.updated_at = Local::now().to_string();

    // Persist to file
    let canvases_path = get_canvases_path(&handle);
    save_canvases_list(&canvases_path, &state_guard)
        .map_err(|e| format!("Failed to save canvases: {}", e))?;

    Ok(())
}

/// Delete a canvas
#[tauri::command]
pub async fn delete_independent_canvas(
    canvas_id: String,
    state: State<'_, Mutex<Vec<Canvas>>>,
    handle: AppHandle,
) -> Result<(), String> {
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on canvases state".to_string())?;

    // Find and remove the canvas
    let canvas_idx = state_guard
        .iter()
        .position(|c| c.id == canvas_id)
        .ok_or_else(|| format!("Canvas with ID '{}' not found", canvas_id))?;

    state_guard.remove(canvas_idx);

    // Persist to file
    let canvases_path = get_canvases_path(&handle);
    save_canvases_list(&canvases_path, &state_guard)
        .map_err(|e| format!("Failed to save canvases: {}", e))?;

    // Delete canvas data file
    let canvas_data_path = get_canvas_data_path(&handle, &canvas_id);
    if canvas_data_path.exists() {
        fs::remove_file(&canvas_data_path)
            .map_err(|e| format!("Failed to delete canvas data file: {}", e))?;
    }

    Ok(())
}

/// Load canvas data for an independent canvas
#[tauri::command]
pub async fn load_independent_canvas(
    canvas_id: String,
    handle: AppHandle,
) -> Result<CanvasData, String> {
    let canvas_path = get_canvas_data_path(&handle, &canvas_id);

    if !canvas_path.exists() {
        // Return default canvas data if file doesn't exist
        return Ok(CanvasData::default());
    }

    let content = fs::read_to_string(&canvas_path)
        .map_err(|e| format!("Failed to read canvas file: {}", e))?;

    let canvas_data: CanvasData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse canvas data: {}", e))?;

    Ok(canvas_data)
}

/// Save canvas data for an independent canvas
#[tauri::command]
pub async fn save_independent_canvas(
    canvas_id: String,
    data: CanvasData,
    state: State<'_, Mutex<Vec<Canvas>>>,
    handle: AppHandle,
) -> Result<(), String> {
    // Ensure canvases directory exists
    let canvases_dir = get_canvases_data_dir(&handle);
    fs::create_dir_all(&canvases_dir)
        .map_err(|e| format!("Failed to create canvases directory: {}", e))?;

    let canvas_path = get_canvas_data_path(&handle, &canvas_id);

    let json_data = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize canvas data: {}", e))?;

    fs::write(&canvas_path, json_data)
        .map_err(|e| format!("Failed to write canvas file: {}", e))?;

    // Update the updated_at timestamp in the canvas metadata
    let mut state_guard = state
        .lock()
        .map_err(|_| "Failed to acquire lock on canvases state".to_string())?;

    if let Some(canvas) = state_guard.iter_mut().find(|c| c.id == canvas_id) {
        canvas.updated_at = Local::now().to_string();

        // Persist to file
        let canvases_path = get_canvases_path(&handle);
        save_canvases_list(&canvases_path, &state_guard)
            .map_err(|e| format!("Failed to save canvases: {}", e))?;
    }

    Ok(())
}
