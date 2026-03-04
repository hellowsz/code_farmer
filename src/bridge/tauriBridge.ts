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
  await listen<InputEventPayload>("global-input", (event) => {
    try {
      const { event_type, key_id } = event.payload;

      if (event_type === "key_press") {
        handleKeyInput(key_id);
      } else if (event_type === "mouse_click") {
        handleMouseClick();
      }
    } catch (e) {
      console.error("[Bridge] 处理输入事件出错:", e);
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
