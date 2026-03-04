export interface AnimalConfig {
  id: string;
  name: string;
  emoji: string;
  /** 累计收获次数达到此值时解锁 */
  unlockHarvest: number;
  /** 解锁时的提示文案 */
  unlockMessage: string;
}

export const ANIMALS: AnimalConfig[] = [
  {
    id: "cat",
    name: "小猫",
    emoji: "\uD83D\uDC31",
    unlockHarvest: 30,
    unlockMessage: "一只小猫被麦田的香气吸引，搬来了农场！",
  },
  {
    id: "dog",
    name: "小狗",
    emoji: "\uD83D\uDC36",
    unlockHarvest: 80,
    unlockMessage: "一只忠诚的小狗主动来帮你守护农场！",
  },
  {
    id: "rabbit",
    name: "兔子",
    emoji: "\uD83D\uDC30",
    unlockHarvest: 150,
    unlockMessage: "一只蹦蹦跳跳的兔子在胡萝卜地里安了家！",
  },
  {
    id: "chicken",
    name: "小鸡",
    emoji: "\uD83D\uDC14",
    unlockHarvest: 250,
    unlockMessage: "一群小鸡来到你的玉米田觅食！",
  },
  {
    id: "hedgehog",
    name: "刺猬",
    emoji: "\uD83E\uDD94",
    unlockHarvest: 400,
    unlockMessage: "一只可爱的刺猬在草莓丛中定居了！",
  },
  {
    id: "deer",
    name: "小鹿",
    emoji: "\uD83E\uDD8C",
    unlockHarvest: 600,
    unlockMessage: "一只温柔的小鹿远远地望着你的农场，决定留下来！",
  },
  {
    id: "owl",
    name: "猫头鹰",
    emoji: "\uD83E\uDD89",
    unlockHarvest: 1000,
    unlockMessage: "一只智慧的猫头鹰在农场的大树上筑巢了！",
  },
];
