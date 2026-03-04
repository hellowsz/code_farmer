use super::super::{current_timestamp_ms, InputEvent};
use core_graphics::event::CGEventType;
use std::ffi::c_void;
use std::sync::mpsc::Sender;
use std::thread;

// ── CGEventTap FFI 绑定 ──

type CGEventRef = *mut c_void;
type CGEventTapProxy = *mut c_void;
type CFMachPortRef = *mut c_void;
type CFRunLoopSourceRef = *mut c_void;
type CFRunLoopRef = *mut c_void;
type CFStringRef = *const c_void;
type CFAllocatorRef = *const c_void;

type CGEventTapCallback = unsafe extern "C" fn(
    proxy: CGEventTapProxy,
    event_type: u32,
    event: CGEventRef,
    user_info: *mut c_void,
) -> CGEventRef;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventTapCreate(
        tap: u32,
        place: u32,
        options: u32,
        events_of_interest: u64,
        callback: CGEventTapCallback,
        user_info: *mut c_void,
    ) -> CFMachPortRef;

    fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
    fn CGEventGetIntegerValueField(event: CGEventRef, field: u32) -> i64;
    fn CGEventGetFlags(event: CGEventRef) -> u64;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFMachPortCreateRunLoopSource(
        allocator: CFAllocatorRef,
        port: CFMachPortRef,
        order: i64,
    ) -> CFRunLoopSourceRef;

    fn CFRunLoopGetCurrent() -> CFRunLoopRef;
    fn CFRunLoopAddSource(rl: CFRunLoopRef, source: CFRunLoopSourceRef, mode: CFStringRef);
    fn CFRunLoopRun();

    static kCFRunLoopCommonModes: CFStringRef;
}

const K_CG_HID_EVENT_TAP: u32 = 0;
const K_CG_HEAD_INSERT_EVENT_TAP: u32 = 0;
const K_CG_EVENT_TAP_OPTION_LISTEN_ONLY: u32 = 1;
const K_CG_KEYBOARD_EVENT_KEYCODE: u32 = 9;

pub fn start_global_listener(sender: Sender<InputEvent>) {
    thread::spawn(move || {
        eprintln!("[InputListener] 监听线程已启动（CGEventTap 模式）");
        unsafe {
            start_cg_event_tap(sender);
        }
        eprintln!("[InputListener] 监听线程已退出");
    });
}

unsafe fn start_cg_event_tap(sender: Sender<InputEvent>) {
    let event_mask: u64 = (1 << CGEventType::KeyDown as u64)
        | (1 << CGEventType::FlagsChanged as u64)
        | (1 << CGEventType::LeftMouseDown as u64)
        | (1 << CGEventType::RightMouseDown as u64);

    let sender_ptr = Box::into_raw(Box::new(sender)) as *mut c_void;

    let tap = CGEventTapCreate(
        K_CG_HID_EVENT_TAP,
        K_CG_HEAD_INSERT_EVENT_TAP,
        K_CG_EVENT_TAP_OPTION_LISTEN_ONLY,
        event_mask,
        event_tap_callback,
        sender_ptr,
    );

    if tap.is_null() {
        eprintln!("[InputListener] CGEventTapCreate 失败（缺少辅助功能权限？）");
        let _ = Box::from_raw(sender_ptr as *mut Sender<InputEvent>);
        return;
    }

    let source = CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0);
    if source.is_null() {
        eprintln!("[InputListener] CFMachPortCreateRunLoopSource 失败");
        let _ = Box::from_raw(sender_ptr as *mut Sender<InputEvent>);
        return;
    }

    let run_loop = CFRunLoopGetCurrent();
    CFRunLoopAddSource(run_loop, source, kCFRunLoopCommonModes);
    CGEventTapEnable(tap, true);

    eprintln!("[InputListener] CGEventTap 已创建，开始监听");
    CFRunLoopRun();
}

