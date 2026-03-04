<script setup lang="ts">
import { ANIMALS } from "../config/animals";
import { gameState } from "../store/gameStore";
</script>

<template>
  <div class="animal-panel">
    <h2 class="panel-title">🐾 动物图鉴</h2>
    <p class="panel-desc">
      收获作物吸引动物来到农场。当前收获: {{ gameState.totalHarvests }} 次
    </p>

    <div class="animal-grid">
      <div
        v-for="animal in ANIMALS"
        :key="animal.id"
        class="animal-card"
        :class="{
          unlocked: gameState.unlockedAnimalIds.includes(animal.id),
        }"
      >
        <div class="animal-emoji">
          {{
            gameState.unlockedAnimalIds.includes(animal.id)
              ? animal.emoji
              : "❓"
          }}
        </div>
        <div class="animal-info">
          <div class="animal-name">
            {{
              gameState.unlockedAnimalIds.includes(animal.id)
                ? animal.name
                : "???"
            }}
          </div>
          <div v-if="gameState.unlockedAnimalIds.includes(animal.id)" class="animal-message">
            {{ animal.unlockMessage }}
          </div>
          <div v-else class="animal-requirement">
            需要收获 {{ animal.unlockHarvest }} 次
            <div class="animal-progress-bar">
              <div
                class="animal-progress-fill"
                :style="{
                  width: Math.min(100, (gameState.totalHarvests / animal.unlockHarvest) * 100) + '%',
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animal-panel {
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

.animal-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.animal-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.15s;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.animal-card.unlocked {
  border-color: rgba(255, 183, 77, 0.3);
  background: rgba(255, 183, 77, 0.05);
}

.animal-emoji {
  font-size: 32px;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
}

.animal-info {
  flex: 1;
}

.animal-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.animal-message {
  font-size: 11px;
  color: rgba(255, 183, 77, 0.7);
  margin-top: 2px;
}

.animal-requirement {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.animal-progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.animal-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #ffb74d);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
