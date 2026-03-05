use crate::{accessibility, persistence};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
pub fn check_accessibility() -> bool {
    accessibility::is_accessibility_trusted()
}

#[tauri::command]
pub fn open_accessibility_settings() {
    accessibility::open_accessibility_settings();
}

#[tauri::command]
pub fn save_game(state: State<DbState>, state_json: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    persistence::save_state(&conn, &state_json);
    Ok(())
}

#[tauri::command]
pub fn load_game(state: State<DbState>) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    Ok(persistence::load_state(&conn))
}
