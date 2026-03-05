use serde::{Deserialize, Serialize};
use std::sync::mpsc::Sender;
use std::time::{SystemTime, UNIX_EPOCH};

/// 传递给前端的输入事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputEvent {
    /// "key_press" | "mouse_click"
    pub event_type: String,
    /// 按键标识符，与前端键盘布局一一对应
    pub key_id: String,
    /// 毫秒时间戳
    pub timestamp: u64,
}

fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ── macOS: 直接 CGEventTap FFI，不调用 TSM（避免 dispatch_assert_queue 崩溃）──

#[cfg(target_os = "macos")]
mod platform {
    use super::*;
    use std::os::raw::c_void;
    use std::thread;

    // Core Graphics 类型
    type CGEventRef = *mut c_void;
    type CGEventTapProxy = *mut c_void;
    type CFMachPortRef = *mut c_void;
    type CFAllocatorRef = *mut c_void;
    type CFRunLoopSourceRef = *mut c_void;
    type CFRunLoopRef = *mut c_void;
    type CFRunLoopMode = *mut c_void;
    type CGEventType = u32;
    type CGEventMask = u64;
    type CGEventField = u32;

    // CGEventType 常量
    const KG_EVENT_KEY_DOWN: CGEventType = 10;
    const KG_EVENT_FLAGS_CHANGED: CGEventType = 12;
    const KG_EVENT_LEFT_MOUSE_DOWN: CGEventType = 1;
    const KG_EVENT_RIGHT_MOUSE_DOWN: CGEventType = 3;
    const KG_EVENT_OTHER_MOUSE_DOWN: CGEventType = 25;

    // CGEventField
    const KEYBOARD_EVENT_KEYCODE: CGEventField = 9;

    // CGEventTapLocation::HID = 0
    const KCG_HID_EVENT_TAP: u32 = 0;
    // kCGHeadInsertEventTap = 0
    const KCG_HEAD_INSERT_EVENT_TAP: u32 = 0;
    // CGEventTapOption::ListenOnly = 1
    const KCG_EVENT_TAP_OPTION_LISTEN_ONLY: u32 = 1;

    const EVENT_MASK: CGEventMask = (1 << KG_EVENT_KEY_DOWN)
        | (1 << KG_EVENT_FLAGS_CHANGED)
        | (1 << KG_EVENT_LEFT_MOUSE_DOWN)
        | (1 << KG_EVENT_RIGHT_MOUSE_DOWN)
        | (1 << KG_EVENT_OTHER_MOUSE_DOWN);

