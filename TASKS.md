# 键盘农场 — 任务清单与项目里程碑

---

## 里程碑总览

| # | 里程碑 | 目标 | 预期交付物 |
|---|--------|------|-----------|
| M0 | 项目骨架 | 跑通 Tauri + Phaser + 美术管线 | 窗口弹出、Phaser 画布渲染、art:gen 可用 |
| M1 | 核心验证 | 全局键盘监听 + 键帽高亮 | 在任意 App 打字，游戏窗口有反馈 |
| M2 | 可玩原型 | 种田核心循环（播种→生长→收获） | 用色块占位，逻辑跑通 |
| M3 | 视觉成型 | AI 生成素材 + 场景搭建 | 手绘卡通风格农场岛外观 |
| M4 | 功能完整 | 商店、番茄钟、任务清单、动物 | 全部功能可用 |
| M5 | 打磨发布 | 音效、存档、设置、平台适配 | 可分发的安装包 |

---

## M0 — 项目骨架

目标：从零搭建项目，确保 Tauri + Phaser + Vite 联调跑通。

- [x] 0.0 收集竞品参考资料（指尖农场截图、宣传图、介绍、更新日志 → `competitor/`）
- [x] 0.1 初始化 Tauri 2 项目（手动搭建，vanilla-ts 结构）
- [x] 0.2 配置 Rust 依赖（Cargo.toml: rdev, rusqlite, chrono, serde）
- [x] 0.3 安装前端依赖（phaser, typescript, vite）
- [x] 0.4 配置 vite.config.ts + tsconfig.json
- [x] 0.5 编写 index.html（game-container）
- [x] 0.6 编写 src/main.ts — Phaser Game 初始化，加载 BootScene
- [x] 0.7 配置 Tauri 窗口参数（decorations:false, transparent, alwaysOnTop）
- [x] 0.8 配置 Tauri capabilities（event permissions）
- [x] 0.9 `npm run tauri dev` 验证：窗口弹出 + Phaser 画布显示纯色背景
- [x] 0.10 搭建美术管线：
      - 安装 dev 依赖（sharp, tsx, dotenv）
      - 创建 .env.example（ARK_API_KEY）
      - 编写 tools/art-gen/config.ts（API 配置、风格前缀）
      - 编写 tools/art-gen/manifest.ts（完整素材清单 40 条）
      - 编写 tools/art-gen/generate.ts（调用 Seedream API）
      - 编写 tools/art-gen/postprocess.ts（sharp 缩放 + 拼 Spritesheet）
      - 编写 tools/art-gen/cli.ts（CLI 入口）
      - 添加 package.json scripts（art:gen / art:post / art:all）
- [x] 0.11 验证美术管线：`npm run art:all -- particle-star` 生成测试素材通过（API size 已修正为 1920x1920）
- [x] 0.12 .gitignore 添加 .env、public/assets/.raw/
- [ ] 0.13 首次提交 git

**验收**：
- `npm run tauri dev` 看到无边框置顶窗口 + Phaser 绿色画布
- `npm run art:all -- particle-star` 能调通 API 生成一张测试图并输出到 sprites/

---

## M1 — 核心验证（全局键盘监听）

目标：打通 Rust rdev 监听 → Tauri Event → Phaser 事件链路。

- [x] 1.1 编写 input_listener.rs（macOS: 直接 CGEventTap FFI，跳过 TSM 崩溃；非 macOS: rdev 后备）
- [x] 1.2 编写 accessibility.rs（macOS 辅助功能权限检查）
- [x] 1.3 编写 commands.rs（check_accessibility, open_accessibility_settings, save/load_game）
- [x] 1.4 编写 lib.rs（mpsc channel + 事件转发线程 + 权限轮询）
- [x] 1.5 编写 persistence.rs（SQLite 存档）
- [x] 1.6 编写 src/systems/InputBridge.ts（Tauri listen → 回调）
- [ ] 1.7 编写 src/config/keyboard-layout.ts（完整键盘布局数据）
- [x] 1.8 创建临时测试 Scene（BootScene: 显示最近按键 + 辅助功能状态）
- [x] 1.9 macOS 权限引导：检测到未授权时，画布上显示提示文字 + 点击跳转设置
- [x] 1.10 验证：在任意 App 打字，游戏窗口实时显示按键信息

**验收**：在任意 App 打字，Phaser 画布实时显示按下的 key_id 文本。

---

## M2 — 可玩原型（种田核心循环）

目标：用 Phaser Graphics 色块代替美术素材，跑通完整种田逻辑。

