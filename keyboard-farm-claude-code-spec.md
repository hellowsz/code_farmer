# 键盘农场 (Keyboard Farm) — Claude Code 开发规范

> **本文档是给 Claude Code 的完整开发指令。** 按照本文档从头到尾执行，即可构建出一个可运行的桌面放置类农场游戏。

---

## 项目概述

**产品定位**：一款 macOS / Windows 桌面后台放置游戏。用户启动后，游戏以小窗口形式常驻桌面。用户在任何应用中（浏览器、IDE、聊天工具等）打字或点击鼠标时，游戏能够**全局监听**到这些输入，并将其转化为农场作物的生长动力。

**核心体验**：只要你在工作，农场就在耕作。不需要切换到游戏窗口，不需要刻意操作。

**技术栈**：Tauri 2.x (Rust) + PixiJS 8.x + rdev (Rust crate) + Vue 3 + Vite

---

## 第一阶段：项目初始化

### 1.1 创建 Tauri 项目

```bash
# 确保已安装 Rust 和 Node.js
cargo install create-tauri-app
cargo create-tauri-app keyboard-farm --template vue-ts
cd keyboard-farm
```

### 1.2 安装 Rust 依赖

编辑 `src-tauri/Cargo.toml`，在 `[dependencies]` 中添加：

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rdev = "0.5"
chrono = "0.4"
rusqlite = { version = "0.31", features = ["bundled"] }

[target.'cfg(target_os = "macos")'.dependencies]
core-foundation = "0.10"
```

### 1.3 安装前端依赖

```bash
npm install pixi.js@^8 @pixi/spritesheet howler.js
npm install -D @types/howler
```

### 1.4 Tauri 权限配置

编辑 `src-tauri/capabilities/default.json`，确保包含事件权限：

```json
{
  "identifier": "default",
  "description": "default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:event:allow-emit",
    "core:event:allow-listen",
    "shell:allow-open"
  ]
}
```

---

## 第二阶段：全局输入监听（核心难点）

> **这是整个项目最关键的模块**。必须在 Rust 后端独立线程中运行 rdev 全局监听，通过 Tauri 事件系统将输入事件转发给前端。

### 2.1 输入事件数据结构

创建 `src-tauri/src/input_listener.rs`：

```rust
use rdev::{listen, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use std::sync::mpsc::Sender;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};

/// 传递给前端的输入事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputEvent {
    /// "key_press" | "key_release" | "mouse_click"
    pub event_type: String,
    /// 按键标识符，如 "a", "1", "F5", "Space", "ShiftLeft" 等
    /// 鼠标事件时为 "mouse_left", "mouse_right", "mouse_middle"
    pub key_id: String,
    /// 毫秒时间戳
    pub timestamp: u64,
}

