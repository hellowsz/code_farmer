use rusqlite::{Connection, params};
use std::path::PathBuf;
use tauri::Manager;

/// 获取数据库路径（用户数据目录）
pub fn get_db_path(app: &tauri::AppHandle) -> PathBuf {
    let data_dir = app.path().app_data_dir().expect("无法获取数据目录");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("keyboard_farm.db")
}

/// 初始化数据库表
pub fn init_db(conn: &Connection) {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS save_data (
            id INTEGER PRIMARY KEY DEFAULT 1,
            state_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_stats (
            date TEXT PRIMARY KEY,
            key_presses INTEGER DEFAULT 0,
            mouse_clicks INTEGER DEFAULT 0,
            harvests INTEGER DEFAULT 0,
            gold_earned INTEGER DEFAULT 0
        );"
    ).expect("数据库初始化失败");
}

/// 保存游戏状态
pub fn save_state(conn: &Connection, state_json: &str) {
    let now = chrono::Local::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO save_data (id, state_json, updated_at) VALUES (1, ?1, ?2)",
        params![state_json, now],
    ).ok();
}

/// 读取游戏状态
pub fn load_state(conn: &Connection) -> Option<String> {
    conn.query_row(
        "SELECT state_json FROM save_data WHERE id = 1",
        [],
        |row| row.get(0),
    ).ok()
}
