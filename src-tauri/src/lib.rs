mod accessibility;
mod commands;
mod input_listener;

use std::sync::mpsc;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 全局 panic hook，确保 panic 信息输出到 stderr
    std::panic::set_hook(Box::new(|info| {
        eprintln!("[PANIC] {}", info);
        if let Some(location) = info.location() {
            eprintln!("[PANIC] at {}:{}:{}", location.file(), location.line(), location.column());
        }
    }));

    let (tx, rx) = mpsc::channel::<input_listener::InputEvent>();

    // 检查辅助功能权限后再启动监听
    let has_accessibility = accessibility::is_accessibility_trusted();
    eprintln!("[App] macOS 辅助功能权限: {}", has_accessibility);

    if has_accessibility {
        input_listener::start_global_listener(tx);
        eprintln!("[App] 全局输入监听已启动");
    } else {
        eprintln!("[App] 未获得辅助功能权限，输入监听未启动（等待用户授权后重启应用）");
        // 仍然保留 tx，防止 rx 端立即收到断开信号
        std::mem::forget(tx);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_accessibility,
            commands::open_accessibility_settings,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            // 事件转发线程
            std::thread::spawn(move || {
                eprintln!("[App] 事件转发线程已启动");
                while let Ok(event) = rx.recv() {
                    if let Err(e) = handle.emit("global-input", &event) {
                        eprintln!("[App] emit 失败: {}", e);
                    }
                }
                eprintln!("[App] 事件转发线程已退出（channel 已关闭）");
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
