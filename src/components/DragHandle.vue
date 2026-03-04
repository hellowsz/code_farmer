<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  scalePercent: number;
}>();

const emit = defineEmits<{
  "zoom-in": [];
  "zoom-out": [];
  "zoom-reset": [];
}>();

const isAlwaysOnTop = ref(true);

async function toggleAlwaysOnTop() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    isAlwaysOnTop.value = !isAlwaysOnTop.value;
    await win.setAlwaysOnTop(isAlwaysOnTop.value);
  } catch {
    // 非 Tauri 环境
  }
}

async function minimizeWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  } catch {
    // 非 Tauri 环境
  }
}

async function closeWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    // 非 Tauri 环境
  }
}
</script>

<template>
  <div class="drag-handle">
    <!-- 拖拽手柄 -->
    <div class="drag-pill">
      <span class="drag-dot" />
      <span class="drag-dot" />
      <span class="drag-dot" />
    </div>

    <!-- hover 时显示的操作区（阻止冒泡，不触发拖拽） -->
    <div class="handle-actions" @mousedown.stop>
      <!-- 缩放控制 -->
      <div class="zoom-group">
        <button class="handle-btn" title="缩小" @click="emit('zoom-out')">−</button>
        <button
          class="handle-btn zoom-label"
          title="双击重置"
          @dblclick="emit('zoom-reset')"
        >{{ scalePercent }}%</button>
        <button class="handle-btn" title="放大" @click="emit('zoom-in')">+</button>
      </div>

      <span class="action-divider" />

      <!-- 窗口控制 -->
      <button
        class="handle-btn"
        :class="{ active: isAlwaysOnTop }"
        title="置顶"
        @click="toggleAlwaysOnTop"
      >📌</button>
      <button class="handle-btn" title="最小化" @click="minimizeWindow">─</button>
      <button class="handle-btn close" title="关闭" @click="closeWindow">✕</button>
    </div>
  </div>
</template>

<style scoped>
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 0;
  user-select: none;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-pill {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.drag-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
}

.handle-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}

.drag-handle:hover .handle-actions {
  opacity: 1;
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.action-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.handle-btn {
  height: 20px;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0 4px;
}

.handle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.handle-btn.close:hover {
  background: rgba(255, 80, 80, 0.4);
  color: #ff6b6b;
}

.handle-btn.active {
  color: #4ade80;
}

.zoom-label {
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  cursor: default;
  color: rgba(255, 255, 255, 0.5);
}

.zoom-label:hover {
  cursor: pointer;
}
</style>
