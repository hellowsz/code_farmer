import Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { FarmScene } from "./scenes/FarmScene";
import { ShopScene } from "./scenes/ShopScene";
import { StatsScene } from "./scenes/StatsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 860,
  height: 500,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PreloadScene, FarmScene, ShopScene, StatsScene],
};

new Phaser.Game(config);
