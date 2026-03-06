// ── 统计面板（右侧弹出木质公告板）──

import Phaser from "phaser";
import { CROPS } from "../config/crops";
import type { GameState } from "../systems/FarmManager";

const BOARD_W = 280;
const BOARD_H = 440;
const PAD = 18;

export class StatsScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Container;
  private statTexts: Phaser.GameObjects.Text[] = [];
  private cropEntries: Phaser.GameObjects.Container[] = [];
  private isOpen = false;
  private baseX = 0;

  constructor() {
    super({ key: "StatsScene" });
  }

  create(): void {
    this.baseX = this.scale.width;
    this.board = this.add.container(this.baseX + BOARD_W, 20);
    this.buildBoard();
  }

  toggle(gameState: GameState): void {
    this.isOpen ? this.close() : this.open(gameState);
  }

  open(gameState: GameState): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.refresh(gameState);
    this.tweens.add({
      targets: this.board,
      x: this.baseX - BOARD_W - 10,
      duration: 350,
      ease: "Back.easeOut",
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.tweens.add({
      targets: this.board,
      x: this.baseX + BOARD_W,
      duration: 250,
      ease: "Cubic.easeIn",
    });
  }

  getIsOpen(): boolean { return this.isOpen; }

  refresh(gameState: GameState): void {
    const planted = Object.keys(gameState.plots).length;

    const values = [
      String(gameState.totalKeyPresses),
      String(gameState.totalHarvests),
      `${gameState.gold}g`,
      `${gameState.totalGoldEarned}g`,
      String(planted),
      `${gameState.unlockedCropIds.length}/${CROPS.length}`,
    ];
    for (let i = 0; i < this.statTexts.length; i++) {
      this.statTexts[i].setText(values[i] ?? "");
    }

    // 作物图鉴
    for (let i = 0; i < this.cropEntries.length; i++) {
      const crop = CROPS[i];
      const isUnlocked = gameState.unlockedCropIds.includes(crop.id);
      const count = gameState.cropHarvests[crop.id] ?? 0;
      const countText = this.cropEntries[i].getData("countText") as Phaser.GameObjects.Text;
      const icon = this.cropEntries[i].getData("icon") as Phaser.GameObjects.Image | Phaser.GameObjects.Text;

      if (isUnlocked) {
        countText.setText(`x${count}`);
        countText.setColor("#E0C890");
        icon.clearTint?.();
        icon.setAlpha(1);
      } else {
        countText.setText("???");
        countText.setColor("#555");
        (icon as Phaser.GameObjects.Image).setTint?.(0x222222);
        icon.setAlpha(0.4);
      }
    }
  }

  // ══════════════════════════════════════

  private buildBoard(): void {
    this.drawBackground();
    this.drawHeader();
    this.drawStats();
    this.drawCropAlmanac();
    this.drawCloseBtn();
  }

  private drawBackground(): void {
    const g = this.add.graphics();

    // 木质公告板
    g.fillStyle(0xC4956A, 1);
    g.fillRoundedRect(0, 0, BOARD_W, BOARD_H, 10);

    // 木纹
    g.fillStyle(0xB08050, 0.25);
    for (let y = 8; y < BOARD_H; y += 14) {
      g.fillRect(6, y, BOARD_W - 12, 2);
    }

    // 边框钉子
    g.lineStyle(4, 0x6A4520, 1);
    g.strokeRoundedRect(0, 0, BOARD_W, BOARD_H, 10);

    // 四角钉子
    const nailR = 5;
    for (const [nx, ny] of [[14, 14], [BOARD_W - 14, 14], [14, BOARD_H - 14], [BOARD_W - 14, BOARD_H - 14]]) {
      g.fillStyle(0x888888, 1);
      g.fillCircle(nx, ny, nailR);
      g.fillStyle(0xAAAAAA, 0.6);
      g.fillCircle(nx - 1, ny - 1, nailR - 2);
    }

    this.board.add(g);
  }

  private drawHeader(): void {
    // 标题羊皮纸条
    const g = this.add.graphics();
    g.fillStyle(0xF5E6C8, 0.9);
    g.fillRoundedRect(PAD, 24, BOARD_W - PAD * 2, 30, 6);
    g.lineStyle(1.5, 0xAA8844, 0.6);
    g.strokeRoundedRect(PAD, 24, BOARD_W - PAD * 2, 30, 6);
    this.board.add(g);

    const title = this.add.text(BOARD_W / 2, 39, "农场统计", {
      fontSize: "15px", color: "#4A2A0A", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5, 0.5);
    this.board.add(title);
  }

  private drawStats(): void {
    const labels = [
      "⌨️ 总按键数",
      "🌾 总收获次数",
      "🪙 当前金币",
      "💰 累计金币",
      "🌱 当前种植",
      "📖 已解锁作物",
    ];

    const startY = 66;
    const rowH = 22;

    for (let i = 0; i < labels.length; i++) {
      const y = startY + i * rowH;

      // 交替底色
      if (i % 2 === 0) {
        const bg = this.add.graphics();
        bg.fillStyle(0xAA7A40, 0.15);
        bg.fillRect(PAD, y - 2, BOARD_W - PAD * 2, rowH - 2);
        this.board.add(bg);
      }

      const label = this.add.text(PAD + 4, y, labels[i], {
        fontSize: "10px", color: "#4A2A0A", fontFamily: "monospace",
      });
      this.board.add(label);

      const value = this.add.text(BOARD_W - PAD - 4, y, "0", {
        fontSize: "11px", color: "#8B6914", fontFamily: "monospace", fontStyle: "bold",
      }).setOrigin(1, 0);
      this.board.add(value);
      this.statTexts.push(value);
    }

    // 分隔线
    const sepY = startY + labels.length * rowH + 6;
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x8B6914, 0.4);
    sep.lineBetween(PAD, sepY, BOARD_W - PAD, sepY);
    this.board.add(sep);
  }

  private drawCropAlmanac(): void {
    const startY = 210;

    // 小标题
    const subTitle = this.add.text(BOARD_W / 2, startY, "作物图鉴", {
      fontSize: "11px", color: "#4A2A0A", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    this.board.add(subTitle);

    const gridTop = startY + 22;
    const cols = 4;
    const cellW = (BOARD_W - PAD * 2) / cols;
    const cellH = 52;

    for (let i = 0; i < CROPS.length; i++) {
      const crop = CROPS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = PAD + col * cellW + cellW / 2;
      const cy = gridTop + row * cellH + cellH / 2;

      const entry = this.add.container(cx, cy);

      // 种子图标
      const seedKey = `seed-${crop.id}`;
      let icon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
      if (this.textures.exists(seedKey)) {
        icon = this.add.image(0, -6, seedKey).setDisplaySize(32, 32);
      } else {
        icon = this.add.text(0, -6, crop.emoji, { fontSize: "22px" }).setOrigin(0.5, 0.5);
      }
      entry.add(icon);

      // 名称
      const name = this.add.text(0, 14, crop.name, {
        fontSize: "8px", color: "#6A4A20", fontFamily: "monospace",
      }).setOrigin(0.5, 0);
      entry.add(name);

      // 收获次数
      const countText = this.add.text(0, 24, "x0", {
        fontSize: "8px", color: "#E0C890", fontFamily: "monospace",
      }).setOrigin(0.5, 0);
      entry.add(countText);

      entry.setData("icon", icon);
      entry.setData("countText", countText);
      this.board.add(entry);
      this.cropEntries.push(entry);
    }
  }

  private drawCloseBtn(): void {
    const btn = this.add.text(BOARD_W - 16, 10, "✕", {
      fontSize: "14px", color: "#6A4520", fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5, 0.5).setInteractive({ cursor: "pointer" });
    btn.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.close();
    });
    btn.on("pointerover", () => btn.setColor("#CC4444"));
    btn.on("pointerout", () => btn.setColor("#6A4520"));
    this.board.add(btn);
  }
}
