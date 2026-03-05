mod input_listener;
mod accessibility;
mod commands;
mod persistence;

use commands::DbState;
use rusqlite::Connection;
use std::sync::{mpsc, Mutex};
use tauri::{Emitter, Manager};

/// 启动全局监听 + 事件转发
fn start_input_forwarding(handle: tauri::AppHandle) {
    let (tx, rx) = mpsc::channel::<input_listener::InputEvent>();
    input_listener::start_global_listener(tx);

    std::thread::Builder::new()
        .name("event-forwarder".into())
        .spawn(move || {
            while let Ok(event) = rx.recv() {
                let _ = handle.emit("global-input", &event);
            }
        })
        .expect("无法创建事件转发线程");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_accessibility,
            commands::open_accessibility_settings,
            commands::save_game,
            commands::load_game,
        ])
        .setup(move |app| {
            // 初始化数据库
            let db_path = persistence::get_db_path(app.handle());
            let conn = Connection::open(&db_path).expect("无法打开数据库");
            persistence::init_db(&conn);
            app.manage(DbState(Mutex::new(conn)));

            // 只有辅助功能权限授权后才启动全局监听
            let handle = app.handle().clone();
            if accessibility::is_accessibility_trusted() {
                start_input_forwarding(handle);
                println!("全局输入监听已启动");
            } else {
                println!("辅助功能权限未授权，全局输入监听未启动");
                std::thread::spawn(move || {
                    loop {
                        std::thread::sleep(std::time::Duration::from_secs(2));
                        if accessibility::is_accessibility_trusted() {
                            start_input_forwarding(handle);
                            println!("辅助功能权限已授权，全局输入监听已启动");
                            break;
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