unsafe extern "C" fn event_tap_callback(
    _proxy: CGEventTapProxy,
    event_type: u32,
    cg_event: CGEventRef,
    user_info: *mut c_void,
) -> CGEventRef {
    let sender = &*(user_info as *const Sender<InputEvent>);

    const KEY_DOWN: u32 = 10;
    const FLAGS_CHANGED: u32 = 12;
    const LEFT_MOUSE_DOWN: u32 = 1;
    const RIGHT_MOUSE_DOWN: u32 = 3;
    const TAP_DISABLED_BY_TIMEOUT: u32 = 0xFFFFFFFE;

    let input_event = match event_type {
        KEY_DOWN => {
            let keycode =
                CGEventGetIntegerValueField(cg_event, K_CG_KEYBOARD_EVENT_KEYCODE) as u16;
            Some(InputEvent {
                event_type: "key_press".into(),
                key_id: keycode_to_id(keycode),
                timestamp: current_timestamp_ms(),
            })
        }
        FLAGS_CHANGED => {
            let keycode =
                CGEventGetIntegerValueField(cg_event, K_CG_KEYBOARD_EVENT_KEYCODE) as u16;
            let flags = CGEventGetFlags(cg_event);
            if is_modifier_press(keycode, flags) {
                Some(InputEvent {
                    event_type: "key_press".into(),
                    key_id: keycode_to_id(keycode),
                    timestamp: current_timestamp_ms(),
                })
            } else {
                None
            }
        }
        LEFT_MOUSE_DOWN => Some(InputEvent {
            event_type: "mouse_click".into(),
            key_id: "mouse_left".into(),
            timestamp: current_timestamp_ms(),
        }),
        RIGHT_MOUSE_DOWN => Some(InputEvent {
            event_type: "mouse_click".into(),
            key_id: "mouse_right".into(),
            timestamp: current_timestamp_ms(),
        }),
        TAP_DISABLED_BY_TIMEOUT => {
            eprintln!("[InputListener] EventTap 被系统超时禁用，正在重新启用...");
            None
        }
        _ => None,
    };

    if let Some(evt) = input_event {
        if let Err(e) = sender.send(evt) {
            eprintln!("[InputListener] channel send 失败: {}", e);
        }
    }

    cg_event
}

fn is_modifier_press(keycode: u16, flags: u64) -> bool {
    const SHIFT: u64 = 0x00020000;
    const CONTROL: u64 = 0x00040000;
    const ALTERNATE: u64 = 0x00080000;
    const COMMAND: u64 = 0x00100000;
    const ALPHA_SHIFT: u64 = 0x00010000;
    const SECONDARY_FN: u64 = 0x00800000;

    let flag_bit = match keycode {
        56 | 60 => SHIFT,
        59 | 62 => CONTROL,
        58 | 61 => ALTERNATE,
        55 | 54 => COMMAND,
        57 => ALPHA_SHIFT,
        63 => SECONDARY_FN,
        _ => return false,
    };
    (flags & flag_bit) != 0
}

/// macOS keycode → 键位 ID
fn keycode_to_id(keycode: u16) -> String {
    match keycode {
        0 => "a", 1 => "s", 2 => "d", 3 => "f", 4 => "h", 5 => "g",
        6 => "z", 7 => "x", 8 => "c", 9 => "v", 11 => "b",
        12 => "q", 13 => "w", 14 => "e", 15 => "r", 16 => "y", 17 => "t",
        18 => "1", 19 => "2", 20 => "3", 21 => "4", 22 => "6", 23 => "5",
        24 => "equal", 25 => "9", 26 => "7", 27 => "minus", 28 => "8", 29 => "0",
        30 => "bracket_r", 31 => "o", 32 => "u", 33 => "bracket_l",
        34 => "i", 35 => "p", 37 => "l", 38 => "j", 39 => "quote",
        40 => "k", 41 => "semicolon", 42 => "backslash", 43 => "comma",
        44 => "slash", 45 => "n", 46 => "m", 47 => "dot",
        36 => "enter", 48 => "tab", 49 => "space", 50 => "backquote",
        51 => "backspace", 53 => "esc",
        54 => "cmd_r", 55 => "cmd_l", 56 => "shift_l", 57 => "capslock",
        58 => "alt_l", 59 => "ctrl_l", 60 => "shift_r", 61 => "alt_r",
        62 => "ctrl_r", 63 => "fn",
        122 => "f1", 120 => "f2", 99 => "f3", 118 => "f4",
        96 => "f5", 97 => "f6", 98 => "f7", 100 => "f8",
        101 => "f9", 109 => "f10", 103 => "f11", 111 => "f12",
        123 => "left", 124 => "right", 125 => "down", 126 => "up",
        117 => "delete",
        _ => return format!("key_{}", keycode),
    }
    .into()
}