- [ ] 2.1 编写 src/config/crops.ts（作物配置数据）
- [ ] 2.2 编写 src/config/animals.ts（动物配置数据）
- [ ] 2.3 编写 src/config/constants.ts（全局常量）
- [ ] 2.4 编写 src/systems/FarmManager.ts（不可变状态 + 核心逻辑）
- [ ] 2.5 为 FarmManager 编写单元测试（播种/生长/收获/功能键）
- [ ] 2.6 编写 src/scenes/BootScene.ts（占位资源加载）
- [ ] 2.7 编写 src/objects/KeyPlot.ts — 用 Phaser Graphics 画色块键帽：
      - 空地 = 深棕色矩形
      - 种植中 = 绿色矩形 + 阶段数字
      - 成熟 = 金色矩形 + 闪烁
      - 功能键 = 蓝色矩形 + 功能文字
- [ ] 2.8 编写 src/scenes/FarmScene.ts — 渲染完整键盘布局：
      - 5 行键盘网格
      - 每个键帽是 KeyPlot 对象
      - 按键时对应键帽缩放动画
- [ ] 2.9 接入 FarmManager：按键 → 播种 → 生长 → 收获完整流程
- [ ] 2.10 编写 src/ui/HUD.ts — 顶部状态栏（文字：金币、收获数、按键数、当前种子）
- [ ] 2.11 编写 src/ui/Toast.ts — 收获时浮动 "+N 金币" 文字
- [ ] 2.12 功能键验证：Tab 切换种子、Enter 批量收获、Shift 施肥、Space 加速
- [ ] 2.13 端到端验证：打字 → 种满键盘 → 收获 → 金币增加 → 解锁新作物

**验收**：用色块 UI 可以完整体验种田循环，所有功能键生效。这是核心可玩性验证。

---

## M3 — 视觉成型（AI 美术 + 场景搭建）

目标：替换色块为 AI 生成的手绘素材，搭建农场岛视觉。

> **竞品参考**：开发时对照 `competitor/screenshots/` 下的截图：
> - `ss0-main-view.jpg` — 整体布局、键帽纹理、建筑群位置
> - `ss3-task-timer.jpg` — 番茄钟造型、任务列表 UI
> - `ss4-shop.jpg` — 商店帐篷、种子包装袋样式
> - `ss5-night-mode.jpg` — 夜间色调、动物睡觉姿态

### 3A — AI 素材批量生成（使用美术管线）

全部通过 `npm run art:all` 或分类生成，不手动操作。

- [ ] 3A.1 `npm run art:all backgrounds` — 生成背景（bg-sky, bg-grass）
- [ ] 3A.2 `npm run art:all keys` — 生成键帽纹理 + 键盘底板（key-soil, key-grass, key-modifier, farm-board）
- [ ] 3A.3 `npm run art:all crops` — 生成 8 种作物 Spritesheet（每种 4-6 帧）
- [ ] 3A.4 `npm run art:all animals` — 生成 7 种动物行走 Spritesheet（每种 4 帧）
- [ ] 3A.5 `npm run art:all buildings` — 生成 8 种装饰建筑
- [ ] 3A.6 `npm run art:all ui` — 生成 UI 元素（coin, panel, shop-tent, tomato-timer）
- [ ] 3A.7 `npm run art:all particles` — 生成粒子素材
- [ ] 3A.8 审查全部素材风格一致性，微调个别 prompt 后重新生成：
      `npm run art:all <需要重做的素材id>`
- [ ] 3A.9 确认所有 Spritesheet 尺寸正确，帧数对齐

### 3B — 场景搭建

- [ ] 3B.1 更新 BootScene：加载全部 Spritesheet + 创建动画定义
- [ ] 3B.2 改造 KeyPlot：色块替换为 Sprite（key-soil / key-grass / key-modifier）
- [ ] 3B.3 编写 src/objects/Crop.ts：作物 Sprite + 生长帧动画
- [ ] 3B.4 改造 FarmScene 渲染层次：背景 → 底板 → 键帽 → 作物 → 装饰
- [ ] 3B.5 编写 src/objects/Building.ts：放置装饰建筑到键盘上方区域
- [ ] 3B.6 按键动画升级：播种翻土、生长弹跳、成熟呼吸发光、收获粒子
- [ ] 3B.7 收获特效：金币粒子 + "+N" 浮动文字
- [ ] 3B.8 视觉微调：间距、对齐、层次遮挡、字体

**验收**：游戏外观接近指尖农场截图——键盘被农场岛包裹，上方有建筑群，作物有动画。

---

## M4 — 功能完整

目标：补全所有游戏系统。

### 4A — 动物系统

