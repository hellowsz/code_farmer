<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { KEYBOARD_LAYOUT, MODIFIER_KEYS } from "../config/keyboardLayout";
import { CROPS } from "../config/crops";
import { gameState, onGameEvent, type GameEvent } from "../store/gameStore";

const KEY_UNIT = 52;
const KEY_GAP = 4;

// 记录当前被按下的键（用于动画）
const pressedKeys = ref<Set<string>>(new Set());
// 飘字动画队列
const floatingTexts = ref<Array<{
  id: number;
  keyId: string;
  text: string;
  color: string;
  x: number;
  y: number;
}>>([]);
let floatIdCounter = 0;

// 计算每个键的位置映射
const keyPositions = ref<Record<string, { x: number; y: number }>>({});

function calculateKeyPositions() {
  const positions: Record<string, { x: number; y: number }> = {};
  for (let rowIdx = 0; rowIdx < KEYBOARD_LAYOUT.length; rowIdx++) {
    let xOffset = 0;
    const row = KEYBOARD_LAYOUT[rowIdx];
    for (const key of row) {
      const w = key.width ?? 1;
      positions[key.id] = {
        x: xOffset + (w * KEY_UNIT + KEY_GAP) / 2,
        y: rowIdx * (KEY_UNIT + KEY_GAP) + KEY_UNIT / 2,
      };
      xOffset += w * KEY_UNIT + KEY_GAP;
    }
  }
  keyPositions.value = positions;
}

function getKeyStyle(keyId: string, width: number) {
  const isModifier = keyId in MODIFIER_KEYS;
  const plot = gameState.plots[keyId];
  const isPressed = pressedKeys.value.has(keyId);

  // 悬浮皮肤风格：半透明磨砂键帽
  let bg = "rgba(18, 21, 31, 0.55)";
  let border = "rgba(255, 255, 255, 0.08)";
  let shadow = "0 2px 8px rgba(0,0,0,0.3)";

  if (isModifier) {
    bg = "rgba(74, 222, 128, 0.12)";
    border = "rgba(74, 222, 128, 0.2)";
  } else if (plot?.cropId) {
    const crop = CROPS.find((c) => c.id === plot.cropId);
    if (crop) {
      const isMature = plot.stage >= crop.growthStages;
      if (isMature) {
        bg = `${crop.accentColor}45`;
        border = `${crop.accentColor}99`;
        shadow = `0 2px 12px ${crop.accentColor}50, 0 0 20px ${crop.accentColor}25`;
      } else {
        bg = `${crop.accentColor}20`;
        border = `${crop.accentColor}40`;
      }
    }
  }

  if (isPressed) {
    border = "#4ADE80";
    shadow = "0 0 12px rgba(74,222,128,0.5), 0 2px 8px rgba(0,0,0,0.3)";
  }

  return {
    width: `${width * KEY_UNIT}px`,
    height: `${KEY_UNIT}px`,
    background: bg,
    borderColor: border,
    boxShadow: shadow,
    transform: isPressed ? "scale(0.93)" : "scale(1)",
  };
}

function getKeyEmoji(keyId: string): string {
  const plot = gameState.plots[keyId];
  if (!plot?.cropId) return "";
  const crop = CROPS.find((c) => c.id === plot.cropId);
  if (!crop) return "";
  const stageIdx = Math.min(plot.stage, crop.stageEmojis.length - 1);
  return crop.stageEmojis[stageIdx];
}

function getProgress(keyId: string): number {
  const plot = gameState.plots[keyId];
  if (!plot?.cropId) return 0;
  const crop = CROPS.find((c) => c.id === plot.cropId);
  if (!crop) return 0;
  if (plot.stage >= crop.growthStages) return 100;
  const threshold = plot.fertilized
    ? Math.ceil(crop.hitsPerStage / 2)
    : crop.hitsPerStage;
  return Math.min(100, (plot.hits / threshold) * 100);
}

function getProgressColor(keyId: string): string {
  const plot = gameState.plots[keyId];
  if (!plot?.cropId) return "#4ade80";
  const crop = CROPS.find((c) => c.id === plot.cropId);
  return crop?.accentColor ?? "#4ade80";
}

function isMature(keyId: string): boolean {
  const plot = gameState.plots[keyId];
  if (!plot?.cropId) return false;
  const crop = CROPS.find((c) => c.id === plot.cropId);
  if (!crop) return false;
  return plot.stage >= crop.growthStages;
}

function getModifierLabel(keyId: string): string {
  return MODIFIER_KEYS[keyId] ?? "";
}

function addFloatingText(keyId: string, text: string, color: string) {
  const pos = keyPositions.value[keyId];
  if (!pos) return;
  const id = floatIdCounter++;
  floatingTexts.value.push({ id, keyId, text, color, x: pos.x, y: pos.y });
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((f) => f.id !== id);
  }, 800);
}

