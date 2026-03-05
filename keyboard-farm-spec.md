# 键盘农场 (Keyboard Farm) — 开发规范 v2.0

> 本文档是给 Claude Code 的完整开发指令。
> 参考对象：Steam《指尖农场 / Typing Farmer》
> 技术栈：Tauri 2.x (Rust) + Phaser 3 + TypeScript + Vite

---

## 一、产品概述

**定位**：macOS / Windows 桌面后台放置游戏。用户启动后，游戏以小窗口常驻桌面。用户在任何应用中打字或点击鼠标时，游戏全局监听输入，将其转化为农场作物的生长动力。

**核心体验**：只要你在工作，农场就在耕作。不需要切换到游戏窗口，不需要刻意操作。

**视觉风格**：手绘卡通风，粗线条，暖色调。完整键盘被包裹在一个"农场岛"造型里——泥土边框、木栅栏围绕，键盘上方有建筑装饰群（谷仓、钟楼、大树等），动物在键帽间行走，背景为蓝天白云+绿色草地。支持日夜变化。

**美术资产**：通过 Doubao-Seedream-5.0-lite AI 生成，统一手绘卡通风格。

**竞品参考**：`competitor/` 目录存放了指尖农场的 6 张游戏截图、宣传素材和竞品分析文档，开发中随时查阅以对齐视觉风格和交互设计。

---

## 二、技术架构

```
┌─────────────────────────────────────────────┐
│                  Tauri 2 Shell              │
│  ┌───────────────────────────────────────┐  │
│  │            Rust Backend               │  │
│  │  ┌─────────┐ ┌──────┐ ┌───────────┐  │  │
│  │  │  rdev   │ │SQLite│ │ Tauri IPC │  │  │
│  │  │全局监听  │ │持久化 │ │ 事件桥接  │  │  │
│  │  └─────────┘ └──────┘ └───────────┘  │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │          WebView (Frontend)           │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │         Phaser 3 Game           │  │  │
│  │  │  ┌──────┐ ┌──────┐ ┌────────┐  │  │  │
│  │  │  │ Farm │ │ Shop │ │ Stats  │  │  │  │
│  │  │  │Scene │ │Scene │ │ Scene  │  │  │  │
│  │  │  └──────┘ └──────┘ └────────┘  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.1 技术栈明细

| 层 | 技术 | 版本 | 用途 |
|----|------|------|------|
| 桌面壳 | Tauri | 2.x | 窗口管理、系统托盘、原生能力 |
| 后端 | Rust | stable | 全局键盘监听、数据持久化 |
| 键盘监听 | rdev | 0.5 | 跨平台全局输入捕获 |
| 数据库 | rusqlite | 0.31 | 本地 SQLite 存档 |
| 游戏引擎 | Phaser | 3.80+ | 2D 渲染、动画、粒子、场景管理 |
| 语言 | TypeScript | 5.x | 前端全部代码 |
| 构建 | Vite | 6.x | 打包、热更新、开发服务器 |

### 2.2 项目目录结构

```
keyboard-farm/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   └── src/
│       ├── main.rs              # Tauri 入口
│       ├── lib.rs               # 模块声明
│       ├── input_listener.rs    # rdev 全局监听
│       ├── accessibility.rs     # macOS 辅助功能权限
│       ├── commands.rs          # Tauri IPC 命令
│       └── persistence.rs       # SQLite 存档读写
├── src/
│   ├── main.ts                  # Phaser 游戏入口
│   ├── config/
│   │   ├── keyboard-layout.ts   # 键盘布局数据
│   │   ├── crops.ts             # 作物配置
│   │   ├── animals.ts           # 动物配置
│   │   └── constants.ts         # 全局常量
│   ├── scenes/
│   │   ├── BootScene.ts         # 资源预加载
│   │   ├── FarmScene.ts         # 主农场场景（核心）
│   │   ├── ShopScene.ts         # 种子商店
│   │   ├── TaskScene.ts         # 任务清单 + 番茄钟
│   │   ├── StatsScene.ts        # 统计面板
│   │   └── SettingsScene.ts     # 设置
│   ├── objects/
│   │   ├── KeyPlot.ts           # 单个键帽农田对象
│   │   ├── Crop.ts              # 作物 Sprite + 动画
│   │   ├── Animal.ts            # 动物 Sprite + AI 行走
│   │   ├── Building.ts          # 装饰建筑
│   │   └── PomodoroTimer.ts     # 番茄钟大番茄造型
│   ├── systems/
│   │   ├── FarmManager.ts       # 农场核心逻辑（种植/生长/收获）
│   │   ├── InputBridge.ts       # Tauri 事件 → Phaser 事件
│   │   ├── SaveManager.ts       # 存档序列化 / Tauri IPC 调用
│   │   ├── AnimalManager.ts     # 动物解锁与行为管理
│   │   ├── DayNightCycle.ts     # 日夜变化系统
│   │   └── AudioManager.ts      # 背景音乐 + 音效
│   ├── ui/
│   │   ├── HUD.ts               # 顶部状态栏（金币、收获数、按键数）
│   │   ├── SeedSelector.ts      # 当前种子选择器
│   │   ├── Toast.ts             # 浮动提示（+金币、解锁通知）
│   │   └── AccessibilityGuide.ts # macOS 权限引导弹窗
│   └── utils/
│       └── helpers.ts           # 工具函数
├── competitor/                    # 竞品参考素材（不参与构建）
│   ├── README.md                  # 竞品分析文档（介绍、更新日志、设计要点）
│   ├── screenshots/               # 游戏截图 1920x1080 (ss0~ss5)
│   ├── promo/                     # 宣传素材（头图、胶囊图、功能横幅）
│   └── video/                     # 视频截图
├── public/
│   └── assets/
│       ├── sprites/             # Spritesheet PNG + JSON
│       │   ├── crops/           # 作物各阶段
│       │   ├── animals/         # 动物行走帧
│       │   ├── buildings/       # 装饰建筑
│       │   └── ui/              # UI 元素
│       ├── audio/               # 音乐 + 音效
│       │   ├── bgm/
│       │   └── sfx/
│       └── fonts/               # 自定义字体
├── tools/
│   └── art-gen/
│       ├── manifest.ts          # 素材清单定义（名称、尺寸、prompt、输出路径）
│       ├── generate.ts          # 调用 Seedream API 生成原始图片
│       ├── postprocess.ts       # 裁剪、去背景、缩放、拼 Spritesheet
│       ├── config.ts            # API 配置（读取环境变量）
│       └── cli.ts               # CLI 入口（npm run art:gen）
├── .env.example                 # 环境变量模板（含 ARK_API_KEY）
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 三、第一阶段 — 项目初始化

### 3.1 创建 Tauri 项目

```bash
# 使用 Tauri CLI 创建空白前端项目
npm create tauri-app@latest keyboard-farm -- --template vanilla-ts
cd keyboard-farm
```

### 3.2 Rust 依赖

`src-tauri/Cargo.toml` 的 `[dependencies]`：

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

### 3.3 前端依赖

```bash
npm install phaser@^3.80
npm install -D typescript vite
```

### 3.4 Vite 配置

`vite.config.ts`：

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
  },
});
```

### 3.5 TypeScript 配置

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

### 3.6 HTML 入口

`index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>键盘农场</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #4a8c3f; }
    #game-container { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 3.7 Tauri 窗口配置