- [ ] 4A.1 编写 src/objects/Animal.ts（Sprite + 行走 AI + idle/walk 动画切换）
- [ ] 4A.2 编写 src/systems/AnimalManager.ts（解锁检查 + 实例管理）
- [ ] 4A.3 动物在键帽区域随机游走（Tween 移动 + 停留）
- [ ] 4A.4 解锁动物时弹出 Toast 通知

### 4B — 商店

- [ ] 4B.1 编写 src/scenes/ShopScene.ts（帐篷面板 + 种子网格）
- [ ] 4B.2 已解锁种子可选择，未解锁显示价格 + 锁图标
- [ ] 4B.3 "批量播种" 按钮

### 4C — 番茄钟 + 任务清单

- [ ] 4C.1 编写 src/scenes/TaskScene.ts（任务列表面板）
- [ ] 4C.2 任务增删改查 + 勾选完成 + 时间追踪
- [ ] 4C.3 编写 src/objects/PomodoroTimer.ts（番茄造型倒计时）
- [ ] 4C.4 番茄钟启动/暂停/重置逻辑
- [ ] 4C.5 编写 src/systems/DayNightCycle.ts — 番茄钟激活时场景 tint 渐变为夜晚
- [ ] 4C.6 夜晚模式下动物切换睡觉帧

### 4D — 统计 + 设置

- [ ] 4D.1 编写 src/scenes/StatsScene.ts（统计面板 + 图鉴）
- [ ] 4D.2 编写 src/scenes/SettingsScene.ts（音量、窗口置顶开关、番茄钟时长配置）

### 4E — HUD + 导航

- [ ] 4E.1 底部 Tab 栏（农场 / 商店 / 任务 / 统计 / 设置）
- [ ] 4E.2 Scene 切换动画（淡入淡出）

**验收**：全部功能可用，可以完整体验种田 + 番茄钟 + 任务清单 + 动物收集。

---

## M5 — 打磨发布

目标：生产级品质，可以分发。

### 5A — 音效

- [ ] 5A.1 编写 src/systems/AudioManager.ts（BGM + SFX 管理）
- [ ] 5A.2 获取/生成背景音乐（白天 + 夜晚）
- [ ] 5A.3 获取/生成音效（播种、生长、收获、金币、解锁）
- [ ] 5A.4 接入场景事件

### 5B — 数据持久化

- [ ] 5B.1 编写 persistence.rs（SQLite 存档读写）
- [ ] 5B.2 编写 src/systems/SaveManager.ts（前端序列化 + IPC 调用）
- [ ] 5B.3 自动保存（每 60 秒）
- [ ] 5B.4 退出保存（Tauri 窗口关闭事件）
- [ ] 5B.5 启动加载（恢复上次状态）
- [ ] 5B.6 任务清单数据持久化
- [ ] 5B.7 番茄钟历史记录持久化

### 5C — 系统功能

- [ ] 5C.1 macOS 辅助功能权限引导弹窗（AccessibilityGuide）
- [ ] 5C.2 系统托盘图标（最小化到托盘 + 点击恢复）
- [ ] 5C.3 自定义标题栏拖拽区域
- [ ] 5C.4 窗口置顶开关

### 5D — 性能优化

- [ ] 5D.1 Rust 层输入事件节流（10ms 内相同键去重）
- [ ] 5D.2 Phaser 渲染优化（不可见 Scene 暂停渲染）
- [ ] 5D.3 Sprite 合图（TexturePacker / 手动 Atlas）
- [ ] 5D.4 CPU 占用测试 < 3%

### 5E — 构建发布

- [ ] 5E.1 macOS 构建 + 签名（如有开发者证书）
- [ ] 5E.2 Windows 构建 + 测试
- [ ] 5E.3 应用图标设计
- [ ] 5E.4 安装包测试（全新安装 + 升级）

**验收**：双平台安装包可用，存档正常，性能达标，用户体验流畅。

---

## 执行顺序建议

```
M0 (骨架 + 美术管线) → M1 (键盘监听) → M2 (可玩原型)
                                              ↓
                          M3A (npm run art:all 批量生成) ← 可与 M2 并行
                                              ↓
                          M3B (视觉搭建) → M4 (功能完整) → M5 (打磨发布)
```

**并行策略**：M2 开发期间就可以运行 `npm run art:all` 生成素材。
**迭代策略**：后续新增作物/动物时，只需在 manifest.ts + crops.ts 加一条，然后 `npm run art:all <id>`。

---

## 当前状态

**活跃里程碑**：M1 — 核心验证
**当前进度**：M1 基本完成（1.7 keyboard-layout.ts 待实现），输入监听已验证通过
**下一步**：完成 1.7，然后进入 M2 — 可玩原型
