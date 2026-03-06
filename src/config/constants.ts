// ── 游戏常量 ──

// 键帽尺寸（像素）
export const KEY_SIZE = 48;
export const KEY_GAP = 1;
export const KEY_RADIUS = 6;

// 键盘区域偏移
export const BOARD_OFFSET_X = 30;
export const BOARD_OFFSET_Y = 100;

// 岛屿天空区高度
export const SKY_H = 135;

// 作物生长：每次按键推进 1 阶段
export const GROWTH_STAGES = 4; // seed → sprout → grow → mature

// 金币
export const BASE_HARVEST_GOLD = 10;

// 功能键
export const FUNC_KEYS = {
  TAB: "tab",        // 切换种子
  ENTER: "enter",    // 批量收获所有成熟作物
  SHIFT_L: "shift_l", // 施肥（双倍生长）
  SHIFT_R: "shift_r",
  SPACE: "space",    // 加速（所有作物 +1 阶段）
  BACKSPACE: "backspace", // 铲除当前选中作物
} as const;

// 颜色
export const COLORS = {
  SOIL: 0x8b6914,        // 空地
  SOIL_STROKE: 0x6b4f10,
  SEED: 0x90b060,        // 种子阶段
  SPROUT: 0x60a030,      // 发芽
  GROW: 0x40a020,        // 生长中
  MATURE: 0xffd700,      // 成熟（金色）
  MATURE_GLOW: 0xffe44d,
  MODIFIER: 0x5588bb,    // 功能键
  MODIFIER_STROKE: 0x3d6a8f,
  HUD_BG: 0x2d1f0e,
  HUD_TEXT: 0xf0e6d0,
  GOLD: 0xffd700,
  TOAST: 0xffffff,
} as const;