`src-tauri/tauri.conf.json` 中窗口关键配置：

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "键盘农场",
        "width": 960,
        "height": 540,
        "resizable": true,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": false
      }
    ]
  }
}
```

### 3.8 Tauri 权限配置

`src-tauri/capabilities/default.json`：

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

## 四、第二阶段 — Rust 后端（全局输入监听 + 持久化）

### 4.1 输入事件数据结构

`src-tauri/src/input_listener.rs`：

```rust
use rdev::{listen, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use std::sync::mpsc::Sender;
use std::thread;
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

/// 启动全局监听线程
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

### 4.2 macOS 辅助功能权限

`src-tauri/src/accessibility.rs`：

```rust
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

#[cfg(target_os = "macos")]
pub fn open_accessibility_settings() {
    let _ = std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn();
}

#[cfg(not(target_os = "macos"))]
pub fn open_accessibility_settings() {}
```

### 4.3 数据持久化

`src-tauri/src/persistence.rs`：

```rust
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
```

### 4.4 Tauri 命令

`src-tauri/src/commands.rs`：

```rust
use crate::{accessibility, persistence};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
pub fn check_accessibility() -> bool {
    accessibility::is_accessibility_trusted()
}

#[tauri::command]
pub fn open_accessibility_settings() {
    accessibility::open_accessibility_settings();
}

#[tauri::command]
pub fn save_game(state: State<DbState>, state_json: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    persistence::save_state(&conn, &state_json);
    Ok(())
}

#[tauri::command]
pub fn load_game(state: State<DbState>) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    Ok(persistence::load_state(&conn))
}
```

### 4.5 主入口

`src-tauri/src/main.rs`：

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod input_listener;
mod accessibility;
mod commands;
mod persistence;

use commands::DbState;
use rusqlite::Connection;
use std::sync::{mpsc, Mutex};
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
            commands::save_game,
            commands::load_game,
        ])
        .setup(move |app| {
            // 初始化数据库
            let db_path = persistence::get_db_path(app.handle());
            let conn = Connection::open(&db_path).expect("无法打开数据库");
            persistence::init_db(&conn);
            app.manage(DbState(Mutex::new(conn)));

            let handle = app.handle().clone();

            // 事件转发线程：rdev channel → Tauri event → 前端
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

`src-tauri/src/lib.rs`：

```rust
mod input_listener;
mod accessibility;
mod commands;
mod persistence;
```

---

## 五、第三阶段 — Phaser 游戏前端

### 5.1 游戏入口

`src/main.ts`：

```typescript
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { FarmScene } from "./scenes/FarmScene";
import { ShopScene } from "./scenes/ShopScene";
import { TaskScene } from "./scenes/TaskScene";
import { StatsScene } from "./scenes/StatsScene";
import { SettingsScene } from "./scenes/SettingsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 540,
  backgroundColor: "#4a8c3f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, FarmScene, ShopScene, TaskScene, StatsScene, SettingsScene],
};

new Phaser.Game(config);
```

### 5.2 键盘布局数据

`src/config/keyboard-layout.ts`：

```typescript
export interface KeyDef {
  /** 与 Rust map_key_to_id 返回值一致 */
  id: string;
  /** 键帽上显示的文字 */
  label: string;
  /** 相对于标准键 1u 的宽度倍数，默认 1 */
  width: number;
}

/** 标准键尺寸（像素） */
export const KEY_UNIT = 52;
/** 键帽间距 */
export const KEY_GAP = 4;

export const KEYBOARD_LAYOUT: readonly KeyDef[][] = [
  // Row 0: 数字行
  [
    { id: "backquote", label: "`", width: 1 },
    { id: "1", label: "1", width: 1 },
    { id: "2", label: "2", width: 1 },
    { id: "3", label: "3", width: 1 },
    { id: "4", label: "4", width: 1 },
    { id: "5", label: "5", width: 1 },
    { id: "6", label: "6", width: 1 },
    { id: "7", label: "7", width: 1 },
    { id: "8", label: "8", width: 1 },
    { id: "9", label: "9", width: 1 },
    { id: "0", label: "0", width: 1 },
    { id: "minus", label: "-", width: 1 },
    { id: "equal", label: "=", width: 1 },
    { id: "backspace", label: "Back", width: 2 },
  ],
  // Row 1: QWERTY
  [
    { id: "tab", label: "Tab", width: 1.5 },
    { id: "q", label: "Q", width: 1 },
    { id: "w", label: "W", width: 1 },
    { id: "e", label: "E", width: 1 },
    { id: "r", label: "R", width: 1 },
    { id: "t", label: "T", width: 1 },
    { id: "y", label: "Y", width: 1 },
    { id: "u", label: "U", width: 1 },
    { id: "i", label: "I", width: 1 },
    { id: "o", label: "O", width: 1 },
    { id: "p", label: "P", width: 1 },
    { id: "bracket_l", label: "[", width: 1 },
    { id: "bracket_r", label: "]", width: 1 },
    { id: "backslash", label: "\\", width: 1.5 },
  ],
  // Row 2: Home Row
  [
    { id: "capslock", label: "Caps", width: 1.75 },
    { id: "a", label: "A", width: 1 },
    { id: "s", label: "S", width: 1 },
    { id: "d", label: "D", width: 1 },
    { id: "f", label: "F", width: 1 },
    { id: "g", label: "G", width: 1 },
    { id: "h", label: "H", width: 1 },
    { id: "j", label: "J", width: 1 },
    { id: "k", label: "K", width: 1 },
    { id: "l", label: "L", width: 1 },
    { id: "semicolon", label: ";", width: 1 },
    { id: "quote", label: "'", width: 1 },
    { id: "enter", label: "Enter", width: 2.25 },
  ],
  // Row 3: Shift Row
  [
    { id: "shift_l", label: "Shift", width: 2.25 },
    { id: "z", label: "Z", width: 1 },
    { id: "x", label: "X", width: 1 },
    { id: "c", label: "C", width: 1 },
    { id: "v", label: "V", width: 1 },
    { id: "b", label: "B", width: 1 },
    { id: "n", label: "N", width: 1 },
    { id: "m", label: "M", width: 1 },
    { id: "comma", label: ",", width: 1 },
    { id: "dot", label: ".", width: 1 },
    { id: "slash", label: "/", width: 1 },
    { id: "shift_r", label: "Shift", width: 2.75 },
  ],
  // Row 4: Bottom Row (macOS)
  [
    { id: "ctrl_l", label: "Ctrl", width: 1.25 },
    { id: "alt_l", label: "Opt", width: 1.25 },
    { id: "cmd_l", label: "Cmd", width: 1.5 },
    { id: "space", label: "Space", width: 6 },
    { id: "cmd_r", label: "Cmd", width: 1.5 },
    { id: "alt_r", label: "Opt", width: 1.25 },
    { id: "left", label: "<", width: 1 },
    { id: "up", label: "^", width: 1 },
    { id: "down", label: "v", width: 1 },
    { id: "right", label: ">", width: 1 },
  ],
];

/** 可以种植作物的键 */
export const PLANTABLE_KEY_IDS: readonly string[] = KEYBOARD_LAYOUT
  .flat()
  .map((k) => k.id)
  .filter(
    (id) =>
      ![
        "tab", "capslock", "shift_l", "shift_r",
        "ctrl_l", "alt_l", "alt_r", "cmd_l", "cmd_r",
        "backspace", "enter", "space",
      ].includes(id)
  );

/** 功能键映射 */
export const MODIFIER_ACTIONS: Readonly<Record<string, string>> = {
  shift_l: "fertilize",
  shift_r: "fertilize",
  enter: "harvest_all",
  backspace: "remove",
  tab: "switch_seed",
  capslock: "water",
  space: "speed_boost",
  ctrl_l: "item_1",
  alt_l: "item_2",
  cmd_l: "item_3",
  cmd_r: "item_3",
  alt_r: "item_2",
};
```

### 5.3 作物配置

`src/config/crops.ts`：

```typescript
export interface CropConfig {
  readonly id: string;
  readonly name: string;
  /** 每个生长阶段需要的按键次数 */
  readonly hitsPerStage: number;
  /** 生长阶段数（不含空地和成熟） */
  readonly growthStages: number;
  /** 售价 */
  readonly sellPrice: number;
  /** 解锁所需金币，0 为初始解锁 */
  readonly unlockCost: number;
  /** 作物强调色（用于 UI 高亮） */
  readonly accentColor: number;
}

