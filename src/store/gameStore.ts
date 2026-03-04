import { reactive } from "vue";
import { CROPS } from "../config/crops";
import { ANIMALS } from "../config/animals";
import { PLANTABLE_KEYS, MODIFIER_KEYS } from "../config/keyboardLayout";

// ─── 农田地块状态 ───
export interface PlotState {
  cropId: string | null;
  stage: number;
  hits: number;
  fertilized: boolean;
  watered: boolean;
  lastHitTime: number;
}

// ─── 完整游戏状态 ───
export interface GameState {
  plots: Record<string, PlotState>;
  gold: number;
  totalHarvests: number;
  selectedCropId: string;
  unlockedCropIds: string[];
  unlockedAnimalIds: string[];
  stats: {
    totalKeyPresses: number;
    totalMouseClicks: number;
    sessionStartTime: number;
    todayKeyPresses: number;
    todayDate: string;
  };
}

// ─── 游戏事件系统 ───
export interface GameEvent {
  type:
    | "plant"
    | "grow"
    | "mature"
    | "harvest"
    | "fertilize"
    | "water"
    | "harvest_all"
    | "remove"
    | "switch_seed"
    | "speed_boost"
    | "animal_unlock";
  keyId: string;
  data?: Record<string, unknown>;
}

type GameEventCallback = (event: GameEvent) => void;
const eventListeners: GameEventCallback[] = [];

export function onGameEvent(cb: GameEventCallback) {
  eventListeners.push(cb);
}

function emitGameEvent(event: GameEvent) {
  for (const cb of eventListeners) {
    cb(event);
  }
}

// ─── 初始化 ───
function createEmptyPlot(): PlotState {
  return {
    cropId: null,
    stage: 0,
    hits: 0,
    fertilized: false,
    watered: false,
    lastHitTime: 0,
  };
}

function createInitialState(): GameState {
  const plots: Record<string, PlotState> = {};
  const allKeyIds = [...PLANTABLE_KEYS, ...Object.keys(MODIFIER_KEYS)];
  for (const id of allKeyIds) {
    plots[id] = createEmptyPlot();
  }
  return {
    plots,
    gold: 10,
    totalHarvests: 0,
    selectedCropId: "wheat",
    unlockedCropIds: ["wheat", "carrot"],
    unlockedAnimalIds: [],
    stats: {
      totalKeyPresses: 0,
      totalMouseClicks: 0,
      sessionStartTime: Date.now(),
      todayKeyPresses: 0,
      todayDate: new Date().toISOString().slice(0, 10),
    },
  };
}

// ─── 响应式状态（全局单例）───
export const gameState = reactive<GameState>(createInitialState());

// ─── 核心：处理一次按键输入 ───
export function handleKeyInput(keyId: string) {
  const now = Date.now();

  // 更新统计
  gameState.stats.totalKeyPresses++;
  const today = new Date().toISOString().slice(0, 10);
  if (gameState.stats.todayDate !== today) {
    gameState.stats.todayDate = today;
    gameState.stats.todayKeyPresses = 0;
    // 重置浇水状态
    for (const plot of Object.values(gameState.plots)) {
      plot.watered = false;
    }
  }
  gameState.stats.todayKeyPresses++;

  // ─── 修饰键特殊功能 ───
  if (keyId in MODIFIER_KEYS) {
    handleModifierKey(keyId);
    return;
  }

  // ─── 普通键 → 种田逻辑 ───
  if (!PLANTABLE_KEYS.includes(keyId)) return;

  const plot = gameState.plots[keyId];
  if (!plot) return;

  if (!plot.cropId) {
    // ── 空地：播种 ──
    if (!gameState.unlockedCropIds.includes(gameState.selectedCropId)) return;
    plot.cropId = gameState.selectedCropId;
    plot.stage = 0;
    plot.hits = 0;
    plot.fertilized = false;
    plot.watered = false;
    plot.lastHitTime = now;
    emitGameEvent({ type: "plant", keyId });
    return;
  }

  const cropConfig = CROPS.find((c) => c.id === plot.cropId);
  if (!cropConfig) return;

  if (plot.stage < cropConfig.growthStages) {
    // ── 生长中：积累按键 ──
    let increment = 1;
    if (plot.watered) increment += 1;
    const threshold = plot.fertilized
      ? Math.ceil(cropConfig.hitsPerStage / 2)
      : cropConfig.hitsPerStage;

    plot.hits += increment;
    plot.lastHitTime = now;

    if (plot.hits >= threshold) {
      plot.stage++;
      plot.hits = 0;

      if (plot.stage >= cropConfig.growthStages) {
        emitGameEvent({ type: "mature", keyId });
      } else {
        emitGameEvent({ type: "grow", keyId, data: { stage: plot.stage } });
      }
    }
  } else {
    // ── 成熟：收获 ──
    gameState.gold += cropConfig.sellPrice;
    gameState.totalHarvests++;
    emitGameEvent({
      type: "harvest",
      keyId,
      data: { cropId: plot.cropId, gold: cropConfig.sellPrice },
    });

    // 重置地块
    plot.cropId = null;
    plot.stage = 0;
    plot.hits = 0;
    plot.fertilized = false;

    checkAnimalUnlocks();
    checkCropUnlocks();
  }
}

