// ── 资源预加载 ──

import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    // 背景
    this.load.image("bg-sky", "assets/sprites/backgrounds/bg-sky.png");

    // 建筑
    this.load.image("building-barn", "assets/sprites/buildings/building-barn.png");
    this.load.image("building-clock", "assets/sprites/buildings/building-clock.png");
    this.load.image("building-tree", "assets/sprites/buildings/building-tree.png");
    this.load.image("building-mailbox", "assets/sprites/buildings/building-mailbox.png");
    this.load.image("building-signpost", "assets/sprites/buildings/building-signpost.png");
    this.load.image("building-well", "assets/sprites/buildings/building-well.png");
    this.load.image("building-windvane", "assets/sprites/buildings/building-windvane.png");
    this.load.image("building-fence", "assets/sprites/buildings/building-fence.png");
    this.load.image("shop-tent", "assets/sprites/ui/shop-tent.png");

    // 动物
    this.load.image("cat-fishing", "assets/sprites/animals/cat-fishing.png");

    // 键帽纹理
    this.load.image("key-grass", "assets/sprites/keys/key-grass.png");
    this.load.image("key-soil", "assets/sprites/keys/key-soil.png");
    this.load.image("key-modifier", "assets/sprites/keys/key-modifier.png");

    // 种子图标
    this.load.image("seed-wheat", "assets/sprites/ui/seed-wheat.png");
    this.load.image("seed-carrot", "assets/sprites/ui/seed-carrot.png");
    this.load.image("seed-tomato", "assets/sprites/ui/seed-tomato.png");
    this.load.image("seed-corn", "assets/sprites/ui/seed-corn.png");
    this.load.image("seed-pumpkin", "assets/sprites/ui/seed-pumpkin.png");
    this.load.image("seed-strawberry", "assets/sprites/ui/seed-strawberry.png");
    this.load.image("seed-eggplant", "assets/sprites/ui/seed-eggplant.png");
    this.load.image("seed-sunflower", "assets/sprites/ui/seed-sunflower.png");

    // 作物精灵表（每帧 48x48）
    this.load.spritesheet("crop-wheat", "assets/sprites/crops/crop-wheat.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-carrot", "assets/sprites/crops/crop-carrot.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-corn", "assets/sprites/crops/crop-corn.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-tomato", "assets/sprites/crops/crop-tomato.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-eggplant", "assets/sprites/crops/crop-eggplant.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-pumpkin", "assets/sprites/crops/crop-pumpkin.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-strawberry", "assets/sprites/crops/crop-strawberry.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("crop-sunflower", "assets/sprites/crops/crop-sunflower.png", { frameWidth: 48, frameHeight: 48 });
  }

  create(): void {
    this.scene.start("FarmScene");
  }
}
