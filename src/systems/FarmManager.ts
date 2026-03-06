// ── 农场核心逻辑（纯函数 + 不可变状态）──

import { CROPS, getCropById, type CropConfig } from "../config/crops";
import { FUNC_KEYS, GROWTH_STAGES } from "../config/constants";
import { findKeyDef } from "../config/keyboard-layout";

// ── 状态类型 ──

export interface PlotState {
  readonly cropId: string;
  readonly stage: number;       // 0=seed, 1=sprout, 2=grow, 3=mature
  readonly presses: number;     // 当前阶段已积累的按键数
}

export interface GameState {
  readonly plots: Readonly<Record<string, PlotState>>; // key_id → plot
  readonly gold: number;
  readonly totalHarvests: number;
  readonly totalKeyPresses: number;
  readonly totalGoldEarned: number;
  readonly cropHarvests: Readonly<Record<string, number>>; // cropId → 收获次数
  readonly selectedSeedIndex: number;  // 当前选中的种子在已解锁列表中的索引
  readonly unlockedCropIds: readonly string[];
}

export interface GameEvent {
  readonly type: "plant" | "grow" | "mature" | "harvest" | "switch_seed" | "fertilize" | "speed_up" | "remove";
  readonly keyId?: string;
  readonly cropId?: string;
  readonly gold?: number;
  readonly seedName?: string;
}

export interface UpdateResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

// ── 初始状态 ──

export function createInitialState(): GameState {
  return {
    plots: {},
    gold: 0,
    totalHarvests: 0,
    totalKeyPresses: 0,
    totalGoldEarned: 0,
    cropHarvests: {},
    selectedSeedIndex: 0,
    unlockedCropIds: [CROPS[0].id],
  };
}

// ── 获取当前选中的种子 ──

export function getSelectedCrop(state: GameState): CropConfig {
  const id = state.unlockedCropIds[state.selectedSeedIndex];
  return getCropById(id) ?? CROPS[0];
}

// ── 核心更新：处理一次按键 ──

export function handleKeyPress(state: GameState, keyId: string): UpdateResult {
  const events: GameEvent[] = [];
  let newState = {
    ...state,
    totalKeyPresses: state.totalKeyPresses + 1,
  };

  // 功能键处理
  if (keyId === FUNC_KEYS.TAB) {
    return handleSwitchSeed(newState);
  }
  if (keyId === FUNC_KEYS.ENTER) {
    return handleHarvestAll(newState);
  }
  if (keyId === FUNC_KEYS.SHIFT_L || keyId === FUNC_KEYS.SHIFT_R) {
    return handleFertilize(newState);
  }
  if (keyId === FUNC_KEYS.SPACE) {
    return handleSpeedUp(newState);
  }
  if (keyId === FUNC_KEYS.BACKSPACE) {
    return handleRemoveLast(newState);
  }

  // 检查是否为可种植键
  const keyDef = findKeyDef(keyId);
  if (!keyDef || keyDef.isModifier) {
    return { state: newState, events };
  }

  const plot = state.plots[keyId];

  if (!plot) {
    // 空地 → 播种
    const crop = getSelectedCrop(newState);
    const newPlot: PlotState = { cropId: crop.id, stage: 0, presses: 0 };
    newState = {
      ...newState,
      plots: { ...newState.plots, [keyId]: newPlot },
    };
    events.push({ type: "plant", keyId, cropId: crop.id });
  } else if (plot.stage < GROWTH_STAGES - 1) {
    // 生长中 → 推进
    const result = advancePlot(plot);
    newState = {
      ...newState,
      plots: { ...newState.plots, [keyId]: result.plot },
    };
    if (result.grewStage) {
      const eventType = result.plot.stage >= GROWTH_STAGES - 1 ? "mature" : "grow";
      events.push({ type: eventType, keyId, cropId: plot.cropId });
    }
  } else {
    // 成熟 → 收获
    const crop = getCropById(plot.cropId);
    const gold = crop?.harvestGold ?? 0;
    const newPlots = { ...newState.plots };
    delete (newPlots as Record<string, PlotState>)[keyId];
    newState = {
      ...newState,
      plots: newPlots,
      gold: newState.gold + gold,
      totalHarvests: newState.totalHarvests + 1,
      totalGoldEarned: newState.totalGoldEarned + gold,
      cropHarvests: {
        ...newState.cropHarvests,
        [plot.cropId]: (newState.cropHarvests[plot.cropId] ?? 0) + 1,
      },
    };
    events.push({ type: "harvest", keyId, cropId: plot.cropId, gold });
  }

  return { state: newState, events };
}

// ── 内部辅助 ──

function advancePlot(plot: PlotState): { plot: PlotState; grewStage: boolean } {
  const crop = getCropById(plot.cropId);
  const pressesNeeded = crop?.pressesToGrow ?? 1;
  const newPresses = plot.presses + 1;

  if (newPresses >= pressesNeeded) {
    return {
      plot: { ...plot, stage: plot.stage + 1, presses: 0 },
      grewStage: true,
    };
  }
  return {
    plot: { ...plot, presses: newPresses },
    grewStage: false,
  };
}

// ── 功能键处理 ──

