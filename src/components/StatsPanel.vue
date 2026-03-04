<script setup lang="ts">
import { computed } from "vue";
import { gameState } from "../store/gameStore";
import { CROPS } from "../config/crops";

const sessionDuration = computed(() => {
  const ms = Date.now() - gameState.stats.sessionStartTime;
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  return `${minutes}分钟`;
});

const plantedCount = computed(() =>
  Object.values(gameState.plots).filter((p) => p.cropId !== null).length,
);

const matureCount = computed(() =>
  Object.values(gameState.plots).filter((p) => {
    if (!p.cropId) return false;
    const crop = CROPS.find((c) => c.id === p.cropId);
    return crop ? p.stage >= crop.growthStages : false;
  }).length,
);
</script>

<template>
  <div class="stats-panel">
    <h2 class="panel-title">📊 统计面板</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总按键数</div>
        <div class="stat-value">{{ gameState.stats.totalKeyPresses }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日按键</div>
        <div class="stat-value">{{ gameState.stats.todayKeyPresses }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">鼠标点击</div>
        <div class="stat-value">{{ gameState.stats.totalMouseClicks }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总金币</div>
        <div class="stat-value gold">{{ gameState.gold }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总收获</div>
        <div class="stat-value harvest">{{ gameState.totalHarvests }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">当前种植</div>
        <div class="stat-value">{{ plantedCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待收获</div>
        <div class="stat-value mature">{{ matureCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本次时长</div>
        <div class="stat-value">{{ sessionDuration }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">解锁作物</div>
        <div class="stat-value">{{ gameState.unlockedCropIds.length }} / {{ CROPS.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">解锁动物</div>
        <div class="stat-value">{{ gameState.unlockedAnimalIds.length }} / 7</div>
      </div>
    </div>

    <div class="help-section">
      <h3 class="help-title">操作指南</h3>
      <div class="help-grid">
        <div class="help-item">
          <span class="help-key">字母/数字/符号键</span>
          <span class="help-desc">播种 & 生长 & 收获</span>
        </div>
        <div class="help-item">
          <span class="help-key">Tab</span>
          <span class="help-desc">切换种子类型</span>
        </div>
        <div class="help-item">
          <span class="help-key">Enter</span>
          <span class="help-desc">一键收获全部</span>
        </div>
        <div class="help-item">
          <span class="help-key">Shift</span>
          <span class="help-desc">给最近的田施肥</span>
        </div>
        <div class="help-item">
          <span class="help-key">Space</span>
          <span class="help-desc">全部作物加速</span>
        </div>
        <div class="help-item">
          <span class="help-key">CapsLock</span>
          <span class="help-desc">全部田地浇水</span>
        </div>
        <div class="help-item">
          <span class="help-key">Backspace</span>
          <span class="help-desc">铲除最近的田</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  padding: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.9);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
}

.stat-value.gold {
  color: #ffd700;
}

.stat-value.harvest {
  color: #4ade80;
}

.stat-value.mature {
  color: #ff6b6b;
}

.help-section {
  margin-top: 8px;
}

.help-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px;
}

.help-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.help-key {
  min-width: 100px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  text-align: center;
}

.help-desc {
  color: rgba(255, 255, 255, 0.5);
}
</style>
