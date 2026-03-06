// ── 单个键帽渲染（对标指尖农场的圆角凸起方块）──

import Phaser from "phaser";
import { KEY_SIZE, KEY_GAP, GROWTH_STAGES } from "../config/constants";
import type { KeyDef } from "../config/keyboard-layout";
import type { PlotState } from "../systems/FarmManager";
import { getCropById } from "../config/crops";

// ── 颜色方案（对标指尖农场）──
const C = {
  // 草地（默认/已种植）
  GRASS: 0x6AB04C,
  GRASS_DARK: 0x4E8A34,
  GRASS_LIGHT: 0x7ECC58,
  GRASS_MATURE: 0x78CC52,
  // 土壤（已种植但未长草的早期）
  SOIL: 0xD4956A,
  SOIL_DARK: 0xB07848,
  SOIL_LIGHT: 0xE0A878,
  // 功能键
  MOD: 0xC4A878,
  MOD_DARK: 0xA08858,
  // 描边
  OUTLINE: 0x2A1A0A,
} as const;

const RADIUS = 8;

export class KeyPlot extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private cropSprite: Phaser.GameObjects.Image | null = null;
  private readonly keyDef: KeyDef;
  private readonly pw: number;
  private readonly ph: number;
  private currentCropKey = "";

  constructor(scene: Phaser.Scene, x: number, y: number, keyDef: KeyDef) {
    super(scene, x, y);
    this.keyDef = keyDef;
    this.pw = KEY_SIZE * keyDef.width + KEY_GAP * (keyDef.width - 1);
    this.ph = KEY_SIZE;

    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 键帽标签
    this.label = scene.add
      .text(this.pw / 2, this.ph / 2, keyDef.label, {
        fontSize: keyDef.width > 1.5 ? "10px" : "12px",
        color: "#2a4a1a",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#00000033",
        strokeThickness: 0,
      })
      .setOrigin(0.5);
    this.add(this.label);

    this.render(undefined);
    scene.add.existing(this);
  }

  render(plot: PlotState | undefined): void {
    this.bg.clear();

    if (this.keyDef.isModifier) {
      this.drawModKey();
      this.removeCropSprite();
      return;
    }

    if (!plot) {
      // 默认：绿色草地方块
      this.drawGrassKey(false);
      this.removeCropSprite();
      this.label.setColor("#2a5a1a");
      this.label.setY(this.ph / 2);
      this.label.setAlpha(0.6);
      return;
    }

    const isMature = plot.stage >= GROWTH_STAGES - 1;

    if (plot.stage === 0) {
      // 刚种植：土壤
      this.drawSoilKey();
    } else {
      // 生长中/成熟：草地
      this.drawGrassKey(isMature);
    }

    // 作物精灵
    const cropTexKey = `crop-${plot.cropId}`;
    const frame = Math.min(plot.stage, GROWTH_STAGES - 1);

    if (this.currentCropKey !== cropTexKey) {
      this.removeCropSprite();
      if (this.scene.textures.exists(cropTexKey)) {
        this.cropSprite = this.scene.add.image(this.pw / 2, this.ph / 2 - 2, cropTexKey, frame);
        this.cropSprite.setDisplaySize(this.pw * 0.65, this.ph * 0.65);
        this.add(this.cropSprite);
        this.bringToTop(this.label);
      }
      this.currentCropKey = cropTexKey;
    } else if (this.cropSprite) {
      this.cropSprite.setFrame(frame);
    }

    this.label.setColor(isMature ? "#fff8dc" : "#2a4a1a");
    this.label.setY(this.ph - 9);
    this.label.setAlpha(1);
  }

  playPressAnim(): void {
    this.scene.tweens.add({
      targets: this, y: this.y + 2, scaleX: 0.96, scaleY: 0.96,
      duration: 40, yoyo: true, ease: "Quad.easeOut",
    });
  }

  playMatureAnim(): void {
    this.scene.tweens.add({
      targets: this, scaleX: 1.08, scaleY: 1.08,
      duration: 200, yoyo: true, ease: "Sine.easeInOut", repeat: 1,
    });
  }

  getPixelWidth(): number { return this.pw; }

  // ── 绿色草地方块（紧凑圆角凸起）──
  private drawGrassKey(isMature: boolean): void {
    const { pw, ph, bg } = this;
    const r = RADIUS;
    const mainColor = isMature ? C.GRASS_MATURE : C.GRASS;
    const darkColor = isMature ? 0x5AAA38 : C.GRASS_DARK;

    // 底部阴影（3D 凸起效果）
    bg.fillStyle(darkColor, 1);
    bg.fillRoundedRect(0, 3, pw, ph - 1, r);

    // 主体
    bg.fillStyle(mainColor, 1);
    bg.fillRoundedRect(0, 0, pw, ph - 4, r);

    // 顶部高光条
    bg.fillStyle(C.GRASS_LIGHT, 0.4);
    bg.fillRoundedRect(3, 2, pw - 6, 8, { tl: r, tr: r, bl: 0, br: 0 });

    // 草丛纹理
    bg.lineStyle(1.5, C.GRASS_DARK, 0.3);
    for (let x = 6; x < pw - 6; x += 7) {
      bg.lineBetween(x, 5, x - 1, 2);
      bg.lineBetween(x, 5, x + 1, 2);
    }

    // 成熟金色光晕
    if (isMature) {
      bg.fillStyle(0xFFD700, 0.15);
      bg.fillRoundedRect(2, 2, pw - 4, ph - 6, r);
    }

    // 粗描边
    bg.lineStyle(2, C.OUTLINE, 0.9);
    bg.strokeRoundedRect(0, 0, pw, ph - 2, r);
  }

  // ── 土壤方块（刚种植的状态）──
  private drawSoilKey(): void {
    const { pw, ph, bg } = this;
    const r = RADIUS;

    bg.fillStyle(C.SOIL_DARK, 1);
    bg.fillRoundedRect(0, 3, pw, ph - 1, r);

    bg.fillStyle(C.SOIL, 1);
    bg.fillRoundedRect(0, 0, pw, ph - 4, r);

    bg.fillStyle(C.SOIL_LIGHT, 0.3);
    bg.fillRoundedRect(3, 2, pw - 6, 8, { tl: r, tr: r, bl: 0, br: 0 });

    // 种子装饰
    bg.fillStyle(0xE8D0A0, 0.5);
    bg.fillEllipse(pw * 0.35, ph * 0.4, 5, 3);
    bg.fillEllipse(pw * 0.65, ph * 0.35, 4, 3);

    bg.lineStyle(2, C.OUTLINE, 0.9);
    bg.strokeRoundedRect(0, 0, pw, ph - 2, r);
  }

  // ── 功能键（Tab/Shift/Ctrl 等）──
  private drawModKey(): void {
    const { pw, ph, bg } = this;
    const r = RADIUS;

    bg.fillStyle(C.MOD_DARK, 1);
    bg.fillRoundedRect(0, 3, pw, ph - 1, r);

    bg.fillStyle(C.MOD, 1);
    bg.fillRoundedRect(0, 0, pw, ph - 4, r);

    // 木纹纹理
    bg.lineStyle(0.8, C.MOD_DARK, 0.2);
    for (let y = 6; y < ph - 8; y += 5) {
      bg.lineBetween(4, y, pw - 4, y);
    }

    bg.lineStyle(2, C.OUTLINE, 0.9);
    bg.strokeRoundedRect(0, 0, pw, ph - 2, r);

    this.label.setColor("#3a2a1a");
    this.label.setY(this.ph / 2);
    this.label.setAlpha(1);
  }

  private removeCropSprite(): void {
    if (this.cropSprite) {
      this.cropSprite.destroy();
      this.cropSprite = null;
      this.currentCropKey = "";
    }
  }
}
