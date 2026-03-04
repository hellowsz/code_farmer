export interface CropConfig {
  id: string;
  name: string;
  /** 每个生长阶段需要多少次按键 */
  hitsPerStage: number;
  /** 共几个生长阶段（不含空地和成熟，即种子→幼苗→成长→...→成熟） */
  growthStages: number;
  /** 售价 */
  sellPrice: number;
  /** 解锁所需金币，0 表示初始解锁 */
  unlockCost: number;
  /** 每个阶段的颜色（从种子到成熟），用于渲染 */
  stageColors: string[];
  /** 每个阶段的 emoji 图标 */
  stageEmojis: string[];
  /** 作物分类标签色 */
  accentColor: string;
}

export const CROPS: CropConfig[] = [
  {
    id: "wheat",
    name: "小麦",
    hitsPerStage: 2,
    growthStages: 3,
    sellPrice: 5,
    unlockCost: 0,
    stageColors: ["#8B7355", "#7CCD7C", "#9ACD32", "#F5DEB3"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF3E"],
    accentColor: "#F5DEB3",
  },
  {
    id: "carrot",
    name: "胡萝卜",
    hitsPerStage: 3,
    growthStages: 3,
    sellPrice: 10,
    unlockCost: 0,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#ED9121"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83E\uDD55"],
    accentColor: "#ED9121",
  },
  {
    id: "tomato",
    name: "番茄",
    hitsPerStage: 4,
    growthStages: 4,
    sellPrice: 18,
    unlockCost: 80,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#FF6B6B", "#FF6347"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF38", "\uD83C\uDF45"],
    accentColor: "#FF6347",
  },
  {
    id: "corn",
    name: "玉米",
    hitsPerStage: 5,
    growthStages: 4,
    sellPrice: 25,
    unlockCost: 200,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9ACD32", "#FFD700"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF3F", "\uD83C\uDF3D"],
    accentColor: "#FFD700",
  },
  {
    id: "eggplant",
    name: "茄子",
    hitsPerStage: 6,
    growthStages: 4,
    sellPrice: 35,
    unlockCost: 500,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9370DB", "#8B5CF6"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF38", "\uD83C\uDF46"],
    accentColor: "#8B5CF6",
  },
  {
    id: "strawberry",
    name: "草莓",
    hitsPerStage: 8,
    growthStages: 5,
    sellPrice: 50,
    unlockCost: 1000,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#FF69B4", "#FF1493", "#FF4D6A"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF38", "\uD83E\uDED0", "\uD83C\uDF53"],
    accentColor: "#FF4D6A",
  },
  {
    id: "pumpkin",
    name: "南瓜",
    hitsPerStage: 10,
    growthStages: 5,
    sellPrice: 80,
    unlockCost: 2500,
    stageColors: ["#8B7355", "#7CCD7C", "#3CB371", "#9ACD32", "#DAA520", "#FF8C00"],
    stageEmojis: ["\uD83D\uDFE4", "\uD83C\uDF31", "\uD83C\uDF3F", "\uD83C\uDF3F", "\uD83D\uDFE1", "\uD83C\uDF83"],
    accentColor: "#FF8C00",
  },
];