export const CROPS: readonly CropConfig[] = [
  {
    id: "wheat", name: "小麦",
    hitsPerStage: 2, growthStages: 3,
    sellPrice: 5, unlockCost: 0,
    accentColor: 0xf5deb3,
  },
  {
    id: "carrot", name: "胡萝卜",
    hitsPerStage: 3, growthStages: 3,
    sellPrice: 10, unlockCost: 0,
    accentColor: 0xed9121,
  },
  {
    id: "tomato", name: "番茄",
    hitsPerStage: 4, growthStages: 4,
    sellPrice: 18, unlockCost: 80,
    accentColor: 0xff6347,
  },
  {
    id: "corn", name: "玉米",
    hitsPerStage: 5, growthStages: 4,
    sellPrice: 25, unlockCost: 200,
    accentColor: 0xffd700,
  },
  {
    id: "eggplant", name: "茄子",
    hitsPerStage: 6, growthStages: 4,
    sellPrice: 35, unlockCost: 500,
    accentColor: 0x8b5cf6,
  },
  {
    id: "strawberry", name: "草莓",
    hitsPerStage: 8, growthStages: 5,
    sellPrice: 50, unlockCost: 1000,
    accentColor: 0xff4d6a,
  },
  {
    id: "pumpkin", name: "南瓜",
    hitsPerStage: 10, growthStages: 5,
    sellPrice: 80, unlockCost: 2500,
    accentColor: 0xff8c00,
  },
  {
    id: "sunflower", name: "向日葵",
    hitsPerStage: 12, growthStages: 5,
    sellPrice: 120, unlockCost: 5000,
    accentColor: 0xffc107,
  },
];
```

### 5.4 动物配置

`src/config/animals.ts`：

```typescript
export interface AnimalConfig {
  readonly id: string;
  readonly name: string;
  /** 累计收获次数达到此值时解锁 */
  readonly unlockHarvest: number;
  /** 解锁提示文案 */
  readonly unlockMessage: string;
  /** 移动速度（像素/秒） */
  readonly speed: number;
}

export const ANIMALS: readonly AnimalConfig[] = [
  { id: "cat", name: "小猫", unlockHarvest: 30, speed: 20, unlockMessage: "一只小猫被麦田的香气吸引，搬来了农场!" },
  { id: "dog", name: "小狗", unlockHarvest: 80, speed: 25, unlockMessage: "一只忠诚的小狗主动来帮你守护农场!" },
  { id: "rabbit", name: "兔子", unlockHarvest: 150, speed: 35, unlockMessage: "一只蹦蹦跳跳的兔子在胡萝卜地里安了家!" },
  { id: "chicken", name: "小鸡", unlockHarvest: 250, speed: 15, unlockMessage: "一群小鸡来到你的玉米田觅食!" },
  { id: "sheep", name: "绵羊", unlockHarvest: 400, speed: 12, unlockMessage: "一只毛茸茸的绵羊在草地上悠闲散步!" },
  { id: "cow", name: "奶牛", unlockHarvest: 600, speed: 10, unlockMessage: "一头温柔的奶牛在农场定居了!" },
  { id: "pig", name: "小猪", unlockHarvest: 1000, speed: 18, unlockMessage: "一只可爱的小猪在泥地里打滚!" },
];
```

### 5.5 全局常量

`src/config/constants.ts`：

```typescript
/** 游戏画布尺寸 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** 键盘农场岛在画布中的偏移（左上角坐标） */
export const FARM_OFFSET_X = 80;
export const FARM_OFFSET_Y = 120;

/** 装饰建筑区域高度（键盘上方） */
export const DECO_HEIGHT = 100;

/** 自动保存间隔（毫秒） */
export const AUTO_SAVE_INTERVAL = 60_000;

/** 番茄钟默认时长（分钟） */
export const POMODORO_WORK = 25;
export const POMODORO_BREAK = 5;
export const POMODORO_LONG_BREAK = 15;

/** 日夜周期：番茄钟专注时进入夜晚模式 */
export const NIGHT_TINT = 0x4466aa;
export const DAY_TINT = 0xffffff;

/** 场景 key 常量 */
export const SCENE_KEYS = {
  BOOT: "BootScene",
  FARM: "FarmScene",
  SHOP: "ShopScene",
  TASK: "TaskScene",
  STATS: "StatsScene",
  SETTINGS: "SettingsScene",
} as const;
```

### 5.6 Tauri 事件桥接

`src/systems/InputBridge.ts`：

```typescript
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface InputEventPayload {
  event_type: string;
  key_id: string;
  timestamp: number;
}

type InputCallback = (keyId: string, eventType: string) => void;

/**
 * Tauri 全局输入事件 → 游戏回调
 * 纯函数式，不持有状态
 */
export async function startInputBridge(onInput: InputCallback): Promise<void> {
  await listen<InputEventPayload>("global-input", (event) => {
    const { event_type, key_id } = event.payload;
    onInput(key_id, event_type);
  });
}

export async function checkAccessibility(): Promise<boolean> {
  try {
    return await invoke<boolean>("check_accessibility");
  } catch {
    return false;
  }
}

export async function openAccessibilitySettings(): Promise<void> {
  try {
    await invoke("open_accessibility_settings");
  } catch (e) {
    console.error("Failed to open settings:", e);
  }
}
```

### 5.7 存档管理

`src/systems/SaveManager.ts`：

```typescript
import { invoke } from "@tauri-apps/api/core";
import type { GameState } from "../systems/FarmManager";

export async function saveGame(state: GameState): Promise<void> {
  const json = JSON.stringify(state);
  await invoke("save_game", { stateJson: json });
}

export async function loadGame(): Promise<GameState | null> {
  const json = await invoke<string | null>("load_game");
  if (!json) return null;
  return JSON.parse(json) as GameState;
}
```

### 5.8 农场核心逻辑

`src/systems/FarmManager.ts`：

```typescript
import { CROPS, type CropConfig } from "../config/crops";
import { ANIMALS } from "../config/animals";
import { PLANTABLE_KEY_IDS, MODIFIER_ACTIONS } from "../config/keyboard-layout";

// ─── 类型定义 ───

export interface PlotState {
  readonly cropId: string | null;
  readonly stage: number;
  readonly hits: number;
  readonly fertilized: boolean;
  readonly watered: boolean;
  readonly lastHitTime: number;
}

export interface GameState {
  readonly plots: Readonly<Record<string, PlotState>>;
  readonly gold: number;
  readonly totalHarvests: number;
  readonly selectedCropId: string;
  readonly unlockedCropIds: readonly string[];
  readonly unlockedAnimalIds: readonly string[];
  readonly stats: {
    readonly totalKeyPresses: number;
    readonly totalMouseClicks: number;
    readonly sessionStartTime: number;
    readonly todayKeyPresses: number;
    readonly todayDate: string;
  };
  readonly pomodoroActive: boolean;
  readonly pomodoroEndTime: number | null;
}

export interface GameEvent {
  readonly type:
    | "plant" | "grow" | "mature" | "harvest"
    | "fertilize" | "water" | "harvest_all"
    | "remove" | "switch_seed" | "speed_boost"
    | "animal_unlock";
  readonly keyId: string;
  readonly data?: Record<string, unknown>;
}

type EventListener = (event: GameEvent) => void;

// ─── 初始状态 ───

function createEmptyPlot(): PlotState {
  return { cropId: null, stage: 0, hits: 0, fertilized: false, watered: false, lastHitTime: 0 };
}

