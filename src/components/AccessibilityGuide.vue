<script setup lang="ts">
import { openAccessibilitySettings, checkAccessibility } from "../bridge/tauriBridge";
import { ref } from "vue";

const emit = defineEmits<{
  close: [];
}>();

const checking = ref(false);

async function handleOpenSettings() {
  await openAccessibilitySettings();
}

async function handleCheck() {
  checking.value = true;
  const trusted = await checkAccessibility();
  checking.value = false;
  if (trusted) {
    emit("close");
  }
}
</script>

<template>
  <div class="overlay">
    <div class="guide-modal">
      <div class="guide-icon">🔐</div>
      <h2 class="guide-title">需要辅助功能权限</h2>
      <p class="guide-desc">
        键盘农场需要「辅助功能」权限才能监听全局键盘输入。
        请在系统设置中允许本应用的辅助功能访问。
      </p>

      <div class="guide-steps">
        <div class="step">
          <span class="step-num">1</span>
          <span>点击下方按钮打开系统设置</span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span>在列表中找到「键盘农场」并启用开关</span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span>返回此窗口点击「检查权限」</span>
        </div>
      </div>

      <div class="guide-actions">
        <button class="btn btn-primary" @click="handleOpenSettings">
          打开系统设置
        </button>
        <button class="btn btn-secondary" :disabled="checking" @click="handleCheck">
          {{ checking ? "检查中..." : "检查权限" }}
        </button>
        <button class="btn btn-ghost" @click="emit('close')">
          稍后再说
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.guide-modal {
  background: #1e2235;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  max-width: 380px;
  text-align: center;
}

.guide-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.guide-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 8px;
}

.guide-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0 0 16px;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  text-align: left;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.step-num {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.guide-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: #4ade80;
  color: #0f1419;
}

.btn-primary:hover {
  background: #22c55e;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
}

.btn-ghost:hover {
  color: rgba(255, 255, 255, 0.6);
}
</style>
