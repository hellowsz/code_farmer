// ── 单个键帽的色块渲染 ──

import Phaser from "phaser";
import { KEY_SIZE, KEY_GAP, KEY_RADIUS, COLORS, GROWTH_STAGES } from "../config/constants";
import type { KeyDef } from "../config/keyboard-layout";
import type { PlotState } from "../systems/FarmManager";
import { getCropById } from "../config/crops";

export class KeyPlot extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private stageText: Phaser.GameObjects.Text;
  private keyDef: KeyDef;
  private pixelWidth: number;
  private pixelHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, keyDef: KeyDef) {
    super(scene, x, y);
    this.keyDef = keyDef;
    this.pixelWidth = KEY_SIZE * keyDef.width + KEY_GAP * (keyDef.width - 1);
    this.pixelHeight = KEY_SIZE;

    this.bg = scene.add.graphics();
    this.add(this.bg);

    this.label = scene.add
      .text(this.pixelWidth / 2, this.pixelHeight / 2 - 6, keyDef.label, {
        fontSize: keyDef.width > 1.5 ? "11px" : "13px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.stageText = scene.add
      .text(this.pixelWidth / 2, this.pixelHeight / 2 + 10, "", {
        fontSize: "10px",
        color: "#ffffffaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);
    this.add(this.stageText);

    this.render(undefined);
    scene.add.existing(this);
  }

  render(plot: PlotState | undefined): void {
    this.bg.clear();

    if (this.keyDef.isModifier) {
      this.drawRect(COLORS.MODIFIER, COLORS.MODIFIER_STROKE);
      this.stageText.setText("");
      return;
    }

    if (!plot) {
      // 空地
      this.drawRect(COLORS.SOIL, COLORS.SOIL_STROKE);
      this.stageText.setText("");
      return;
    }

    const crop = getCropById(plot.cropId);
    const stageColors = [COLORS.SEED, COLORS.SPROUT, COLORS.GROW, COLORS.MATURE];
    const color = plot.stage >= GROWTH_STAGES - 1
      ? (crop?.color ?? COLORS.MATURE)
      : stageColors[plot.stage] ?? COLORS.SEED;

    this.drawRect(color, darken(color));

    // 阶段指示
    const stageNames = ["·", "♠", "♣", crop?.emoji ?? "★"];
    this.stageText.setText(stageNames[plot.stage] ?? "");

    // 成熟呼吸发光
    if (plot.stage >= GROWTH_STAGES - 1) {
      this.label.setColor("#fff8dc");
    } else {
      this.label.setColor("#ffffff");
    }
  }

  /** 按键缩放动画 */
  playPressAnim(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 60,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  /** 成熟闪烁动画 */
  playMatureAnim(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 200,
      yoyo: true,
      ease: "Sine.easeInOut",
      repeat: 1,
    });
  }

  getPixelWidth(): number {
    return this.pixelWidth;
  }

  private drawRect(fill: number, stroke: number): void {
    this.bg.fillStyle(fill, 1);
    this.bg.fillRoundedRect(0, 0, this.pixelWidth, this.pixelHeight, KEY_RADIUS);
    this.bg.lineStyle(1.5, stroke, 0.8);
    this.bg.strokeRoundedRect(0, 0, this.pixelWidth, this.pixelHeight, KEY_RADIUS);
  }
}

function darken(color: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - 40);
  const g = Math.max(0, ((color >> 8) & 0xff) - 40);
  const b = Math.max(0, (color & 0xff) - 40);
  return (r << 16) | (g << 8) | b;
}
