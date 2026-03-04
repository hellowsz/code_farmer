<script setup lang="ts">
import { CROPS } from "../config/crops";
import { gameState } from "../store/gameStore";

function buyCrop(cropId: string) {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return;
  if (gameState.unlockedCropIds.includes(cropId)) return;
  if (gameState.gold < crop.unlockCost) return;

  gameState.gold -= crop.unlockCost;
  gameState.unlockedCropIds.push(cropId);
}

function selectCrop(cropId: string) {
  if (gameState.unlockedCropIds.includes(cropId)) {
    gameState.selectedCropId = cropId;
  }
}
</script>

<template>
  <div class="shop-panel">
    <h2 class="panel-title">🏪 种子商店</h2>
    <p class="panel-desc">购买并选择要种植的种子。按 Tab 键也可以快速切换种子。</p>

    <div class="crop-grid">
      <div
        v-for="crop in CROPS"
        :key="crop.id"
        class="crop-card"
        :class="{
          unlocked: gameState.unlockedCropIds.includes(crop.id),
          selected: gameState.selectedCropId === crop.id,
          affordable: !gameState.unlockedCropIds.includes(crop.id) && gameState.gold >= crop.unlockCost,
        }"
        @click="
          gameState.unlockedCropIds.includes(crop.id)
            ? selectCrop(crop.id)
            : buyCrop(crop.id)
        "
      >
        <div class="crop-emoji">
          {{ crop.stageEmojis[crop.stageEmojis.length - 1] }}
        </div>
        <div class="crop-info">
          <div class="crop-name">{{ crop.name }}</div>
          <div class="crop-stats">
            <span>售价: {{ crop.sellPrice }}💰</span>
            <span>阶段: {{ crop.growthStages }}</span>
          </div>
          <div class="crop-hits">每阶段 {{ crop.hitsPerStage }} 次按键</div>
        </div>
        <div class="crop-action">
          <span
            v-if="gameState.selectedCropId === crop.id"
            class="badge selected-badge"
          >
            已选中
          </span>
          <span
            v-else-if="gameState.unlockedCropIds.includes(crop.id)"
            class="badge unlocked-badge"
          >
            已解锁
          </span>
          <span
            v-else
            class="badge cost-badge"
            :class="{ affordable: gameState.gold >= crop.unlockCost }"
          >
            {{ crop.unlockCost }}💰
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-panel {
  padding: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  color: rgba(255, 255, 255, 0.9);
}

.panel-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 12px;
}

.crop-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.crop-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.crop-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.crop-card.selected {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
}

.crop-card.affordable:not(.unlocked) {
  border-color: rgba(255, 215, 0, 0.3);
}

.crop-emoji {
  font-size: 28px;
  flex-shrink: 0;
}

.crop-info {
  flex: 1;
}

.crop-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.crop-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.crop-hits {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 1px;
}

.badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  white-space: nowrap;
}

.selected-badge {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.unlocked-badge {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
}

.cost-badge {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
}

.cost-badge.affordable {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
}
</style>