export function createInitialState(): GameState {
  const plots: Record<string, PlotState> = {};
  for (const id of PLANTABLE_KEY_IDS) {
    plots[id] = createEmptyPlot();
  }
  for (const id of Object.keys(MODIFIER_ACTIONS)) {
    plots[id] = createEmptyPlot();
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
    pomodoroActive: false,
    pomodoroEndTime: null,
  };
}

// ─── 不可变更新辅助 ───

function updatePlot(
  state: GameState, keyId: string, patch: Partial<PlotState>
): GameState {
  return {
    ...state,
    plots: {
      ...state.plots,
      [keyId]: { ...state.plots[keyId], ...patch },
    },
  };
}

// ─── 核心管理器 ───

export class FarmManager {
  private state: GameState;
  private readonly listeners: EventListener[] = [];

  constructor(initial?: GameState) {
    this.state = initial ?? createInitialState();
  }

  getState(): GameState {
    return this.state;
  }

  onEvent(listener: EventListener): void {
    this.listeners.push(listener);
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  restoreState(saved: GameState): void {
    this.state = saved;
  }

  // ─── 输入处理入口 ───

  handleInput(keyId: string, eventType: string): void {
    if (eventType === "mouse_click") {
      this.state = {
        ...this.state,
        stats: { ...this.state.stats, totalMouseClicks: this.state.stats.totalMouseClicks + 1 },
      };
      return;
    }

    // 更新按键统计
    const today = new Date().toISOString().slice(0, 10);
    const resetToday = this.state.stats.todayDate !== today;
    this.state = {
      ...this.state,
      stats: {
        ...this.state.stats,
        totalKeyPresses: this.state.stats.totalKeyPresses + 1,
        todayKeyPresses: resetToday ? 1 : this.state.stats.todayKeyPresses + 1,
        todayDate: today,
      },
    };

    // 重置每日浇水
    if (resetToday) {
      const resetPlots = { ...this.state.plots };
      for (const [id, plot] of Object.entries(resetPlots)) {
        if (plot.watered) {
          resetPlots[id] = { ...plot, watered: false };
        }
      }
      this.state = { ...this.state, plots: resetPlots };
    }

    // 功能键
    if (keyId in MODIFIER_ACTIONS) {
      this.handleModifier(keyId);
      return;
    }

    // 种田键
    if (!(PLANTABLE_KEY_IDS as readonly string[]).includes(keyId)) return;
    this.handleFarmKey(keyId);
  }

  // ─── 种田逻辑 ───

  private handleFarmKey(keyId: string): void {
    const now = Date.now();
    const plot = this.state.plots[keyId];
    if (!plot) return;

    if (!plot.cropId) {
      // 播种
      if (!this.state.unlockedCropIds.includes(this.state.selectedCropId)) return;
      this.state = updatePlot(this.state, keyId, {
        cropId: this.state.selectedCropId,
        stage: 0,
        hits: 0,
        fertilized: false,
        watered: false,
        lastHitTime: now,
      });
      this.emit({ type: "plant", keyId });
      return;
    }

    const cropConfig = CROPS.find((c) => c.id === plot.cropId);
    if (!cropConfig) return;

    if (plot.stage < cropConfig.growthStages) {
      // 生长
      const increment = plot.watered ? 2 : 1;
      const threshold = plot.fertilized
        ? Math.ceil(cropConfig.hitsPerStage / 2)
        : cropConfig.hitsPerStage;
      const newHits = plot.hits + increment;

      if (newHits >= threshold) {
        const newStage = plot.stage + 1;
        this.state = updatePlot(this.state, keyId, {
          stage: newStage, hits: 0, lastHitTime: now,
        });
        if (newStage >= cropConfig.growthStages) {
          this.emit({ type: "mature", keyId });
        } else {
          this.emit({ type: "grow", keyId, data: { stage: newStage } });
        }
      } else {
        this.state = updatePlot(this.state, keyId, {
          hits: newHits, lastHitTime: now,
        });
      }
    } else {
      // 收获
      this.state = {
        ...updatePlot(this.state, keyId, createEmptyPlot()),
        gold: this.state.gold + cropConfig.sellPrice,
        totalHarvests: this.state.totalHarvests + 1,
      };
      this.emit({
        type: "harvest", keyId,
        data: { cropId: plot.cropId, gold: cropConfig.sellPrice },
      });
      this.checkUnlocks();
    }
  }

  // ─── 功能键逻辑 ───

  private handleModifier(keyId: string): void {
    const action = MODIFIER_ACTIONS[keyId];

    switch (action) {
      case "fertilize": {
        const target = this.findMostRecentGrowingPlot();
        if (target) {
          this.state = updatePlot(this.state, target, { fertilized: true });
          this.emit({ type: "fertilize", keyId: target });
        }
        break;
      }
      case "harvest_all": {
        let totalGold = 0;
        let harvests = 0;
        const newPlots = { ...this.state.plots };
        for (const [id, plot] of Object.entries(newPlots)) {
          if (!plot.cropId) continue;
          const config = CROPS.find((c) => c.id === plot.cropId);
          if (!config || plot.stage < config.growthStages) continue;
          totalGold += config.sellPrice;
          harvests++;
          newPlots[id] = createEmptyPlot();
        }
        if (totalGold > 0) {
          this.state = {
            ...this.state,
            plots: newPlots,
            gold: this.state.gold + totalGold,
            totalHarvests: this.state.totalHarvests + harvests,
          };
          this.emit({ type: "harvest_all", keyId, data: { gold: totalGold } });
          this.checkUnlocks();
        }
        break;
      }
      case "remove": {
        const target = this.findMostRecentPlantedPlot();
        if (target) {
          this.state = updatePlot(this.state, target, createEmptyPlot());
          this.emit({ type: "remove", keyId: target });
        }
        break;
      }
      case "switch_seed": {
        const ids = this.state.unlockedCropIds;
        const idx = ids.indexOf(this.state.selectedCropId);
        const nextId = ids[(idx + 1) % ids.length];
        this.state = { ...this.state, selectedCropId: nextId };
        this.emit({ type: "switch_seed", keyId, data: { cropId: nextId } });
        break;
      }
      case "water": {
        const newPlots = { ...this.state.plots };
        for (const [id, plot] of Object.entries(newPlots)) {
          if (plot.cropId) {
            newPlots[id] = { ...plot, watered: true };
          }
        }
        this.state = { ...this.state, plots: newPlots };
        this.emit({ type: "water", keyId });
        break;
      }
      case "speed_boost": {
        const newPlots = { ...this.state.plots };
        for (const [id, plot] of Object.entries(newPlots)) {
          if (!plot.cropId) continue;
          const config = CROPS.find((c) => c.id === plot.cropId);
          if (!config || plot.stage >= config.growthStages) continue;
          const threshold = plot.fertilized
            ? Math.ceil(config.hitsPerStage / 2)
            : config.hitsPerStage;
          const newHits = plot.hits + 1;
          if (newHits >= threshold) {
            const newStage = plot.stage + 1;
            newPlots[id] = { ...plot, stage: newStage, hits: 0 };
            if (newStage >= config.growthStages) {
              this.emit({ type: "mature", keyId: id });
            }
          } else {
            newPlots[id] = { ...plot, hits: newHits };
          }
        }
        this.state = { ...this.state, plots: newPlots };
        this.emit({ type: "speed_boost", keyId });
        break;
      }
    }
  }

  // ─── 查找辅助 ───

  private findMostRecentGrowingPlot(): string | null {
    let best: [string, number] | null = null;
    for (const [id, plot] of Object.entries(this.state.plots)) {
      if (!plot.cropId || plot.fertilized) continue;
      const config = CROPS.find((c) => c.id === plot.cropId);
      if (!config || plot.stage >= config.growthStages) continue;
      if (!best || plot.lastHitTime > best[1]) {
        best = [id, plot.lastHitTime];
      }
    }
    return best ? best[0] : null;
  }

  private findMostRecentPlantedPlot(): string | null {
    let best: [string, number] | null = null;
    for (const [id, plot] of Object.entries(this.state.plots)) {
      if (!plot.cropId) continue;
      if (!best || plot.lastHitTime > best[1]) {
        best = [id, plot.lastHitTime];
      }
    }
    return best ? best[0] : null;
  }

  // ─── 解锁检查 ───

  private checkUnlocks(): void {
    // 作物解锁
    const newCrops = CROPS
      .filter((c) => c.unlockCost > 0
        && !this.state.unlockedCropIds.includes(c.id)
        && this.state.gold >= c.unlockCost)
      .map((c) => c.id);

    // 动物解锁
    const newAnimals = ANIMALS
      .filter((a) => !this.state.unlockedAnimalIds.includes(a.id)
        && this.state.totalHarvests >= a.unlockHarvest)
      .map((a) => a.id);

    if (newCrops.length > 0 || newAnimals.length > 0) {
      this.state = {
        ...this.state,
        unlockedCropIds: [...this.state.unlockedCropIds, ...newCrops],
        unlockedAnimalIds: [...this.state.unlockedAnimalIds, ...newAnimals],
      };
      for (const id of newAnimals) {
        this.emit({ type: "animal_unlock", keyId: "", data: { animalId: id } });
      }
    }
  }
}
```

---

## 六、第四阶段 — Phaser 场景实现

### 6.1 BootScene（资源预加载）

`src/scenes/BootScene.ts`：

加载所有 Spritesheet、音频、字体。加载完成后切换到 FarmScene。

**需要加载的资源清单**：

| 资源 key | 文件路径 | 说明 |
|----------|---------|------|
| `bg-sky` | `assets/sprites/bg-sky.png` | 蓝天白云背景 |
| `bg-grass` | `assets/sprites/bg-grass.png` | 草地底部 |
| `farm-board` | `assets/sprites/farm-board.png` | 键盘底板（泥土+木框） |
| `key-soil` | `assets/sprites/key-soil.png` | 空地键帽纹理 |
| `key-grass` | `assets/sprites/key-grass.png` | 有作物键帽纹理 |
| `key-modifier` | `assets/sprites/key-modifier.png` | 功能键纹理 |
| `crop-{id}` | `assets/sprites/crops/{id}.png` | 各作物 Spritesheet（每帧一个阶段） |
| `animal-{id}` | `assets/sprites/animals/{id}.png` | 各动物行走 Spritesheet |
| `building-barn` | `assets/sprites/buildings/barn.png` | 谷仓 |
| `building-clock` | `assets/sprites/buildings/clock.png` | 钟楼 |
| `building-tree` | `assets/sprites/buildings/tree.png` | 大树 |
| `building-fence` | `assets/sprites/buildings/fence.png` | 栅栏 |
| `building-mailbox` | `assets/sprites/buildings/mailbox.png` | 邮箱 |
| `building-well` | `assets/sprites/buildings/well.png` | 水井 |
| `building-windvane` | `assets/sprites/buildings/windvane.png` | 风向标 |
| `building-signpost` | `assets/sprites/buildings/signpost.png` | 指路牌 |
| `shop-tent` | `assets/sprites/ui/shop-tent.png` | 商店帐篷 |
| `ui-coin` | `assets/sprites/ui/coin.png` | 金币图标 |
| `ui-panel` | `assets/sprites/ui/panel.png` | 通用面板背景 |
| `tomato-timer` | `assets/sprites/ui/tomato-timer.png` | 番茄钟造型 |
| `particle-coin` | `assets/sprites/ui/particle-coin.png` | 金币粒子 |
| `particle-leaf` | `assets/sprites/ui/particle-leaf.png` | 叶子粒子 |
| `particle-star` | `assets/sprites/ui/particle-star.png` | 星星粒子 |

音频：

| key | 文件路径 | 说明 |
|-----|---------|------|
| `bgm-day` | `assets/audio/bgm/day.mp3` | 白天背景音乐 |
| `bgm-night` | `assets/audio/bgm/night.mp3` | 夜晚背景音乐 |
| `sfx-plant` | `assets/audio/sfx/plant.mp3` | 播种音效 |
| `sfx-grow` | `assets/audio/sfx/grow.mp3` | 生长音效 |
| `sfx-harvest` | `assets/audio/sfx/harvest.mp3` | 收获音效 |
| `sfx-coin` | `assets/audio/sfx/coin.mp3` | 金币音效 |
| `sfx-unlock` | `assets/audio/sfx/unlock.mp3` | 解锁音效 |

### 6.2 FarmScene（核心场景）

`src/scenes/FarmScene.ts` 是游戏的主场景，负责：

**渲染层次（从底到顶）**：

```
Layer 0: 背景（蓝天 + 草地）
Layer 1: 键盘底板（farm-board，泥土框+木栅栏）
Layer 2: 键帽网格（KeyPlot 对象，每个键一块田）
Layer 3: 作物 Sprite（在键帽上方）
Layer 4: 动物 Sprite（在键帽上行走）
Layer 5: 装饰建筑群（键盘上方：谷仓、钟楼、大树等）
Layer 6: 粒子特效（金币飘散、收获星星）
Layer 7: HUD（顶部状态栏、种子选择器、Tab 栏）
Layer 8: 弹窗层（Toast 通知、权限引导）
```

**键帽农田 (KeyPlot) 渲染规则**：

每个 KeyPlot 是一个 Phaser Container，包含：
- 底层：键帽 Sprite（key-soil / key-grass / key-modifier）
- 左上角：按键标签文字（小字号，半透明白色）
- 中央：作物 Sprite（根据 stage 切换帧）
- 底部：生长进度条（细长矩形，颜色跟随作物 accentColor）
- 成熟时：键帽边缘发光 Shader 或 Tween 呼吸动画

**键帽尺寸**：
- 标准键 1u = 52x52 像素
- 间距 4px
- 功能键按 width 系数缩放宽度

**按键动画**：
- 按下时：Tween scale 0.93，duration 80ms，yoyo true
- 播种：土地翻动 Sprite 序列 + 种子落下
- 生长：作物帧切换 + scale 弹跳（1.3→1，200ms）
- 成熟：边框呼吸发光（box-shadow 用 Phaser Graphics 模拟，sin 波 alpha 变化）
- 收获：金币粒子从键帽位置向上飘散 + "+N" 浮动文字（向上移动 + 淡出，800ms）

**装饰建筑布局**（键盘上方区域）：

```
左侧        中间              右侧
┌─────┬─────────────────────┬──────┐
│ 谷仓 │ 向日葵 钟楼 邮箱    │ 大树  │
│ 商店帐│ 栅栏 路灯 风向标    │ 水井  │
│     │                     │ 指路牌│
└─────┴─────────────────────┴──────┘
          键盘农田区域
```

建筑是静态 Sprite，不可交互（MVP 阶段）。后续迭代可加装修系统。

**动物行为**：
- 动物在键帽区域随机游走
- 使用简单 AI：随机选目标点 → Tween 移动到目标 → 停留 2-5 秒 → 再选新目标
- 行走时播放帧动画（左/右翻转）
- 到达位置后切换为 idle 帧

**日夜变化**：
- 番茄钟激活时：场景整体 tint 渐变为 NIGHT_TINT（2 秒过渡）
- 番茄钟结束时：渐变回 DAY_TINT
- 夜晚模式下动物切换为睡觉帧
- 背景音乐切换

### 6.3 ShopScene（种子商店）

左侧弹出帐篷造型面板：
- 网格展示所有种子（已解锁的可选择，未解锁的显示价格+锁图标）
- 点击种子切换当前选中种子
- 长按种子可拖拽到键帽上直接种植（后续迭代）
- "批量播种"按钮：一键在所有空地种当前选中的作物

### 6.4 TaskScene（任务清单 + 番茄钟）

参照指尖农场截图 ss3：
- 左侧面板：任务清单列表，可添加/勾选/删除任务，记录每个任务耗时
- 右上角：番茄钟（大番茄造型），显示倒计时
- 番茄钟设置：工作时长、休息时长、长休息时长
- 番茄钟启动时触发日夜变化

### 6.5 StatsScene（统计面板）

- 今日按键次数 / 鼠标点击次数
- 累计收获次数
- 累计金币
- 动物图鉴（已解锁 / 未解锁剪影）
- 作物图鉴

### 6.6 HUD（常驻 UI）

始终显示在画面顶部或底部：
- 金币数量
- 收获次数
- 今日按键数
- 当前选中种子图标
- Tab 栏按钮：农场 | 商店 | 任务 | 统计 | 设置

---

## 七、美术管线（AI 素材自动化生成）

所有素材通过 Doubao-Seedream API 自动生成，管线代码在 `tools/art-gen/` 目录。

### 7.1 API 配置

`tools/art-gen/config.ts`：

```typescript
export const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
export const ARK_MODEL = "doubao-seedream-5-0-260128";

/** 从环境变量读取，绝不硬编码 */
export function getApiKey(): string {
  const key = process.env.ARK_API_KEY;
  if (!key) {
    throw new Error("缺少环境变量 ARK_API_KEY，请在 .env 文件中配置");
  }
  return key;
}

/** 所有素材共用的风格 prompt 前缀 */
export const STYLE_PREFIX =
  "手绘卡通风格, 粗黑色线条描边, 暖色调, 圆润造型, 可爱治愈, 游戏素材, 纯色背景";

/** API 请求通用参数 */
export const DEFAULT_PARAMS = {
  model: ARK_MODEL,
  sequential_image_generation: "disabled",
  response_format: "url",
  stream: false,
  watermark: false,
} as const;
```

`.env.example`：

```
ARK_API_KEY=your_api_key_here
```

### 7.2 素材清单

`tools/art-gen/manifest.ts`：

清单定义每个素材的所有生成参数。新增素材只需往数组里加一条。

```typescript
export interface AssetEntry {
  /** 素材唯一 id，也是输出文件名（不含扩展名） */
  readonly id: string;
  /** 分类目录 */
  readonly category: "crops" | "animals" | "buildings" | "ui" | "backgrounds" | "keys" | "particles";
  /** 发给 Seedream 的 prompt（不含风格前缀，会自动拼接） */
  readonly prompt: string;
  /** API 请求的 size 参数 */
  readonly apiSize: string;
  /** 生成后需要裁剪/缩放到的最终尺寸 [width, height] */
  readonly targetSize: [number, number];
  /** Spritesheet 帧数，1 表示单图 */
  readonly frames: number;
  /** 多帧时，每帧的 prompt 后缀（描述不同阶段） */
  readonly framePrompts?: readonly string[];
}

export const ASSET_MANIFEST: readonly AssetEntry[] = [
  // ─── 背景 ───
  {
    id: "bg-sky", category: "backgrounds",
    prompt: "蓝天白云, 晴朗天气, 卡通天空背景, 横版, 渐变蓝色",
    apiSize: "1024x576", targetSize: [960, 300], frames: 1,
  },
  {
    id: "bg-grass", category: "backgrounds",
    prompt: "绿色草地, 自然草坪, 横版地面, 俯视角度, 嫩绿色",
    apiSize: "1024x576", targetSize: [960, 240], frames: 1,
  },

  // ─── 键盘底板 ───
  {
    id: "farm-board", category: "keys",
    prompt: "游戏键盘形状的农场岛, 泥土地面, 木头边框, 木栅栏围绕, 俯视角, 圆角矩形",
    apiSize: "1024x576", targetSize: [860, 320], frames: 1,
  },

  // ─── 键帽纹理 ───
  {
    id: "key-soil", category: "keys",
    prompt: "一小块泥土地, 翻过的棕色土壤, 正方形, 微微凸起, 游戏图标",
    apiSize: "512x512", targetSize: [64, 64], frames: 1,
  },
  {
    id: "key-grass", category: "keys",
    prompt: "一小块绿色草地, 嫩绿色草坪, 正方形, 生机勃勃, 游戏图标",
    apiSize: "512x512", targetSize: [64, 64], frames: 1,
  },
  {
    id: "key-modifier", category: "keys",
    prompt: "一小块木板地面, 浅棕色木纹, 正方形, 功能按键, 游戏图标",
    apiSize: "512x512", targetSize: [64, 64], frames: 1,
  },

  // ─── 作物（每种多帧，各阶段分别生成后拼合） ───
  {
    id: "crop-wheat", category: "crops",
    prompt: "小麦作物", apiSize: "512x512", targetSize: [48, 48], frames: 4,
    framePrompts: ["刚播种的泥土小坑, 种子", "冒出的绿色小苗, 两片叶子", "长高的绿色麦苗, 茂盛", "成熟的金黄色麦穗, 饱满"],
  },
  {
    id: "crop-carrot", category: "crops",
    prompt: "胡萝卜作物", apiSize: "512x512", targetSize: [48, 48], frames: 4,
    framePrompts: ["刚播种的泥土小坑, 种子", "冒出的绿色小苗", "茂盛的绿色胡萝卜叶", "露出橙色胡萝卜头, 成熟"],
  },
  {
    id: "crop-tomato", category: "crops",
    prompt: "番茄作物", apiSize: "512x512", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "番茄植株长高", "开出黄色小花", "结出红色番茄果实, 成熟"],
  },
  {
    id: "crop-corn", category: "crops",
    prompt: "玉米作物", apiSize: "512x512", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "玉米秆长高", "玉米秆顶部有花穗", "金黄色玉米棒, 成熟"],
  },
  {
    id: "crop-eggplant", category: "crops",
    prompt: "茄子作物", apiSize: "512x512", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "茄子植株", "开出紫色花", "挂着紫色茄子, 成熟"],
  },
  {
    id: "crop-strawberry", category: "crops",
    prompt: "草莓作物", apiSize: "512x512", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "草莓叶片展开", "开出白色小花", "结出青色小果", "鲜红草莓果实, 成熟"],
  },
  {
    id: "crop-pumpkin", category: "crops",
    prompt: "南瓜作物", apiSize: "512x512", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "南瓜藤蔓展开", "开出黄色大花", "结出绿色小南瓜", "橙色大南瓜, 成熟"],
  },
  {
    id: "crop-sunflower", category: "crops",
    prompt: "向日葵", apiSize: "512x512", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "向日葵茎秆长高", "顶部长出花苞", "花苞打开一半", "盛开的金色向日葵, 成熟"],
  },

  // ─── 动物（4 帧行走） ───
  {
    id: "animal-cat", category: "animals",
    prompt: "橘色小猫", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿行走", "站立侧面", "迈右腿行走"],
  },
  {
    id: "animal-dog", category: "animals",
    prompt: "棕色小狗", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿行走", "站立侧面", "迈右腿行走"],
  },
  {
    id: "animal-rabbit", category: "animals",
    prompt: "白色兔子", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["蹲坐侧面", "跳起准备", "跳到空中", "落地"],
  },
  {
    id: "animal-chicken", category: "animals",
    prompt: "黄色小鸡", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左脚", "站立侧面", "迈右脚"],
  },
  {
    id: "animal-sheep", category: "animals",
    prompt: "白色绵羊", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },
  {
    id: "animal-cow", category: "animals",
    prompt: "黑白花纹奶牛", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },
  {
    id: "animal-pig", category: "animals",
    prompt: "粉色小猪", apiSize: "512x512", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },

  // ─── 装饰建筑 ───
  {
    id: "building-barn", category: "buildings",
    prompt: "红色小谷仓, 尖顶, 木门, 农场建筑",
    apiSize: "512x512", targetSize: [128, 128], frames: 1,
  },
  {
    id: "building-clock", category: "buildings",
    prompt: "小型钟楼, 木头结构, 顶部有时钟, 农场建筑",
    apiSize: "512x512", targetSize: [96, 128], frames: 1,
  },
  {
    id: "building-tree", category: "buildings",
    prompt: "一棵大绿树, 圆形树冠, 粗树干, 农场大树",
    apiSize: "512x512", targetSize: [128, 128], frames: 1,
  },
  {
    id: "building-fence", category: "buildings",
    prompt: "一段木栅栏, 白色木头栅栏, 三根竖柱两根横杠",
    apiSize: "512x512", targetSize: [96, 64], frames: 1,
  },
  {
    id: "building-mailbox", category: "buildings",
    prompt: "红色邮箱, 木杆上的信箱, 农场邮箱",
    apiSize: "512x512", targetSize: [48, 80], frames: 1,
  },
  {
    id: "building-well", category: "buildings",
    prompt: "石头水井, 木桶和绳子, 农场水井",
    apiSize: "512x512", targetSize: [80, 96], frames: 1,
  },
  {
    id: "building-windvane", category: "buildings",
    prompt: "风向标, 公鸡造型, 金属杆上, 农场装饰",
    apiSize: "512x512", targetSize: [48, 96], frames: 1,
  },
  {
    id: "building-signpost", category: "buildings",
    prompt: "木制指路牌, 两块木板箭头, 农场标识",
    apiSize: "512x512", targetSize: [64, 96], frames: 1,
  },

  // ─── UI 元素 ───
  {
    id: "ui-coin", category: "ui",
    prompt: "一枚金色硬币, 游戏金币图标, 正面有星号",
    apiSize: "512x512", targetSize: [32, 32], frames: 1,
  },
  {
    id: "ui-panel", category: "ui",
    prompt: "棕色木质面板, 游戏 UI 背景板, 圆角矩形, 木纹",
    apiSize: "512x512", targetSize: [256, 192], frames: 1,
  },
  {
    id: "shop-tent", category: "ui",
    prompt: "红白条纹帐篷, 商店摊位, 农场市集, 正面视角",
    apiSize: "512x512", targetSize: [192, 160], frames: 1,
  },
  {
    id: "tomato-timer", category: "ui",
    prompt: "一个大番茄造型的计时器, 红色番茄, 顶部有绿色叶子, 正面有时钟表盘",
    apiSize: "512x512", targetSize: [96, 96], frames: 1,
  },

  // ─── 粒子 ───
  {
    id: "particle-coin", category: "particles",
    prompt: "小金币, 迷你游戏粒子, 闪亮",
    apiSize: "512x512", targetSize: [16, 16], frames: 1,
  },
  {
    id: "particle-leaf", category: "particles",
    prompt: "绿色小叶子, 迷你游戏粒子, 飘落",
    apiSize: "512x512", targetSize: [16, 16], frames: 1,
  },
  {
    id: "particle-star", category: "particles",
    prompt: "黄色小星星, 迷你游戏粒子, 闪烁",
    apiSize: "512x512", targetSize: [16, 16], frames: 1,
  },
];
```

### 7.3 生成脚本

`tools/art-gen/generate.ts`：

```typescript
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getApiKey, ARK_API_URL, DEFAULT_PARAMS, STYLE_PREFIX } from "./config";
import { ASSET_MANIFEST, type AssetEntry } from "./manifest";