// ─── 修饰键逻辑 ───
function handleModifierKey(keyId: string) {
  switch (keyId) {
    case "shift_l":
    case "shift_r": {
      // 施肥：找到最近按过的一块正在生长的田
      const growingEntries = Object.entries(gameState.plots)
        .filter(([, p]) => {
          if (!p.cropId || p.fertilized) return false;
          const cfg = CROPS.find((c) => c.id === p.cropId);
          return cfg ? p.stage < cfg.growthStages : false;
        })
        .sort(([, a], [, b]) => b.lastHitTime - a.lastHitTime);
      if (growingEntries.length > 0) {
        const [targetKey, targetPlot] = growingEntries[0];
        targetPlot.fertilized = true;
        emitGameEvent({ type: "fertilize", keyId: targetKey });
      }
      break;
    }
    case "enter": {
      // 收获全部成熟作物
      let totalGold = 0;
      for (const [key, plot] of Object.entries(gameState.plots)) {
        if (!plot.cropId) continue;
        const config = CROPS.find((c) => c.id === plot.cropId);
        if (!config || plot.stage < config.growthStages) continue;
        totalGold += config.sellPrice;
        gameState.totalHarvests++;
        plot.cropId = null;
        plot.stage = 0;
        plot.hits = 0;
        plot.fertilized = false;
        emitGameEvent({ type: "harvest", keyId: key, data: { gold: config.sellPrice } });
      }
      if (totalGold > 0) {
        gameState.gold += totalGold;
        emitGameEvent({ type: "harvest_all", keyId, data: { gold: totalGold } });
        checkAnimalUnlocks();
        checkCropUnlocks();
      }
      break;
    }
    case "backspace": {
      // 铲除最近按过的田
      const recentEntries = Object.entries(gameState.plots)
        .filter(([, p]) => p.cropId !== null)
        .sort(([, a], [, b]) => b.lastHitTime - a.lastHitTime);
      if (recentEntries.length > 0) {
        const [targetKey, targetPlot] = recentEntries[0];
        targetPlot.cropId = null;
        targetPlot.stage = 0;
        targetPlot.hits = 0;
        emitGameEvent({ type: "remove", keyId: targetKey });
      }
      break;
    }
    case "tab": {
      // 循环切换种子
      const idx = gameState.unlockedCropIds.indexOf(gameState.selectedCropId);
      const nextIdx = (idx + 1) % gameState.unlockedCropIds.length;
      gameState.selectedCropId = gameState.unlockedCropIds[nextIdx];
      emitGameEvent({
        type: "switch_seed",
        keyId,
        data: { cropId: gameState.selectedCropId },
      });
      break;
    }
    case "capslock": {
      // 浇水
      for (const plot of Object.values(gameState.plots)) {
        if (plot.cropId) {
          plot.watered = true;
        }
      }
      emitGameEvent({ type: "water", keyId });
      break;
    }
    case "space": {
      // 全体加速 +1
      for (const [key, plot] of Object.entries(gameState.plots)) {
        if (!plot.cropId) continue;
        const config = CROPS.find((c) => c.id === plot.cropId);
        if (!config || plot.stage >= config.growthStages) continue;
        plot.hits++;
        const threshold = plot.fertilized
          ? Math.ceil(config.hitsPerStage / 2)
          : config.hitsPerStage;
        if (plot.hits >= threshold) {
          plot.stage++;
          plot.hits = 0;
          if (plot.stage >= config.growthStages) {
            emitGameEvent({ type: "mature", keyId: key });
          }
        }
      }
      emitGameEvent({ type: "speed_boost", keyId });
      break;
    }
  }
}

function checkAnimalUnlocks() {
  for (const animal of ANIMALS) {
    if (
      !gameState.unlockedAnimalIds.includes(animal.id) &&
      gameState.totalHarvests >= animal.unlockHarvest
    ) {
      gameState.unlockedAnimalIds.push(animal.id);
      emitGameEvent({
        type: "animal_unlock",
        keyId: "",
        data: { animalId: animal.id, message: animal.unlockMessage },
      });
    }
  }
}

function checkCropUnlocks() {
  for (const crop of CROPS) {
    if (
      !gameState.unlockedCropIds.includes(crop.id) &&
      gameState.gold >= crop.unlockCost &&
      crop.unlockCost > 0
    ) {
      gameState.unlockedCropIds.push(crop.id);
    }
  }
}

export function handleMouseClick() {
  gameState.stats.totalMouseClicks++;
}
