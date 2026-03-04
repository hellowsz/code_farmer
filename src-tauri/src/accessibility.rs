/// 检查 macOS 辅助功能权限
/// rdev 的全局监听需要此权限，否则无法捕获其他应用的键盘事件
#[cfg(target_os = "macos")]
pub fn is_accessibility_trusted() -> bool {
    extern "C" {
        fn AXIsProcessTrusted() -> bool;
    }
    unsafe { AXIsProcessTrusted() }
}

#[cfg(not(target_os = "macos"))]
pub fn is_accessibility_trusted() -> bool {
    true
}

/// 打开 macOS 系统偏好设置的辅助功能页面
#[cfg(target_os = "macos")]
pub fn open_accessibility_settings() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn();
}

#[cfg(not(target_os = "macos"))]
pub fn open_accessibility_settings() {
    // Windows/Linux 不需要额外权限
}
