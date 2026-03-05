// ── 作物配置 ──

export interface CropConfig {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;       // M2 色块阶段用 emoji 标注
  readonly pressesToGrow: number; // 每阶段需要的按键次数
  readonly harvestGold: number;
  readonly unlockGold: number;   // 解锁价格（0 = 初始可用）
  readonly color: number;        // 成熟色（M2 色块用）
}

export const CROPS: readonly CropConfig[] = [
  {
    id: "wheat",
    name: "小麦",
    emoji: "🌾",
    pressesToGrow: 1,
    harvestGold: 5,
    unlockGold: 0,
    color: 0xdaa520,
  },
  {
    id: "carrot",
    name: "胡萝卜",
    emoji: "🥕",
    pressesToGrow: 2,
    harvestGold: 12,
    unlockGold: 50,
    color: 0xff8c00,
  },
  {
    id: "tomato",
    name: "番茄",
    emoji: "🍅",
    pressesToGrow: 3,
    harvestGold: 20,
    unlockGold: 150,
    color: 0xff4444,
  },
  {
    id: "corn",
    name: "玉米",
    emoji: "🌽",
    pressesToGrow: 3,
    harvestGold: 25,
    unlockGold: 300,
    color: 0xffd700,
  },
  {
    id: "pumpkin",
    name: "南瓜",
    emoji: "🎃",
    pressesToGrow: 4,
    harvestGold: 35,
    unlockGold: 600,
    color: 0xff7518,
  },
  {
    id: "cabbage",
    name: "白菜",
    emoji: "🥬",
    pressesToGrow: 4,
    harvestGold: 40,
    unlockGold: 1000,
    color: 0x7ccd7c,
  },
  {
    id: "eggplant",
    name: "茄子",
    emoji: "🍆",
    pressesToGrow: 5,
    harvestGold: 55,
    unlockGold: 2000,
    color: 0x8b008b,
  },
  {
    id: "sunflower",
    name: "向日葵",
    emoji: "🌻",
    pressesToGrow: 6,
    harvestGold: 80,
    unlockGold: 5000,
    color: 0xffa500,
  },
] as const;

export function getCropById(id: string): CropConfig | undefined {
  return CROPS.find((c) => c.id === id);
}