function handleSwitchSeed(state: GameState): UpdateResult {
  const nextIndex = (state.selectedSeedIndex + 1) % state.unlockedCropIds.length;
  const newState = { ...state, selectedSeedIndex: nextIndex };
  const crop = getSelectedCrop(newState);
  return {
    state: newState,
    events: [{ type: "switch_seed", seedName: crop.name }],
  };
}

function handleHarvestAll(state: GameState): UpdateResult {
  const events: GameEvent[] = [];
  let goldEarned = 0;
  let harvested = 0;
  const newPlots = { ...state.plots } as Record<string, PlotState>;

  for (const [keyId, plot] of Object.entries(state.plots)) {
    if (plot.stage >= GROWTH_STAGES - 1) {
      const crop = getCropById(plot.cropId);
      const gold = crop?.harvestGold ?? 0;
      goldEarned += gold;
      harvested++;
      delete newPlots[keyId];
      events.push({ type: "harvest", keyId, cropId: plot.cropId, gold });
    }
  }

  // 统计每种作物收获次数
  let newCropHarvests = { ...state.cropHarvests };
  for (const ev of events) {
    if (ev.cropId) {
      newCropHarvests = { ...newCropHarvests, [ev.cropId]: (newCropHarvests[ev.cropId] ?? 0) + 1 };
    }
  }

  return {
    state: {
      ...state,
      plots: newPlots,
      gold: state.gold + goldEarned,
      totalHarvests: state.totalHarvests + harvested,
      totalGoldEarned: state.totalGoldEarned + goldEarned,
      cropHarvests: newCropHarvests,
    },
    events,
  };
}

function handleFertilize(state: GameState): UpdateResult {
  const events: GameEvent[] = [];
  const newPlots: Record<string, PlotState> = {};

  for (const [keyId, plot] of Object.entries(state.plots)) {
    if (plot.stage < GROWTH_STAGES - 1) {
      // 施肥：所有生长中的作物额外推进一次
      const result = advancePlot(plot);
      newPlots[keyId] = result.plot;
      if (result.grewStage) {
        events.push({ type: "fertilize", keyId, cropId: plot.cropId });
      }
    } else {
      newPlots[keyId] = plot;
    }
  }

  return {
    state: { ...state, plots: newPlots },
    events: events.length > 0 ? events : [{ type: "fertilize" }],
  };
}

function handleSpeedUp(state: GameState): UpdateResult {
  const events: GameEvent[] = [];
  const newPlots: Record<string, PlotState> = {};

  for (const [keyId, plot] of Object.entries(state.plots)) {
    if (plot.stage < GROWTH_STAGES - 1) {
      // 加速：直接推进一个阶段
      const newStage = Math.min(plot.stage + 1, GROWTH_STAGES - 1);
      newPlots[keyId] = { ...plot, stage: newStage, presses: 0 };
      const eventType = newStage >= GROWTH_STAGES - 1 ? "mature" : "grow";
      events.push({ type: eventType, keyId, cropId: plot.cropId });
    } else {
      newPlots[keyId] = plot;
    }
  }

  return {
    state: { ...state, plots: newPlots },
    events: events.length > 0 ? events : [{ type: "speed_up" }],
  };
}

function handleRemoveLast(state: GameState): UpdateResult {
  // 移除最后播种的作物
  const keys = Object.keys(state.plots);
  if (keys.length === 0) {
    return { state, events: [] };
  }
  const lastKey = keys[keys.length - 1];
  const newPlots = { ...state.plots };
  delete (newPlots as Record<string, PlotState>)[lastKey];
  return {
    state: { ...state, plots: newPlots },
    events: [{ type: "remove", keyId: lastKey }],
  };
}

// ── 直接选中某个种子 ──

export function selectSeed(state: GameState, cropId: string): GameState {
  const idx = state.unlockedCropIds.indexOf(cropId);
  if (idx < 0) return state;
  return { ...state, selectedSeedIndex: idx };
}

// ── 批量播种（所有空键种当前种子）──

export function bulkPlant(state: GameState, allKeyIds: readonly string[]): UpdateResult {
  const crop = getSelectedCrop(state);
  const events: GameEvent[] = [];
  let newPlots = { ...state.plots };

  for (const keyId of allKeyIds) {
    if (!newPlots[keyId]) {
      newPlots = { ...newPlots, [keyId]: { cropId: crop.id, stage: 0, presses: 0 } };
      events.push({ type: "plant", keyId, cropId: crop.id });
    }
  }

  return { state: { ...state, plots: newPlots }, events };
}

// ── 解锁作物 ──

export function tryUnlockNextCrop(state: GameState): UpdateResult {
  const nextCropIndex = state.unlockedCropIds.length;
  if (nextCropIndex >= CROPS.length) {
    return { state, events: [] };
  }
  const nextCrop = CROPS[nextCropIndex];
  if (state.gold >= nextCrop.unlockGold) {
    return {
      state: {
        ...state,
        gold: state.gold - nextCrop.unlockGold,
        unlockedCropIds: [...state.unlockedCropIds, nextCrop.id],
      },
      events: [],
    };
  }
  return { state, events: [] };
}
