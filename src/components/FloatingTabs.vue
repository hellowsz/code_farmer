<script setup lang="ts">
defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  change: [tab: string];
}>();

const tabs = [
  { id: "farm", icon: "🌾" },
  { id: "shop", icon: "🏪" },
  { id: "animal", icon: "🐾" },
  { id: "stats", icon: "📊" },
];
</script>

<template>
  <!-- 悬浮在键盘下方的小圆形 tab 按钮 -->
  <div class="floating-tabs" @mousedown.stop>
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-dot"
      :class="{ active: activeTab === tab.id }"
      @click="emit('change', tab.id)"
    >
      {{ tab.icon }}
    </button>
  </div>
</template>

<style scoped>
.floating-tabs {
  display: flex;
  gap: 4px;
  padding: 3px 0;
  user-select: none;
}

.tab-dot {
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(18, 21, 31, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.tab-dot:hover {
  background: rgba(18, 21, 31, 0.85);
  border-color: rgba(255, 255, 255, 0.12);
  transform: scale(1.1);
}

.tab-dot.active {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.2);
}
</style>
