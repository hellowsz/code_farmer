<script setup lang="ts">
import { computed } from "vue";
import { gameState } from "../store/gameStore";
import { CROPS } from "../config/crops";

const selectedCrop = computed(() =>
  CROPS.find((c) => c.id === gameState.selectedCropId),
);
</script>

<template>
  <!-- 悬浮在键盘上方的半透明状态条 -->
  <div class="floating-status">
    <div class="status-chip gold">
      <span>💰</span>
      <span class="chip-value">{{ gameState.gold }}</span>
    </div>
    <div class="status-chip harvest">
      <span>🌾</span>
      <span class="chip-value">{{ gameState.totalHarvests }}</span>
    </div>
    <div class="status-chip keys">
      <span>⌨️</span>
      <span class="chip-value">{{ gameState.stats.todayKeyPresses }}</span>
    </div>
    <div class="status-chip seed" v-if="selectedCrop">
      <span>{{ selectedCrop.stageEmojis[selectedCrop.stageEmojis.length - 1] }}</span>
      <span class="chip-value">{{ selectedCrop.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.floating-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  user-select: none;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: rgba(18, 21, 31, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  font-size: 11px;
}

.chip-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.85);
}

.gold .chip-value {
  color: #ffd700;
}

.harvest .chip-value {
  color: #4ade80;
}
</style>
