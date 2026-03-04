use crate::accessibility;

#[tauri::command]
pub fn check_accessibility() -> bool {
    accessibility::is_accessibility_trusted()
}

#[tauri::command]
pub fn open_accessibility_settings() {
    accessibility::open_accessibility_settings();
}
