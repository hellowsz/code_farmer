use super::super::{current_timestamp_ms, InputEvent};
use std::sync::mpsc::Sender;
use std::thread;

// ── Win32 FFI 绑定 ──

use std::ffi::c_void;
use std::ptr;

type HHOOK = *mut c_void;
type HINSTANCE = *mut c_void;
type WPARAM = usize;
type LPARAM = isize;
type LRESULT = isize;
type DWORD = u32;

type HOOKPROC = unsafe extern "system" fn(code: i32, w_param: WPARAM, l_param: LPARAM) -> LRESULT;

#[repr(C)]
struct KBDLLHOOKSTRUCT {
    vk_code: DWORD,
    scan_code: DWORD,
    flags: DWORD,
    time: DWORD,
    dw_extra_info: usize,
}

#[repr(C)]
struct MSLLHOOKSTRUCT {
    pt_x: i32,
    pt_y: i32,
    mouse_data: DWORD,
    flags: DWORD,
    time: DWORD,
    dw_extra_info: usize,
}

#[repr(C)]
struct MSG {
    hwnd: *mut c_void,
    message: u32,
    w_param: WPARAM,
    l_param: LPARAM,
    time: DWORD,
    pt_x: i32,
    pt_y: i32,
}

#[link(name = "user32")]
extern "system" {
    fn SetWindowsHookExW(
        id_hook: i32,
        lpfn: HOOKPROC,
        h_mod: HINSTANCE,
        dw_thread_id: DWORD,
    ) -> HHOOK;

    fn CallNextHookEx(
        hhk: HHOOK,
        n_code: i32,
        w_param: WPARAM,
        l_param: LPARAM,
    ) -> LRESULT;

    fn GetMessageW(
        lp_msg: *mut MSG,
        h_wnd: *mut c_void,
        w_msg_filter_min: u32,
        w_msg_filter_max: u32,
    ) -> i32;

    fn TranslateMessage(lp_msg: *const MSG) -> i32;
    fn DispatchMessageW(lp_msg: *const MSG) -> LRESULT;
}

const WH_KEYBOARD_LL: i32 = 13;
const WH_MOUSE_LL: i32 = 14;
const WM_KEYDOWN: usize = 0x0100;
const WM_SYSKEYDOWN: usize = 0x0104;
const WM_LBUTTONDOWN: usize = 0x0201;
const WM_RBUTTONDOWN: usize = 0x0204;

// 全局 sender（Windows hook 回调没有 user_info 参数，只能用全局变量）
static mut KEYBOARD_SENDER: Option<*const Sender<InputEvent>> = None;
static mut MOUSE_SENDER: Option<*const Sender<InputEvent>> = None;

