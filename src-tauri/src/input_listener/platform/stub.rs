use super::super::InputEvent;
use std::sync::mpsc::Sender;

/// 未支持的平台 —— 不监听输入，仅保持编译通过
pub fn start_global_listener(_sender: Sender<InputEvent>) {
    eprintln!("[InputListener] 当前平台暂不支持全局输入监听");
}
