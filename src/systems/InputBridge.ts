import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export interface InputEvent {
  event_type: "key_press" | "mouse_click";
  key_id: string;
  timestamp: number;
}

export type InputCallback = (event: InputEvent) => void;

const listeners: InputCallback[] = [];
let unlisten: UnlistenFn | null = null;

/** 注册输入事件回调 */
export function onInput(callback: InputCallback): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/** 启动监听 Tauri 事件 */
export async function startInputBridge(): Promise<void> {
  if (unlisten) return;

  unlisten = await listen<InputEvent>("global-input", (event) => {
    const data = event.payload;
    for (const cb of listeners) {
      cb(data);
    }
  });
}

/** 停止监听 */
export function stopInputBridge(): void {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
}

/** 检查 macOS 辅助功能权限 */
export async function checkAccessibility(): Promise<boolean> {
  return invoke<boolean>("check_accessibility");
}

/** 打开 macOS 辅助功能设置 */
export async function openAccessibilitySettings(): Promise<void> {
  return invoke("open_accessibility_settings");
}