/// 启动全局监听线程
/// sender: 用于向主线程发送事件的 channel sender
pub fn start_global_listener(sender: Sender<InputEvent>) {
    thread::spawn(move || {
        if let Err(error) = listen(move |event: Event| {
            let input_event = match event.event_type {
                EventType::KeyPress(key) => Some(InputEvent {
                    event_type: "key_press".into(),
                    key_id: map_key_to_id(key),
                    timestamp: current_timestamp_ms(),
                }),
                EventType::ButtonPress(button) => Some(InputEvent {
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
            eprintln!("rdev listen error: {:?}", error);
        }
    });
}

fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// 将 rdev::Key 映射为字符串标识符
/// 这些标识符将与前端键盘布局一一对应
fn map_key_to_id(key: Key) -> String {
    match key {
        // 字母键
        Key::KeyA => "a".into(), Key::KeyB => "b".into(),
        Key::KeyC => "c".into(), Key::KeyD => "d".into(),
        Key::KeyE => "e".into(), Key::KeyF => "f".into(),
        Key::KeyG => "g".into(), Key::KeyH => "h".into(),
        Key::KeyI => "i".into(), Key::KeyJ => "j".into(),
        Key::KeyK => "k".into(), Key::KeyL => "l".into(),
        Key::KeyM => "m".into(), Key::KeyN => "n".into(),
        Key::KeyO => "o".into(), Key::KeyP => "p".into(),
        Key::KeyQ => "q".into(), Key::KeyR => "r".into(),
        Key::KeyS => "s".into(), Key::KeyT => "t".into(),
        Key::KeyU => "u".into(), Key::KeyV => "v".into(),
        Key::KeyW => "w".into(), Key::KeyX => "x".into(),
        Key::KeyY => "y".into(), Key::KeyZ => "z".into(),
        // 数字键
        Key::Num0 => "0".into(), Key::Num1 => "1".into(),
        Key::Num2 => "2".into(), Key::Num3 => "3".into(),
        Key::Num4 => "4".into(), Key::Num5 => "5".into(),
        Key::Num6 => "6".into(), Key::Num7 => "7".into(),
        Key::Num8 => "8".into(), Key::Num9 => "9".into(),
        // 功能键
        Key::F1 => "f1".into(), Key::F2 => "f2".into(),
        Key::F3 => "f3".into(), Key::F4 => "f4".into(),
        Key::F5 => "f5".into(), Key::F6 => "f6".into(),
        Key::F7 => "f7".into(), Key::F8 => "f8".into(),
        Key::F9 => "f9".into(), Key::F10 => "f10".into(),
        Key::F11 => "f11".into(), Key::F12 => "f12".into(),
        // 特殊键
        Key::Escape => "esc".into(),
        Key::BackQuote => "backquote".into(),
        Key::Tab => "tab".into(),
        Key::CapsLock => "capslock".into(),
        Key::ShiftLeft => "shift_l".into(),
        Key::ShiftRight => "shift_r".into(),
        Key::ControlLeft => "ctrl_l".into(),
        Key::ControlRight => "ctrl_r".into(),
        Key::Alt => "alt_l".into(),
        Key::AltGr => "alt_r".into(),
        Key::MetaLeft => "cmd_l".into(),
        Key::MetaRight => "cmd_r".into(),
        Key::Space => "space".into(),
        Key::Return => "enter".into(),
        Key::Backspace => "backspace".into(),
        Key::Delete => "delete".into(),
        // 符号键
        Key::Minus => "minus".into(),
        Key::Equal => "equal".into(),
        Key::LeftBracket => "bracket_l".into(),
        Key::RightBracket => "bracket_r".into(),
        Key::BackSlash => "backslash".into(),
        Key::SemiColon => "semicolon".into(),
        Key::Quote => "quote".into(),
        Key::Comma => "comma".into(),
        Key::Dot => "dot".into(),
        Key::Slash => "slash".into(),
        // 导航键
        Key::UpArrow => "up".into(),
        Key::DownArrow => "down".into(),
        Key::LeftArrow => "left".into(),
        Key::RightArrow => "right".into(),
        // 其他
        other => format!("{:?}", other).to_lowercase(),
    }
}
```

### 2.2 macOS 辅助功能权限检查

创建 `src-tauri/src/accessibility.rs`：

```rust
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
```

### 2.3 Tauri 命令与事件桥接

创建 `src-tauri/src/commands.rs`：

```rust
use crate::accessibility;

#[tauri::command]
pub fn check_accessibility() -> bool {
    accessibility::is_accessibility_trusted()
}

#[tauri::command]
pub fn open_accessibility_settings() {
    #[cfg(target_os = "macos")]
    accessibility::open_accessibility_settings();
}
```

### 2.4 主入口

编辑 `src-tauri/src/main.rs`（替换全部内容）：

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod input_listener;
mod accessibility;
mod commands;

use std::sync::mpsc;
use tauri::Manager;

fn main() {
    let (tx, rx) = mpsc::channel::<input_listener::InputEvent>();

    // 启动全局输入监听线程
    input_listener::start_global_listener(tx);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_accessibility,
            commands::open_accessibility_settings,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            // 启动事件转发线程：从 rdev channel 读取，emit 给前端
            std::thread::spawn(move || {
                while let Ok(event) = rx.recv() {
                    let _ = handle.emit("global-input", &event);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.5 lib.rs

创建 `src-tauri/src/lib.rs`（Tauri 2 需要）：

```rust
mod input_listener;
mod accessibility;
mod commands;
```

---

## 第三阶段：前端 — 完整键盘布局与农田渲染

> **设计原则**：完整展示一个标准键盘，每个键就是一块农田。键帽上同时显示按键标识和作物状态。整体风格为深色治愈系。

### 3.1 键盘布局数据定义

创建 `src/config/keyboardLayout.ts`：

```typescript
/**
 * 完整键盘布局定义
 * 每一行是键盘物理上的一行
 * 每个键对象包含：
 *   id: 与 Rust 后端 map_key_to_id 返回值一致
 *   label: 键帽上显示的文字
 *   width: 相对于标准键（1u = 1）的宽度倍数
 */
export interface KeyDef {
  id: string;
  label: string;
  width?: number; // 默认 1
}

export const KEYBOARD_LAYOUT: KeyDef[][] = [
  // ─── Row 0: Function Row ───
  [
    { id: "esc", label: "Esc", width: 1.5 },
    { id: "f1", label: "F1" },
    { id: "f2", label: "F2" },
    { id: "f3", label: "F3" },
    { id: "f4", label: "F4" },
    { id: "f5", label: "F5" },
    { id: "f6", label: "F6" },
    { id: "f7", label: "F7" },
    { id: "f8", label: "F8" },
    { id: "f9", label: "F9" },
    { id: "f10", label: "F10" },
    { id: "f11", label: "F11" },
    { id: "f12", label: "F12" },
    { id: "delete", label: "Del", width: 1.5 },
  ],
  // ─── Row 1: Number Row ───
  [
    { id: "backquote", label: "`" },
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
    { id: "5", label: "5" },
    { id: "6", label: "6" },
    { id: "7", label: "7" },
    { id: "8", label: "8" },
    { id: "9", label: "9" },
    { id: "0", label: "0" },
    { id: "minus", label: "-" },
    { id: "equal", label: "=" },
    { id: "backspace", label: "⌫", width: 2 },
  ],
  // ─── Row 2: QWERTY Row ───
  [
    { id: "tab", label: "Tab", width: 1.5 },
    { id: "q", label: "Q" },
    { id: "w", label: "W" },
    { id: "e", label: "E" },
    { id: "r", label: "R" },
    { id: "t", label: "T" },
    { id: "y", label: "Y" },
    { id: "u", label: "U" },
    { id: "i", label: "I" },
    { id: "o", label: "O" },
    { id: "p", label: "P" },
    { id: "bracket_l", label: "[" },
    { id: "bracket_r", label: "]" },
    { id: "backslash", label: "\\", width: 1.5 },
  ],
  // ─── Row 3: Home Row ───
  [
    { id: "capslock", label: "Caps", width: 1.75 },
    { id: "a", label: "A" },
    { id: "s", label: "S" },
    { id: "d", label: "D" },
    { id: "f", label: "F" },
    { id: "g", label: "G" },
    { id: "h", label: "H" },
    { id: "j", label: "J" },
    { id: "k", label: "K" },
    { id: "l", label: "L" },
    { id: "semicolon", label: ";" },
    { id: "quote", label: "'" },
    { id: "enter", label: "Enter", width: 2.25 },
  ],
  // ─── Row 4: Shift Row ───
  [
    { id: "shift_l", label: "Shift", width: 2.25 },
    { id: "z", label: "Z" },
    { id: "x", label: "X" },
    { id: "c", label: "C" },
    { id: "v", label: "V" },
    { id: "b", label: "B" },
    { id: "n", label: "N" },
    { id: "m", label: "M" },
    { id: "comma", label: "," },
    { id: "dot", label: "." },
    { id: "slash", label: "/" },
    { id: "shift_r", label: "Shift", width: 2.75 },
  ],
  // ─── Row 5: Bottom Row (macOS layout) ───
  [
    { id: "ctrl_l", label: "Ctrl", width: 1.25 },
    { id: "alt_l", label: "Opt", width: 1.25 },
    { id: "cmd_l", label: "⌘", width: 1.5 },
    { id: "space", label: "Space", width: 6 },
    { id: "cmd_r", label: "⌘", width: 1.5 },
    { id: "alt_r", label: "Opt", width: 1.25 },
    { id: "left", label: "←" },
    { id: "up", label: "↑" },
    { id: "down", label: "↓" },
    { id: "right", label: "→" },
  ],
];

// 所有可种植的键 id 列表（排除功能键和修饰键，它们作为特殊功能田）
export const PLANTABLE_KEYS: string[] = KEYBOARD_LAYOUT.flat()
  .map(k => k.id)
  .filter(id => ![
    "esc", "tab", "capslock", "shift_l", "shift_r",
    "ctrl_l", "alt_l", "alt_r", "cmd_l", "cmd_r",
    "backspace", "enter", "delete",
  ].includes(id));

// 修饰键 — 这些键具有特殊农场功能而非种田
export const MODIFIER_KEYS: Record<string, string> = {
  shift_l: "施肥",      // Shift: 给最近按过的田施肥（加速生长）
  shift_r: "施肥",
  enter: "收获全部",     // Enter: 一键收获所有已成熟作物
  backspace: "铲除",     // Backspace: 铲除最近按过的田的作物
  tab: "切换种子",       // Tab: 循环切换当前选中的种子类型
  capslock: "浇水",      // CapsLock: 全部田地浇一次水
  space: "加速生长",     // Space: 全部正在生长的作物推进 1 点
  esc: "打开菜单",
  delete: "清理枯萎",
  ctrl_l: "道具1",
  alt_l: "道具2",
  cmd_l: "道具3",
  cmd_r: "道具3",
  alt_r: "道具2",
};
```

### 3.2 作物配置数据

创建 `src/config/crops.ts`：

```typescript
export interface CropConfig {
  id: string;
  name: string;
  /** 每个生长阶段需要多少次按键 */
  hitsPerStage: number;
  /** 共几个生长阶段（不含空地和成熟，即种子→幼苗→成长→...→成熟） */
  growthStages: number;
  /** 售价 */
  sellPrice: number;
  /** 解锁所需金币，0 表示初始解锁 */
  unlockCost: number;
  /** 每个阶段的颜色（从种子到成熟），用于渲染 */
  stageColors: string[];
  /** 每个阶段的 emoji 图标 */
  stageEmojis: string[];
  /** 作物分类标签色 */
  accentColor: string;
}

export const CROPS: CropConfig[] = [
  {
    id: "wheat",
    name: "小麦",
    hitsPerStage: 2,
    growthStages: 3,
    sellPrice: 5,
    unlockCost: 0,
    stageColors: ["#8B7355", "#7CCD7C", "#9ACD32", "#F5DEB3"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌾"],
    accentColor: "#F5DEB3",
  },
  {
    id: "carrot",
    name: "胡萝卜",
    hitsPerStage: 3,
    growthStages: 3,
    sellPrice: 10,
    unlockCost: 0,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#ED9121"],
    stageEmojis: ["🟤", "🌱", "🌿", "🥕"],
    accentColor: "#ED9121",
  },
  {
    id: "tomato",
    name: "番茄",
    hitsPerStage: 4,
    growthStages: 4,
    sellPrice: 18,
    unlockCost: 80,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#FF6B6B", "#FF6347"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌸", "🍅"],
    accentColor: "#FF6347",
  },
  {
    id: "corn",
    name: "玉米",
    hitsPerStage: 5,
    growthStages: 4,
    sellPrice: 25,
    unlockCost: 200,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9ACD32", "#FFD700"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌿", "🌽"],
    accentColor: "#FFD700",
  },
  {
    id: "eggplant",
    name: "茄子",
    hitsPerStage: 6,
    growthStages: 4,
    sellPrice: 35,
    unlockCost: 500,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9370DB", "#8B5CF6"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌸", "🍆"],
    accentColor: "#8B5CF6",
  },
  {
    id: "strawberry",
    name: "草莓",
    hitsPerStage: 8,
    growthStages: 5,
    sellPrice: 50,
    unlockCost: 1000,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#FF69B4", "#FF1493", "#FF4D6A"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌸", "🫐", "🍓"],
    accentColor: "#FF4D6A",
  },
  {
    id: "pumpkin",
    name: "南瓜",
    hitsPerStage: 10,
    growthStages: 5,
    sellPrice: 80,
    unlockCost: 2500,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9ACD32", "#DAA520", "#FF8C00"],
    stageEmojis: ["🟤", "🌱", "🌿", "🌿", "🟡", "🎃"],
    accentColor: "#FF8C00",
  },
];
```

### 3.3 动物配置

创建 `src/config/animals.ts`：

```typescript
export interface AnimalConfig {
  id: string;
  name: string;
  emoji: string;
  /** 累计收获次数达到此值时解锁 */
  unlockHarvest: number;
  /** 解锁时的提示文案 */
  unlockMessage: string;
}

export const ANIMALS: AnimalConfig[] = [
  { id: "cat", name: "小猫", emoji: "🐱", unlockHarvest: 30, unlockMessage: "一只小猫被麦田的香气吸引，搬来了农场！" },
  { id: "dog", name: "小狗", emoji: "🐶", unlockHarvest: 80, unlockMessage: "一只忠诚的小狗主动来帮你守护农场！" },
  { id: "rabbit", name: "兔子", emoji: "🐰", unlockHarvest: 150, unlockMessage: "一只蹦蹦跳跳的兔子在胡萝卜地里安了家！" },
  { id: "chicken", name: "小鸡", emoji: "🐔", unlockHarvest: 250, unlockMessage: "一群小鸡来到你的玉米田觅食！" },
  { id: "hedgehog", name: "刺猬", emoji: "🦔", unlockHarvest: 400, unlockMessage: "一只可爱的刺猬在草莓丛中定居了！" },
  { id: "deer", name: "小鹿", emoji: "🦌", unlockHarvest: 600, unlockMessage: "一只温柔的小鹿远远地望着你的农场，决定留下来！" },
  { id: "owl", name: "猫头鹰", emoji: "🦉", unlockHarvest: 1000, unlockMessage: "一只智慧的猫头鹰在农场的大树上筑巢了！" },
];
```

### 3.4 游戏状态管理

创建 `src/store/gameStore.ts`：

```typescript
import { reactive, watch } from "vue";
import { CROPS, type CropConfig } from "../config/crops";
import { ANIMALS } from "../config/animals";
import { PLANTABLE_KEYS, MODIFIER_KEYS } from "../config/keyboardLayout";

// ─── 农田地块状态 ───
export interface PlotState {
  cropId: string | null;     // 当前种植的作物 id，null 表示空地
  stage: number;             // 当前生长阶段，0 = 刚播种
  hits: number;              // 当前阶段已积累的按键次数
  fertilized: boolean;       // 是否已施肥（减半 hitsPerStage）
  watered: boolean;          // 今日是否已浇水（额外 +1 hit）
  lastHitTime: number;       // 上次被按到的时间戳
}

// ─── 完整游戏状态 ───
export interface GameState {
  plots: Record<string, PlotState>;       // key_id → 地块状态
  gold: number;
  totalHarvests: number;
  selectedCropId: string;                 // 当前选中要种植的作物
  unlockedCropIds: string[];
  unlockedAnimalIds: string[];
  stats: {
    totalKeyPresses: number;
    totalMouseClicks: number;
    sessionStartTime: number;
    todayKeyPresses: number;
    todayDate: string;                    // "YYYY-MM-DD"
  };
}

// ─── 初始化 ───
function createInitialState(): GameState {
  const plots: Record<string, PlotState> = {};
  // 所有键盘键都初始化为空地（包括非种植键，它们只用于显示）
  const allKeyIds = [
    ...PLANTABLE_KEYS,
    ...Object.keys(MODIFIER_KEYS),
  ];
  for (const id of allKeyIds) {
    plots[id] = {
      cropId: null, stage: 0, hits: 0,
      fertilized: false, watered: false,
      lastHitTime: 0,
    };
  }
  return {
    plots,
    gold: 10,
    totalHarvests: 0,
    selectedCropId: "wheat",
    unlockedCropIds: ["wheat", "carrot"],
    unlockedAnimalIds: [],
    stats: {
      totalKeyPresses: 0,
      totalMouseClicks: 0,
      sessionStartTime: Date.now(),
      todayKeyPresses: 0,
      todayDate: new Date().toISOString().slice(0, 10),
    },
  };
}

// ─── 响应式状态（全局单例）───
export const gameState = reactive<GameState>(createInitialState());

// ─── 事件回调列表，用于 UI 动画触发 ───
type GameEventCallback = (event: GameEvent) => void;
const eventListeners: GameEventCallback[] = [];

export interface GameEvent {
  type: "plant" | "grow" | "mature" | "harvest" | "fertilize" | "water"
    | "harvest_all" | "remove" | "switch_seed" | "speed_boost";
  keyId: string;
  data?: any;
}

export function onGameEvent(cb: GameEventCallback) {
  eventListeners.push(cb);
}

function emitGameEvent(event: GameEvent) {
  eventListeners.forEach(cb => cb(event));
}

// ─── 核心：处理一次按键输入 ───
export function handleKeyInput(keyId: string) {
  const now = Date.now();

  // 更新统计
  gameState.stats.totalKeyPresses++;
  const today = new Date().toISOString().slice(0, 10);
  if (gameState.stats.todayDate !== today) {
    gameState.stats.todayDate = today;
    gameState.stats.todayKeyPresses = 0;
    // 重置浇水状态
    Object.values(gameState.plots).forEach(p => p.watered = false);
  }
  gameState.stats.todayKeyPresses++;

  // ─── 修饰键特殊功能 ───
  if (keyId in MODIFIER_KEYS) {
    handleModifierKey(keyId, now);
    return;
  }

  // ─── 普通键 → 种田逻辑 ───
  if (!PLANTABLE_KEYS.includes(keyId)) return;

  const plot = gameState.plots[keyId];
  if (!plot) return;

  const cropConfig = plot.cropId
    ? CROPS.find(c => c.id === plot.cropId)!
    : CROPS.find(c => c.id === gameState.selectedCropId)!;

  if (!plot.cropId) {
    // ── 空地：播种 ──
    if (!gameState.unlockedCropIds.includes(gameState.selectedCropId)) return;
    plot.cropId = gameState.selectedCropId;
    plot.stage = 0;
    plot.hits = 0;
    plot.fertilized = false;
    plot.watered = false;
    plot.lastHitTime = now;
    emitGameEvent({ type: "plant", keyId });

  } else if (plot.stage < cropConfig.growthStages) {
    // ── 生长中：积累按键 ──
    let increment = 1;
    if (plot.watered) increment += 1;         // 浇水 +1
    const threshold = plot.fertilized
      ? Math.ceil(cropConfig.hitsPerStage / 2)  // 施肥减半
      : cropConfig.hitsPerStage;

    plot.hits += increment;
    plot.lastHitTime = now;

    if (plot.hits >= threshold) {
      plot.stage++;
      plot.hits = 0;

      if (plot.stage >= cropConfig.growthStages) {
        emitGameEvent({ type: "mature", keyId });
      } else {
        emitGameEvent({ type: "grow", keyId, data: { stage: plot.stage } });
      }
    }

  } else {
    // ── 成熟：收获 ──
    gameState.gold += cropConfig.sellPrice;
    gameState.totalHarvests++;
    emitGameEvent({
      type: "harvest", keyId,
      data: { cropId: plot.cropId, gold: cropConfig.sellPrice },
    });

    // 重置地块
    plot.cropId = null;
    plot.stage = 0;
    plot.hits = 0;
    plot.fertilized = false;

    // 检查动物解锁
    checkAnimalUnlocks();
    // 检查作物解锁
    checkCropUnlocks();
  }
}

// ─── 修饰键逻辑 ───
function handleModifierKey(keyId: string, now: number) {
  switch (keyId) {
    case "shift_l":
    case "shift_r": {
      // 施肥：找到最近按过的一块正在生长的田
      const growing = Object.entries(gameState.plots)
        .filter(([_, p]) => p.cropId && p.stage < (CROPS.find(c => c.id === p.cropId)?.growthStages ?? 0) && !p.fertilized)
        .sort(([_, a], [__, b]) => b.lastHitTime - a.lastHitTime);
      if (growing.length > 0) {
        const [targetKey, targetPlot] = growing[0];
        targetPlot.fertilized = true;
        emitGameEvent({ type: "fertilize", keyId: targetKey });
      }
      break;
    }
    case "enter": {
      // 收获全部成熟作物
      let totalGold = 0;
      Object.entries(gameState.plots).forEach(([key, plot]) => {
        if (!plot.cropId) return;
        const config = CROPS.find(c => c.id === plot.cropId);
        if (!config || plot.stage < config.growthStages) return;
        totalGold += config.sellPrice;
        gameState.totalHarvests++;
        plot.cropId = null;
        plot.stage = 0;
        plot.hits = 0;
        plot.fertilized = false;
      });
      if (totalGold > 0) {
        gameState.gold += totalGold;
        emitGameEvent({ type: "harvest_all", keyId, data: { gold: totalGold } });
        checkAnimalUnlocks();
        checkCropUnlocks();
      }
      break;
    }
    case "backspace": {
      // 铲除最近按过的田
      const recent = Object.entries(gameState.plots)
        .filter(([_, p]) => p.cropId !== null)
        .sort(([_, a], [__, b]) => b.lastHitTime - a.lastHitTime);
      if (recent.length > 0) {
        const [targetKey, targetPlot] = recent[0];
        targetPlot.cropId = null;
        targetPlot.stage = 0;
        targetPlot.hits = 0;
        emitGameEvent({ type: "remove", keyId: targetKey });
      }
      break;
    }
    case "tab": {
      // 循环切换种子
      const idx = gameState.unlockedCropIds.indexOf(gameState.selectedCropId);
      const nextIdx = (idx + 1) % gameState.unlockedCropIds.length;
      gameState.selectedCropId = gameState.unlockedCropIds[nextIdx];
      emitGameEvent({ type: "switch_seed", keyId, data: { cropId: gameState.selectedCropId } });
      break;
    }
    case "capslock": {
      // 浇水
      Object.values(gameState.plots).forEach(p => {
        if (p.cropId) p.watered = true;
      });
      emitGameEvent({ type: "water", keyId });
      break;
    }
    case "space": {
      // 全体加速 +1
      Object.entries(gameState.plots).forEach(([key, plot]) => {
        if (!plot.cropId) return;
        const config = CROPS.find(c => c.id === plot.cropId);
        if (!config || plot.stage >= config.growthStages) return;
        plot.hits++;
        const threshold = plot.fertilized
          ? Math.ceil(config.hitsPerStage / 2)
          : config.hitsPerStage;
        if (plot.hits >= threshold) {
          plot.stage++;
          plot.hits = 0;
          if (plot.stage >= config.growthStages) {
            emitGameEvent({ type: "mature", keyId: key });
          }
        }
      });
      emitGameEvent({ type: "speed_boost", keyId });
      break;
    }
  }
}

function checkAnimalUnlocks() {
  ANIMALS.forEach(animal => {
    if (!gameState.unlockedAnimalIds.includes(animal.id)
        && gameState.totalHarvests >= animal.unlockHarvest) {
      gameState.unlockedAnimalIds.push(animal.id);
      // 这里可以 emit 一个通知事件让 UI 弹窗
    }
  });
}

function checkCropUnlocks() {
  CROPS.forEach(crop => {
    if (!gameState.unlockedCropIds.includes(crop.id)
        && gameState.gold >= crop.unlockCost
        && crop.unlockCost > 0) {
      gameState.unlockedCropIds.push(crop.id);
    }
  });
}

export function handleMouseClick() {
  gameState.stats.totalMouseClicks++;
  // 鼠标点击可以触发随机一块空地播种，或全体 +0.5 生长点
  // 具体策略可后续迭代
}
```

### 3.5 Tauri 事件桥接（前端侧）

创建 `src/bridge/tauriBridge.ts`：

```typescript
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { handleKeyInput, handleMouseClick } from "../store/gameStore";

interface InputEventPayload {
  event_type: string;
  key_id: string;
  timestamp: number;
}

/** 初始化 Tauri 事件监听 */
export async function initTauriBridge() {
  // 监听 Rust 后端转发的全局输入事件
  await listen<InputEventPayload>("global-input", (event) => {
    const { event_type, key_id } = event.payload;

    if (event_type === "key_press") {
      handleKeyInput(key_id);
    } else if (event_type === "mouse_click") {
      handleMouseClick();
    }
  });

  console.log("[Bridge] Tauri global input listener connected");
}

/** 检查 macOS 辅助功能权限 */
export async function checkAccessibility(): Promise<boolean> {
  try {
    return await invoke<boolean>("check_accessibility");
  } catch {
    return false;
  }
}

/** 打开系统偏好设置 */
export async function openAccessibilitySettings() {
  try {
    await invoke("open_accessibility_settings");
  } catch (e) {
    console.error("Failed to open settings:", e);
  }
}
```

### 3.6 主 Vue 组件结构

`App.vue` 应包含以下结构：

```
<App>
  ├── <TitleBar />            // 自定义标题栏（拖拽区域 + 最小化/关闭按钮）
  ├── <TopStatusBar />        // 顶部状态栏：💰金币 | 🌾收获数 | ⌨️按键数 | 当前种子
  ├── <MainContent>           // 核心区域，根据 tab 切换
  │   ├── <KeyboardFarm />    // 🌾 主面板：完整键盘农田
  │   ├── <ShopPanel />       // 🏪 商店：种子购买、道具
  │   ├── <AnimalPanel />     // 🐾 动物图鉴
  │   └── <StatsPanel />      // 📊 统计面板
  ├── <TabBar />              // 底部 tab 切换栏
  └── <AccessibilityGuide />  // 首次启动时的权限引导弹窗
```

### 3.7 KeyboardFarm 组件（核心渲染）

创建 `src/components/KeyboardFarm.vue`：

这个组件负责渲染完整键盘布局，每个键帽是一块农田。

**渲染规则**：
- 每个键帽是一个矩形区域，大小根据 `width` 属性缩放
- 标准键宽度为 `KEY_UNIT = 52px`，高度为 `52px`，间距 `4px`
- 键帽左上角小字显示按键标签（如 "A", "F5"）
- 键帽中央显示当前作物阶段的 emoji
- 键帽底部显示生长进度条（当前阶段 hits / hitsPerStage）
- 成熟的作物键帽带发光边框 + "收获!" 提示
- 空地键帽颜色较暗
- 修饰键键帽显示其功能文字而非作物（如 "施肥", "收获全部"）
- 被按下时键帽有缩放 + 高亮动画（0.1s 过渡）

**颜色方案（深色主题）**：
- 背景：`#12151f` → `#1a1f33` 渐变
- 空地键帽：`rgba(255,255,255,0.04)` 边框 `rgba(255,255,255,0.08)`
- 种植中键帽：根据作物 `accentColor` 的 15% 不透明度作为背景
- 成熟键帽：`accentColor` 的 25% 不透明度 + 边框用 `accentColor` 60%
- 修饰键键帽：`rgba(74,222,128,0.08)` 绿色调
- 按下动画：scale(0.93) + 绿色边框 `#4ADE80`

### 3.8 窗口配置要求

Tauri 窗口配置关键参数：
- `decorations: false` — 无原生标题栏（自定义标题栏实现拖拽）
- `transparent: true` — 透明背景，让圆角生效
- `alwaysOnTop: true` — 默认置顶
- `width: 900, height: 520` — 默认尺寸（需容纳完整键盘）
- `resizable: true`
- `skipTaskbar: false`

自定义标题栏中需要设置 `data-tauri-drag-region` 属性使其可拖拽。

---

## 第四阶段：数据持久化

### 4.1 SQLite 存档

在 Rust 后端使用 `rusqlite` 创建本地数据库（存在用户数据目录）。

**表结构**：

```sql
-- 游戏存档（单行，每次覆盖写入）
CREATE TABLE IF NOT EXISTS save_data (
    id INTEGER PRIMARY KEY DEFAULT 1,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 每日统计记录
CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    key_presses INTEGER DEFAULT 0,
    mouse_clicks INTEGER DEFAULT 0,
    harvests INTEGER DEFAULT 0,
    gold_earned INTEGER DEFAULT 0
);
```

### 4.2 存档策略

- **自动保存**：每 60 秒自动序列化 `gameState` 为 JSON 写入 SQLite
- **退出保存**：应用关闭前触发一次保存
- **启动加载**：应用启动时从 SQLite 读取存档恢复状态
- 使用 Tauri IPC command 在前端调用后端的存取函数

---

## 第五阶段：UI 美术风格

### 5.1 整体风格

- **主题**：深色治愈系，深蓝/深紫色调背景
- **字体**：使用 Google Fonts `Nunito`（圆润可爱）
- **图标**：MVP 阶段用 emoji，后续迭代替换为像素美术 spritesheet
- **动效**：
  - 按键按下：键帽 scale(0.93) + border 变绿 (0.1s transition)
  - 生长阶段变化：键帽内 emoji 弹跳动画 (scale 1.3→1, 0.2s)
  - 收获：键帽上方飘出 "+N💰" 浮动文字（向上飘 + 淡出，0.8s）
  - 成熟闪烁：键帽边框用作物颜色缓慢呼吸发光 (box-shadow pulse)
- **圆角**：键帽 10px，面板 16px，按钮 8px

### 5.2 布局比例

```
┌──────────────────────────────────────────────────────────────────┐
│ [标题栏] 键盘农场  💰 1234  🌾 56  ⌨️ 7890        ─ □ ✕    │ 40px
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  完整键盘农田网格（6 行，每行根据实际键盘布局排列）               │
│  每个键帽 52x52px，间距 4px                                      │ ~380px
│  修饰键 / 功能键用不同底色和标注                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [🌾农田] [🏪商店] [🐾动物] [📊统计] [⚙设置]                  │ 44px
└──────────────────────────────────────────────────────────────────┘
```

---

## 第六阶段：发布与平台适配

### 6.1 macOS 注意事项

- 辅助功能权限引导：首次启动检测 `AXIsProcessTrusted()`，未授权时弹出引导弹窗
- 应用签名与公证（Notarization）：如果走非 App Store 渠道需要开发者证书
- 系统托盘图标：最小化到托盘，点击恢复窗口

### 6.2 Windows 注意事项

- rdev 在 Windows 下使用 `SetWindowsHookEx`，不需要额外权限
- 需测试 UAC 弹窗是否影响监听
- 窗口透明效果可能需要额外处理

### 6.3 Steam 集成（后续）

- `steamworks-rs` crate 对接 Steam SDK
- 成就系统
- 云存档
- 排行榜

---

## 编码规范

- Rust 代码遵循 `cargo clippy` 建议
- TypeScript 使用严格模式 `"strict": true`
- Vue 使用 `<script setup lang="ts">` 语法
- 组件文件名 PascalCase，工具/配置文件 camelCase
- 所有用户可见文本使用中文
- 注释使用中文
- commit message 使用英文

---

## 验收标准

1. ✅ 应用启动后，在**任意其他应用**中打字，游戏窗口内对应的键帽有按下动画反馈
2. ✅ 按下字母/数字/符号键时，空地自动播种当前选中的作物
3. ✅ 继续按同一个键，作物逐阶段生长，达到成熟状态
4. ✅ 再按一次成熟的键，收获作物获得金币
5. ✅ Tab 键可切换选中的种子类型
6. ✅ Enter 键一键收获所有成熟作物
7. ✅ Shift 键给最近操作的田施肥
8. ✅ Space 键加速全部作物
9. ✅ 金币积累后自动解锁新作物
10. ✅ 收获次数累计后解锁动物
11. ✅ 完整键盘布局可见（包括功能键行、数字行、底部修饰键行）
12. ✅ 窗口可拖拽、置顶、最小化到托盘
13. ✅ 退出后再次启动，存档正常恢复
14. ✅ macOS 首次启动时引导用户授权辅助功能权限
15. ✅ 后台 CPU 占用 < 3%

---

*文档版本: v1.0 | 适用于 Claude Code 自动化开发*