function handleGameEvent(event: GameEvent) {
  if (event.keyId) {
    pressedKeys.value.add(event.keyId);
    setTimeout(() => {
      pressedKeys.value.delete(event.keyId);
    }, 100);
  }

  switch (event.type) {
    case "harvest":
      if (event.data?.gold) {
        addFloatingText(event.keyId, `+${event.data.gold}💰`, "#FFD700");
      }
      break;
    case "harvest_all":
      if (event.data?.gold) {
        addFloatingText(event.keyId, `+${event.data.gold}💰`, "#FFD700");
      }
      break;
    case "plant":
      addFloatingText(event.keyId, "播种!", "#4ADE80");
      break;
    case "mature":
      addFloatingText(event.keyId, "成熟!", "#FF6B6B");
      break;
    case "fertilize":
      addFloatingText(event.keyId, "施肥!", "#FFD700");
      break;
    case "water":
      addFloatingText(event.keyId, "浇水!", "#60A5FA");
      break;
  }
}

onMounted(() => {
  calculateKeyPositions();
  onGameEvent(handleGameEvent);
});

onUnmounted(() => {
  // 单实例组件，不需要清理
});
</script>

<template>
  <div class="keyboard-farm">
    <div class="keyboard-grid">
      <div
        v-for="(row, rowIdx) in KEYBOARD_LAYOUT"
        :key="rowIdx"
        class="keyboard-row"
      >
        <div
          v-for="key in row"
          :key="key.id"
          class="key-cap"
          :class="{
            'key-modifier': key.id in MODIFIER_KEYS,
            'key-mature': isMature(key.id),
            'key-pressed': pressedKeys.has(key.id),
            'key-planted': gameState.plots[key.id]?.cropId != null,
          }"
          :style="getKeyStyle(key.id, key.width ?? 1)"
        >
          <span class="key-label">{{ key.label }}</span>

          <span v-if="key.id in MODIFIER_KEYS" class="key-function">
            {{ getModifierLabel(key.id) }}
          </span>

          <span
            v-else-if="getKeyEmoji(key.id)"
            class="key-emoji"
            :class="{ 'emoji-bounce': isMature(key.id) }"
          >
            {{ getKeyEmoji(key.id) }}
          </span>

          <span v-if="isMature(key.id)" class="mature-hint">收获!</span>

          <div class="key-indicators">
            <span v-if="gameState.plots[key.id]?.fertilized" class="indicator">💫</span>
            <span v-if="gameState.plots[key.id]?.watered" class="indicator">💧</span>
          </div>

          <div
            v-if="gameState.plots[key.id]?.cropId && !isMature(key.id) && !(key.id in MODIFIER_KEYS)"
            class="progress-bar"
          >
            <div
              class="progress-fill"
              :style="{
                width: getProgress(key.id) + '%',
                backgroundColor: getProgressColor(key.id),
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 飘字动画层 -->
    <div class="floating-layer">
      <div
        v-for="ft in floatingTexts"
        :key="ft.id"
        class="floating-text"
        :style="{
          left: ft.x + 'px',
          top: ft.y + 'px',
          color: ft.color,
        }"
      >
        {{ ft.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.keyboard-farm {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 2px;
}

.keyboard-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.keyboard-row {
  display: flex;
  gap: 3px;
}

/* 核心：半透明磨砂玻璃键帽，像悬浮皮肤 */
.key-cap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 10px;
  cursor: default;
  transition: all 0.1s ease;
  overflow: hidden;
  flex-shrink: 0;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.key-label {
  position: absolute;
  top: 3px;
  left: 5px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
  pointer-events: none;
}

.key-function {
  font-size: 10px;
  color: rgba(74, 222, 128, 0.8);
  font-weight: 600;
  pointer-events: none;
  text-shadow: 0 0 6px rgba(74, 222, 128, 0.3);
}

.key-emoji {
  font-size: 20px;
  line-height: 1;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.emoji-bounce {
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.mature-hint {
  position: absolute;
  bottom: 10px;
  font-size: 8px;
  color: #ff6b6b;
  font-weight: 700;
  animation: pulse-text 1.2s ease-in-out infinite;
  text-shadow: 0 0 4px rgba(255, 107, 107, 0.4);
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.key-mature {
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.key-indicators {
  position: absolute;
  top: 2px;
  right: 3px;
  display: flex;
  gap: 1px;
}

.indicator {
  font-size: 8px;
  pointer-events: none;
}

.progress-bar {
  position: absolute;
  bottom: 3px;
  left: 4px;
  right: 4px;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.15s ease;
}

/* 飘字动画 */
.floating-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.floating-text {
  position: absolute;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 0.8s ease-out forwards;
  pointer-events: none;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) translateX(-50%);
  }
}
</style>
