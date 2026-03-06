// ── 素材 key 常量 ──

export const ASSET_KEYS = {
  BG_SKY: "bg-sky",
  BG_GRASS: "bg-grass",
  FARM_BOARD: "farm-board",
  KEY_SOIL: "key-soil",
  KEY_GRASS: "key-grass",
  KEY_MODIFIER: "key-modifier",
} as const;

/** 根据作物 id 获取 spritesheet key */
export function cropSpriteKey(cropId: string): string {
  return `crop-${cropId}`;
}
