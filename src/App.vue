<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import DragHandle from "./components/DragHandle.vue";
import FloatingStatus from "./components/FloatingStatus.vue";
import KeyboardFarm from "./components/KeyboardFarm.vue";
import ShopPanel from "./components/ShopPanel.vue";
import AnimalPanel from "./components/AnimalPanel.vue";
import StatsPanel from "./components/StatsPanel.vue";
import FloatingTabs from "./components/FloatingTabs.vue";
import AccessibilityGuide from "./components/AccessibilityGuide.vue";
import { initTauriBridge, checkAccessibility } from "./bridge/tauriBridge";

const activeTab = ref<string>("farm");
const showAccessibilityGuide = ref(false);

// ─── 全局拖动 ───
async function startDrag() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch {
    // 非 Tauri 环境
  }
}

// ─── 缩放控制 ───
const SCALE_MIN = 0.4;
const SCALE_MAX = 1.5;
const SCALE_STEP = 0.1;
// 基准内容尺寸（1x 时）
const BASE_WIDTH = 820;
const BASE_HEIGHT = 410;

const scale = ref(1);

const scalePercent = computed(() => Math.round(scale.value * 100));

function zoomIn() {
  scale.value = Math.min(SCALE_MAX, +(scale.value + SCALE_STEP).toFixed(2));
}

function zoomOut() {
  scale.value = Math.max(SCALE_MIN, +(scale.value - SCALE_STEP).toFixed(2));
}

function resetZoom() {
  scale.value = 1;
}

function handleWheel(e: WheelEvent) {
  // Ctrl/Cmd + 滚轮 缩放
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }
}

// 缩放时动态调整 Tauri 窗口大小
async function resizeWindow(newScale: number) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const { LogicalSize } = await import("@tauri-apps/api/dpi");
    const win = getCurrentWindow();
    const w = Math.round(BASE_WIDTH * newScale) + 20; // 加点余量
    const h = Math.round(BASE_HEIGHT * newScale) + 20;
    await win.setSize(new LogicalSize(w, h));
  } catch {
    // 非 Tauri 环境
  }
}

watch(scale, (newScale) => {
  resizeWindow(newScale);
});

onMounted(async () => {
  try {
    await initTauriBridge();
    const trusted = await checkAccessibility();
    if (!trusted) {
      showAccessibilityGuide.value = true;
    }
  } catch (e) {
    console.warn("[App] Not in Tauri environment:", e);
  }
});
</script>

<template>
  <div class="floating-widget" @wheel="handleWheel" @mousedown.left="startDrag">
    <!-- 缩放容器 -->
    <div
      class="scale-wrapper"
      :style="{ transform: `scale(${scale})` }"
    >
      <DragHandle
        :scale-percent="scalePercent"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-reset="resetZoom"
      />
      <FloatingStatus />

      <div class="widget-body">
        <KeyboardFarm v-if="activeTab === 'farm'" />
        <div v-else class="panel-overlay">
          <ShopPanel v-if="activeTab === 'shop'" />
          <AnimalPanel v-else-if="activeTab === 'animal'" />
          <StatsPanel v-else-if="activeTab === 'stats'" />
        </div>
      </div>

      <FloatingTabs :active-tab="activeTab" @change="activeTab = $event" />
    </div>

    <AccessibilityGuide
      v-if="showAccessibilityGuide"
      @close="showAccessibilityGuide = false"
    />
  </div>
</template>

<style scoped>
.floating-widget {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100vw;
  height: 100vh;
  background: transparent;
  overflow: hidden;
  cursor: grab;
}

.floating-widget:active {
  cursor: grabbing;
}

.scale-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: top center;
  transition: transform 0.15s ease;
  padding: 4px;
}

.widget-body {
  position: relative;
}

.panel-overlay {
  background: rgba(18, 21, 31, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px;
  min-width: 780px;
  max-height: 370px;
  overflow-y: auto;
}
</style>