const RAW_DIR = join(__dirname, "../../public/assets/.raw");
const SPRITES_DIR = join(__dirname, "../../public/assets/sprites");

interface ApiResponse {
  data: Array<{ url: string }>;
}

/** 调用 Seedream API 生成单张图片 */
async function generateImage(prompt: string, size: string): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(ARK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...DEFAULT_PARAMS,
      prompt: `${STYLE_PREFIX}, ${prompt}`,
      size,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${text}`);
  }

  const result = (await response.json()) as ApiResponse;
  return result.data[0].url;
}

/** 下载图片到本地 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

/** 生成单个素材条目 */
async function generateEntry(entry: AssetEntry): Promise<void> {
  const rawDir = join(RAW_DIR, entry.category);
  await mkdir(rawDir, { recursive: true });

  if (entry.frames === 1) {
    // 单帧素材
    console.log(`  生成 ${entry.id}...`);
    const url = await generateImage(entry.prompt, entry.apiSize);
    await downloadImage(url, join(rawDir, `${entry.id}.png`));
  } else {
    // 多帧素材：每帧单独生成
    for (let i = 0; i < entry.frames; i++) {
      const framePrompt = entry.framePrompts?.[i] ?? `第${i + 1}阶段`;
      const fullPrompt = `${entry.prompt}, ${framePrompt}`;
      console.log(`  生成 ${entry.id} 帧${i}/${entry.frames}...`);
      const url = await generateImage(fullPrompt, entry.apiSize);
      await downloadImage(url, join(rawDir, `${entry.id}_frame${i}.png`));

      // API 限流：每次请求间隔 500ms
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/** 主入口 */
export async function generate(filter?: string): Promise<void> {
  const entries = filter
    ? ASSET_MANIFEST.filter((e) => e.id.includes(filter) || e.category === filter)
    : [...ASSET_MANIFEST];

  console.log(`开始生成 ${entries.length} 个素材...`);

  for (const entry of entries) {
    try {
      await generateEntry(entry);
      console.log(`  [OK] ${entry.id}`);
    } catch (err) {
      console.error(`  [FAIL] ${entry.id}:`, err);
    }
  }

  console.log("原始图片生成完成。运行 npm run art:post 进行后处理。");
}
```

### 7.4 后处理脚本

`tools/art-gen/postprocess.ts`：

使用 `sharp` 库进行裁剪、缩放、去背景、拼 Spritesheet。

```typescript
import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { join } from "path";
import { ASSET_MANIFEST, type AssetEntry } from "./manifest";

const RAW_DIR = join(__dirname, "../../public/assets/.raw");
const SPRITES_DIR = join(__dirname, "../../public/assets/sprites");

/** 处理单帧素材：缩放到目标尺寸 */
async function processSingle(entry: AssetEntry): Promise<void> {
  const inputPath = join(RAW_DIR, entry.category, `${entry.id}.png`);
  const outputDir = join(SPRITES_DIR, entry.category);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${entry.id}.png`);

  await sharp(inputPath)
    .resize(entry.targetSize[0], entry.targetSize[1], { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
}

/** 处理多帧素材：缩放每帧后横向拼合为 Spritesheet */
async function processSpritesheet(entry: AssetEntry): Promise<void> {
  const [fw, fh] = entry.targetSize;
  const outputDir = join(SPRITES_DIR, entry.category);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${entry.id}.png`);

  // 读取并缩放每帧
  const frameBuffers: Buffer[] = [];
  for (let i = 0; i < entry.frames; i++) {
    const inputPath = join(RAW_DIR, entry.category, `${entry.id}_frame${i}.png`);
    const buf = await sharp(inputPath)
      .resize(fw, fh, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    frameBuffers.push(buf);
  }

  // 横向拼合
  const totalWidth = fw * entry.frames;
  const composites = frameBuffers.map((buf, i) => ({
    input: buf,
    left: i * fw,
    top: 0,
  }));

  await sharp({
    create: { width: totalWidth, height: fh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
}

/** 主入口 */
export async function postprocess(filter?: string): Promise<void> {
  const entries = filter
    ? ASSET_MANIFEST.filter((e) => e.id.includes(filter) || e.category === filter)
    : [...ASSET_MANIFEST];

  console.log(`后处理 ${entries.length} 个素材...`);

  for (const entry of entries) {
    try {
      if (entry.frames === 1) {
        await processSingle(entry);
      } else {
        await processSpritesheet(entry);
      }
      console.log(`  [OK] ${entry.id} → sprites/${entry.category}/${entry.id}.png`);
    } catch (err) {
      console.error(`  [FAIL] ${entry.id}:`, err);
    }
  }

  console.log("后处理完成。素材已输出到 public/assets/sprites/");
}
```

### 7.5 CLI 入口

`tools/art-gen/cli.ts`：

```typescript
import "dotenv/config";
import { generate } from "./generate";
import { postprocess } from "./postprocess";

const [,, command, filter] = process.argv;

async function main() {
  switch (command) {
    case "gen":
      await generate(filter);
      break;
    case "post":
      await postprocess(filter);
      break;
    case "all":
      await generate(filter);
      await postprocess(filter);
      break;
    default:
      console.log(`用法:
  npm run art:gen [filter]     生成原始图片
  npm run art:post [filter]    后处理（缩放+拼合）
  npm run art:all [filter]     生成 + 后处理

filter 可选：素材 id 或分类名（crops / animals / buildings / ui / ...）

示例:
  npm run art:all              全部生成
  npm run art:all crops        只生成作物
  npm run art:all crop-wheat   只生成小麦
  npm run art:gen animals      只生成动物原始图
  npm run art:post             只做后处理`);
  }
}

main().catch(console.error);
```

### 7.6 package.json scripts

```json
{
  "scripts": {
    "art:gen": "tsx tools/art-gen/cli.ts gen",
    "art:post": "tsx tools/art-gen/cli.ts post",
    "art:all": "tsx tools/art-gen/cli.ts all"
  }
}
```

额外 dev 依赖：

```bash
npm install -D sharp tsx dotenv
```

### 7.7 素材尺寸规范

| 类别 | 单帧尺寸 | 帧数 | Spritesheet 总尺寸 |
|------|---------|------|-------------------|
| 键帽纹理 | 64x64 | 1 | 64x64 |
| 作物阶段 | 48x48 | 4-6 | 192x48 ~ 288x48 |
| 动物行走 | 64x64 | 4 | 256x64 |
| 装饰建筑 | 48~128 | 1 | 各异 |
| UI 图标 | 32~256 | 1 | 各异 |
| 粒子 | 16x16 | 1 | 16x16 |
| 背景天空 | 960x300 | 1 | 960x300 |
| 背景草地 | 960x240 | 1 | 960x240 |
| 键盘底板 | 860x320 | 1 | 860x320 |

### 7.8 素材更新流程

新增一种作物/动物时：
1. 在 `manifest.ts` 中添加一条 AssetEntry
2. 在 `src/config/crops.ts` 或 `animals.ts` 中添加配置
3. 运行 `npm run art:all crop-newname`
4. 在 BootScene 中添加对应的 load 调用

更换全套风格时：
1. 修改 `config.ts` 中的 `STYLE_PREFIX`
2. 运行 `npm run art:all` 全量重新生成
3. 审查效果，微调个别 prompt 后单独重新生成

### 7.9 素材接口约定（保证可替换）

所有素材严格遵守以下约定。无论素材来源是 Seedream、AutoSprite、还是手绘，
只要遵守约定，直接替换 PNG 文件即可，代码零改动。

**动物 Spritesheet 约定**：

| 项 | 约定 |
|----|------|
| 路径 | `public/assets/sprites/animals/animal-{id}.png` |
| 帧尺寸 | 64x64 像素 |
| 帧数 | 4 帧横排（总图 256x64） |
| 帧顺序 | frame0=站立, frame1=迈左腿, frame2=站立, frame3=迈右腿 |
| 背景 | 透明 |

**作物 Spritesheet 约定**：

| 项 | 约定 |
|----|------|
| 路径 | `public/assets/sprites/crops/crop-{id}.png` |
| 帧尺寸 | 48x48 像素 |
| 帧数 | 4-6 帧横排（由 crops.ts 中 growthStages+1 决定） |
| 帧顺序 | frame0=种子, frame1=幼苗, ..., frameN=成熟 |
| 背景 | 透明 |

**单图素材约定**：

| 项 | 约定 |
|----|------|
| 路径 | `public/assets/sprites/{category}/{id}.png` |
| 尺寸 | 由 manifest.ts 中 targetSize 定义 |
| 背景 | 透明（背景类素材除外） |

### 7.10 素材来源策略

默认全部使用 Seedream API 自动生成（方案 B）。
如果动物行走动画帧间一致性不达标，可随时切换到 AutoSprite（方案 A）：

| 来源 | 覆盖范围 | 成本 | 自动化程度 |
|------|---------|------|-----------|
| Seedream API | 全部素材 | API 调用费 | 全自动（npm run art:all） |
| AutoSprite 网页版 | 仅动物行走 | 免费（3次/天） | 手动上传+下载 |

**切换方式**：用 AutoSprite 生成的 PNG 直接覆盖 `sprites/animals/animal-{id}.png`，
保持 64x64、4 帧横排即可。代码不需要任何改动。

### 7.11 Spritesheet 加载方式

Phaser 中使用等宽帧切割加载：

```typescript
// BootScene 中
this.load.spritesheet("crop-wheat", "assets/sprites/crops/crop-wheat.png", {
  frameWidth: 48,
  frameHeight: 48,
});

this.load.spritesheet("animal-cat", "assets/sprites/animals/animal-cat.png", {
  frameWidth: 64,
  frameHeight: 64,
});

// 单帧素材直接 load.image
this.load.image("building-barn", "assets/sprites/buildings/building-barn.png");
```

---

## 八、编码规范

- Rust 代码遵循 `cargo clippy` 建议
- TypeScript 严格模式 `"strict": true`
- **不可变数据**：GameState 所有更新返回新对象，不修改原对象
- 文件命名：Scene/Class 用 PascalCase，配置/工具用 kebab-case
- 单文件不超过 400 行，超出则拆分
- 函数不超过 50 行
- 所有用户可见文本使用中文
- 代码注释使用中文
- commit message 使用英文，遵循 conventional commits

---

## 九、验收标准

1. 应用启动后，在任意其他应用中打字，游戏窗口内对应键帽有按下动画反馈
2. 按下字母/数字/符号键时，空地自动播种当前选中的作物
3. 继续按同一个键，作物逐阶段生长，有帧动画切换
4. 再按一次成熟的键，收获作物获得金币，有粒子特效
5. Tab 键切换选中种子类型
6. Enter 键一键收获所有成熟作物
7. Shift 键给最近操作的田施肥
8. Space 键加速全部作物
9. 金币积累后自动解锁新作物
10. 收获累计后解锁动物，动物在键盘上行走
11. 完整键盘布局可见（5 行，包括底部修饰键行）
12. 键盘上方有装饰建筑群
13. 种子商店可以切换种子
14. 番茄钟功能可用，激活时进入夜晚模式
15. 任务清单可添加/勾选任务
16. 窗口可拖拽、置顶、最小化
17. 退出后再次启动，存档正常恢复
18. macOS 首次启动引导辅助功能权限
19. 后台 CPU 占用 < 3%
20. 手绘卡通美术风格，与指尖农场视觉品质接近

---

*文档版本: v2.0 | 技术栈: Tauri 2 + Phaser 3 + TypeScript + Vite*
