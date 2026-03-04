mod platform;

use serde::{Deserialize, Serialize};
use std::sync::mpsc::Sender;
use std::time::{SystemTime, UNIX_EPOCH};

/// 传递给前端的输入事件（跨平台通用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputEvent {
    pub event_type: String,
    pub key_id: String,
    pub timestamp: u64,
}

/// 启动全局输入监听（跨平台入口）
pub fn start_global_listener(sender: Sender<InputEvent>) {
    platform::start_global_listener(sender);
}

pub fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