pub fn start_global_listener(sender: Sender<InputEvent>) {
    // 克隆一份给鼠标 hook
    let mouse_sender = sender.clone();

    thread::spawn(move || {
        eprintln!("[InputListener] 监听线程已启动（Win32 Hook 模式）");

        unsafe {
            // 泄漏到堆上保持存活
            let kb_ptr = Box::into_raw(Box::new(sender));
            let ms_ptr = Box::into_raw(Box::new(mouse_sender));
            KEYBOARD_SENDER = Some(kb_ptr);
            MOUSE_SENDER = Some(ms_ptr);

            let kb_hook = SetWindowsHookExW(
                WH_KEYBOARD_LL,
                keyboard_hook_proc,
                ptr::null_mut(),
                0,
            );
            if kb_hook.is_null() {
                eprintln!("[InputListener] SetWindowsHookEx(KEYBOARD_LL) 失败");
                return;
            }

            let ms_hook = SetWindowsHookExW(
                WH_MOUSE_LL,
                mouse_hook_proc,
                ptr::null_mut(),
                0,
            );
            if ms_hook.is_null() {
                eprintln!("[InputListener] SetWindowsHookEx(MOUSE_LL) 失败");
                return;
            }

            eprintln!("[InputListener] Win32 全局 Hook 已安装，开始监听");

            // 消息循环（必须保持运行，否则 hook 会失效）
            let mut msg: MSG = std::mem::zeroed();
            while GetMessageW(&mut msg, ptr::null_mut(), 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
        }

        eprintln!("[InputListener] 监听线程已退出");
    });
}

unsafe extern "system" fn keyboard_hook_proc(
    code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if code >= 0 && (w_param == WM_KEYDOWN || w_param == WM_SYSKEYDOWN) {
        if let Some(sender_ptr) = KEYBOARD_SENDER {
            let sender = &*sender_ptr;
            let kb = &*(l_param as *const KBDLLHOOKSTRUCT);
            let key_id = vk_to_id(kb.vk_code);
            let _ = sender.send(InputEvent {
                event_type: "key_press".into(),
                key_id,
                timestamp: current_timestamp_ms(),
            });
        }
    }
    CallNextHookEx(ptr::null_mut(), code, w_param, l_param)
}

unsafe extern "system" fn mouse_hook_proc(
    code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if code >= 0 {
        let key_id = match w_param {
            WM_LBUTTONDOWN => Some("mouse_left"),
            WM_RBUTTONDOWN => Some("mouse_right"),
            _ => None,
        };
        if let (Some(key_id), Some(sender_ptr)) = (key_id, MOUSE_SENDER) {
            let sender = &*sender_ptr;
            let _ = sender.send(InputEvent {
                event_type: "mouse_click".into(),
                key_id: key_id.into(),
                timestamp: current_timestamp_ms(),
            });
        }
    }
    CallNextHookEx(ptr::null_mut(), code, w_param, l_param)
}

/// Windows Virtual Key Code → 键位 ID
/// 映射结果与 macOS 版本一致，确保前端逻辑跨平台通用
fn vk_to_id(vk: DWORD) -> String {
    match vk {
        // 字母键 A-Z (0x41-0x5A)
        0x41 => "a", 0x42 => "b", 0x43 => "c", 0x44 => "d",
        0x45 => "e", 0x46 => "f", 0x47 => "g", 0x48 => "h",
        0x49 => "i", 0x4A => "j", 0x4B => "k", 0x4C => "l",
        0x4D => "m", 0x4E => "n", 0x4F => "o", 0x50 => "p",
        0x51 => "q", 0x52 => "r", 0x53 => "s", 0x54 => "t",
        0x55 => "u", 0x56 => "v", 0x57 => "w", 0x58 => "x",
        0x59 => "y", 0x5A => "z",
        // 数字键 0-9 (0x30-0x39)
        0x30 => "0", 0x31 => "1", 0x32 => "2", 0x33 => "3",
        0x34 => "4", 0x35 => "5", 0x36 => "6", 0x37 => "7",
        0x38 => "8", 0x39 => "9",
        // F 键
        0x70 => "f1",  0x71 => "f2",  0x72 => "f3",  0x73 => "f4",
        0x74 => "f5",  0x75 => "f6",  0x76 => "f7",  0x77 => "f8",
        0x78 => "f9",  0x79 => "f10", 0x7A => "f11", 0x7B => "f12",
        // 功能键
        0x0D => "enter",
        0x09 => "tab",
        0x20 => "space",
        0xC0 => "backquote",
        0x08 => "backspace",
        0x1B => "esc",
        0x2E => "delete",
        // 修饰键
        0xA0 => "shift_l",   // VK_LSHIFT
        0xA1 => "shift_r",   // VK_RSHIFT
        0xA2 => "ctrl_l",    // VK_LCONTROL
        0xA3 => "ctrl_r",    // VK_RCONTROL
        0xA4 => "alt_l",     // VK_LMENU
        0xA5 => "alt_r",     // VK_RMENU
        0x5B => "cmd_l",     // VK_LWIN (对应 macOS Cmd)
        0x5C => "cmd_r",     // VK_RWIN
        0x14 => "capslock",  // VK_CAPITAL
        // 符号键
        0xBD => "minus",      // VK_OEM_MINUS
        0xBB => "equal",      // VK_OEM_PLUS (=)
        0xDB => "bracket_l",  // VK_OEM_4 ([)
        0xDD => "bracket_r",  // VK_OEM_6 (])
        0xDC => "backslash",  // VK_OEM_5 (\)
        0xBA => "semicolon",  // VK_OEM_1 (;)
        0xDE => "quote",      // VK_OEM_7 (')
        0xBC => "comma",      // VK_OEM_COMMA
        0xBE => "dot",        // VK_OEM_PERIOD
        0xBF => "slash",      // VK_OEM_2 (/)
        // 方向键
        0x25 => "left",
        0x26 => "up",
        0x27 => "right",
        0x28 => "down",
        // 其他
        _ => return format!("vk_{}", vk),
    }
    .into()
}