    type TapCallback = unsafe extern "C" fn(
        CGEventTapProxy,
        CGEventType,
        CGEventRef,
        *mut c_void,
    ) -> CGEventRef;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            events_of_interest: CGEventMask,
            callback: TapCallback,
            user_info: *mut c_void,
        ) -> CFMachPortRef;
        fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
        fn CGEventGetIntegerValueField(event: CGEventRef, field: CGEventField) -> i64;
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
        fn CFRunLoopAddSource(rl: CFRunLoopRef, source: CFRunLoopSourceRef, mode: CFRunLoopMode);
        fn CFRunLoopRun();
        static kCFRunLoopCommonModes: CFRunLoopMode;
    }

    static mut GLOBAL_SENDER: Option<Sender<InputEvent>> = None;
    static mut LAST_FLAGS: u64 = 0;

    unsafe extern "C" fn tap_callback(
        _proxy: CGEventTapProxy,
        event_type: CGEventType,
        cg_event: CGEventRef,
        _user_info: *mut c_void,
    ) -> CGEventRef {
        let input = match event_type {
            KG_EVENT_KEY_DOWN => {
                let keycode = CGEventGetIntegerValueField(cg_event, KEYBOARD_EVENT_KEYCODE) as u16;
                Some(InputEvent {
                    event_type: "key_press".into(),
                    key_id: keycode_to_id(keycode),
                    timestamp: current_timestamp_ms(),
                })
            }
            KG_EVENT_FLAGS_CHANGED => {
                let keycode = CGEventGetIntegerValueField(cg_event, KEYBOARD_EVENT_KEYCODE) as u16;
                let flags = CGEventGetFlags(cg_event);
                let pressed = flags > LAST_FLAGS;
                LAST_FLAGS = flags;
                if pressed {
                    Some(InputEvent {
                        event_type: "key_press".into(),
                        key_id: keycode_to_id(keycode),
                        timestamp: current_timestamp_ms(),
                    })
                } else {
                    None
                }
            }
            KG_EVENT_LEFT_MOUSE_DOWN => Some(InputEvent {
                event_type: "mouse_click".into(),
                key_id: "mouse_left".into(),
                timestamp: current_timestamp_ms(),
            }),
            KG_EVENT_RIGHT_MOUSE_DOWN => Some(InputEvent {
                event_type: "mouse_click".into(),
                key_id: "mouse_right".into(),
                timestamp: current_timestamp_ms(),
            }),
            KG_EVENT_OTHER_MOUSE_DOWN => Some(InputEvent {
                event_type: "mouse_click".into(),
                key_id: "mouse_middle".into(),
                timestamp: current_timestamp_ms(),
            }),
            _ => None,
        };

        if let Some(evt) = input {
            if let Some(ref sender) = GLOBAL_SENDER {
                let _ = sender.send(evt);
            }
        }

        cg_event
    }

    pub fn start_global_listener(sender: Sender<InputEvent>) {
        thread::Builder::new()
            .name("cg-event-listener".into())
            .spawn(move || {
                println!("[CGEventTap] 监听线程启动");
                unsafe {
                    GLOBAL_SENDER = Some(sender);

                    let tap = CGEventTapCreate(
                        KCG_HID_EVENT_TAP,
                        KCG_HEAD_INSERT_EVENT_TAP,
                        KCG_EVENT_TAP_OPTION_LISTEN_ONLY,
                        EVENT_MASK,
                        tap_callback,
                        std::ptr::null_mut(),
                    );

                    if tap.is_null() {
                        eprintln!("[CGEventTap] 无法创建事件监听，请检查辅助功能权限");
                        return;
                    }

                    let loop_source =
                        CFMachPortCreateRunLoopSource(std::ptr::null_mut(), tap, 0);
                    if loop_source.is_null() {
                        eprintln!("[CGEventTap] 无法创建 RunLoop source");
                        return;
                    }

                    let current_loop = CFRunLoopGetCurrent();
                    CFRunLoopAddSource(current_loop, loop_source, kCFRunLoopCommonModes);
                    CGEventTapEnable(tap, true);

                    println!("[CGEventTap] 开始监听事件");
                    CFRunLoopRun();
                }
            })
            .expect("无法创建 CGEventTap 监听线程");
    }

    /// macOS keycode → 字符串标识符 (硬件扫描码，与输入法无关)
    fn keycode_to_id(code: u16) -> String {
        match code {
            // 字母键 (QWERTY 布局)
            0 => "a".into(), 1 => "s".into(), 2 => "d".into(), 3 => "f".into(),
            4 => "h".into(), 5 => "g".into(), 6 => "z".into(), 7 => "x".into(),
            8 => "c".into(), 9 => "v".into(), 11 => "b".into(), 12 => "q".into(),
            13 => "w".into(), 14 => "e".into(), 15 => "r".into(), 16 => "y".into(),
            17 => "t".into(), 18 => "1".into(), 19 => "2".into(), 20 => "3".into(),
            21 => "4".into(), 22 => "6".into(), 23 => "5".into(), 24 => "equal".into(),
            25 => "9".into(), 26 => "7".into(), 27 => "minus".into(), 28 => "8".into(),
            29 => "0".into(), 30 => "bracket_r".into(), 31 => "o".into(),
            32 => "u".into(), 33 => "bracket_l".into(), 34 => "i".into(),
            35 => "p".into(), 36 => "enter".into(), 37 => "l".into(),
            38 => "j".into(), 39 => "quote".into(), 40 => "k".into(),
            41 => "semicolon".into(), 42 => "backslash".into(), 43 => "comma".into(),
            44 => "slash".into(), 45 => "n".into(), 46 => "m".into(),
            47 => "dot".into(), 48 => "tab".into(), 49 => "space".into(),
            50 => "backquote".into(), 51 => "backspace".into(),
            53 => "esc".into(),
            // 修饰键
            54 => "cmd_r".into(), 55 => "cmd_l".into(),
            56 => "shift_l".into(), 57 => "capslock".into(),
            58 => "alt_l".into(), 59 => "ctrl_l".into(),
            60 => "shift_r".into(), 61 => "alt_r".into(),
            62 => "ctrl_r".into(), 63 => "fn".into(),
            // 功能键
            96 => "f5".into(), 97 => "f6".into(), 98 => "f7".into(),
            99 => "f3".into(), 100 => "f8".into(), 101 => "f9".into(),
            103 => "f11".into(), 105 => "f13".into(), 107 => "f14".into(),
            109 => "f10".into(), 111 => "f12".into(), 113 => "f15".into(),
            118 => "f4".into(), 120 => "f2".into(), 122 => "f1".into(),
            // 导航键
            117 => "delete".into(), 115 => "home".into(),
            116 => "pageup".into(), 119 => "end".into(),
            121 => "pagedown".into(),
            123 => "left".into(), 124 => "right".into(),
            125 => "down".into(), 126 => "up".into(),
            // 其他
            other => format!("key_{}", other),
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    use super::*;
    use rdev;
    use std::thread;

    pub fn start_global_listener(sender: Sender<InputEvent>) {
        thread::Builder::new()
            .name("input-listener".into())
            .spawn(move || {
                if let Err(e) = rdev::listen(move |event: rdev::Event| {
                    let input_event = match event.event_type {
                        rdev::EventType::KeyPress(key) => Some(InputEvent {
                            event_type: "key_press".into(),
                            key_id: format!("{:?}", key).to_lowercase(),
                            timestamp: current_timestamp_ms(),
                        }),
                        rdev::EventType::ButtonPress(button) => Some(InputEvent {
                            event_type: "mouse_click".into(),
                            key_id: format!("mouse_{:?}", button).to_lowercase(),
                            timestamp: current_timestamp_ms(),
                        }),
                        _ => None,
                    };
                    if let Some(evt) = input_event {
                        let _ = sender.send(evt);
                    }
                }) {
                    eprintln!("[rdev] listen error: {:?}", e);
                }
            })
            .expect("无法创建监听线程");
    }
}

pub use platform::start_global_listener;
