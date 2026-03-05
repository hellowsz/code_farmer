// ── 顶部状态栏 ──

import Phaser from "phaser";
import type { GameState } from "../systems/FarmManager";
import { getSelectedCrop } from "../systems/FarmManager";
import { COLORS } from "../config/constants";

export class HUD extends Phaser.GameObjects.Container {
  private goldText: Phaser.GameObjects.Text;
  private harvestText: Phaser.GameObjects.Text;
  private keyText: Phaser.GameObjects.Text;
  private seedText: Phaser.GameObjects.Text;
  private bgRect: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, width: number) {
    super(scene, 0, 0);

    this.bgRect = scene.add.graphics();
    this.bgRect.fillStyle(COLORS.HUD_BG, 0.85);
    this.bgRect.fillRoundedRect(8, 4, width - 16, 32, 8);
    this.add(this.bgRect);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "13px",
      color: "#f0e6d0",
      fontFamily: "monospace",
    };

    const y = 12;
    this.goldText = scene.add.text(20, y, "", style).setOrigin(0, 0);
    this.harvestText = scene.add.text(180, y, "", style).setOrigin(0, 0);
    this.keyText = scene.add.text(360, y, "", style).setOrigin(0, 0);
    this.seedText = scene.add.text(540, y, "", style).setOrigin(0, 0);

    this.add([this.goldText, this.harvestText, this.keyText, this.seedText]);
    scene.add.existing(this);
  }

  update(state: GameState): void {
    const crop = getSelectedCrop(state);
    this.goldText.setText(`金币: ${state.gold}`);
    this.harvestText.setText(`收获: ${state.totalHarvests}`);
    this.keyText.setText(`按键: ${state.totalKeyPresses}`);
    this.seedText.setText(`种子: ${crop.emoji} ${crop.name}`);
  }
}
