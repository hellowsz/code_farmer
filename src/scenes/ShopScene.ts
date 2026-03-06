// ── 种子商店（场景化木质货架）──

import Phaser from "phaser";
import { CROPS, type CropConfig } from "../config/crops";
import type { GameState } from "../systems/FarmManager";

// ── 布局常量 ──
const STALL_W = 300;
const STALL_H = 460;
const CANOPY_H = 50;
const SHELF_COLS = 4;
const SHELF_ROWS = 2;
const ITEMS_PER_PAGE = SHELF_COLS * SHELF_ROWS;
const BAG_W = 56;
const BAG_H = 56;
const BAG_GAP_X = 10;
const BAG_GAP_Y = 14;
const SHELF_Y_START = CANOPY_H + 40;
const SHELF_ROW_H = BAG_H + BAG_GAP_Y + 22; // bag + label + shelf plank
const SHELF_PAD_X = 18;
const FOOTER_H = 54;

export class ShopScene extends Phaser.Scene {
  private stall!: Phaser.GameObjects.Container;
  private bagSlots: Phaser.GameObjects.Container[] = [];
  private pageText!: Phaser.GameObjects.Text;
  private isOpen = false;
  private selectedCropId = "";
  private currentPage = 0;
  private totalPages = 1;
  private cachedState: GameState | null = null;

  constructor() {
    super({ key: "ShopScene" });
  }

  create(): void {
    this.totalPages = Math.ceil(CROPS.length / ITEMS_PER_PAGE);
    this.stall = this.add.container(-STALL_W - 20, 20);
    this.buildStall();
  }

  toggle(gameState: GameState): void {
    this.isOpen ? this.close() : this.open(gameState);
  }

  open(gameState: GameState): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.cachedState = gameState;
    this.selectedCropId = gameState.unlockedCropIds[gameState.selectedSeedIndex];
    this.refreshPage();
    this.tweens.add({
      targets: this.stall,
      x: 8,
      duration: 350,
      ease: "Back.easeOut",
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.tweens.add({
      targets: this.stall,
      x: -STALL_W - 20,
      duration: 250,
      ease: "Cubic.easeIn",
    });
  }

  getIsOpen(): boolean { return this.isOpen; }
  getSelectedCropId(): string { return this.selectedCropId; }

  refreshGrid(gameState: GameState): void {
    this.cachedState = gameState;
    this.selectedCropId = gameState.unlockedCropIds[gameState.selectedSeedIndex];
    this.refreshPage();
  }

  // ══════════════════════════════════════
  //  搭建货架
  // ══════════════════════════════════════

  private buildStall(): void {
    this.drawFrame();
    this.drawCanopy();
    this.drawShelves();
    this.createBagSlots();
    this.drawFooter();
  }

  // ── 主框架（木质背景）──
  private drawFrame(): void {
    const g = this.add.graphics();

    // 整体木质底板
    g.fillStyle(0xC4956A, 1);
    g.fillRoundedRect(0, CANOPY_H - 8, STALL_W, STALL_H - CANOPY_H + 8, { tl: 0, tr: 0, bl: 10, br: 10 });

    // 木纹层
    g.fillStyle(0xB08050, 0.3);
    for (let y = CANOPY_H; y < STALL_H; y += 12) {
      g.fillRect(4, y, STALL_W - 8, 2);
    }

    // 深色边框
    g.lineStyle(4, 0x6A4520, 1);
    g.strokeRoundedRect(0, CANOPY_H - 8, STALL_W, STALL_H - CANOPY_H + 8, { tl: 0, tr: 0, bl: 10, br: 10 });

    // 左右木柱
    g.fillStyle(0x8B6914, 1);
    g.fillRect(0, CANOPY_H - 8, 10, STALL_H - CANOPY_H + 8);
    g.fillRect(STALL_W - 10, CANOPY_H - 8, 10, STALL_H - CANOPY_H + 8);

    // 柱子高光
    g.fillStyle(0xAA8844, 0.4);
    g.fillRect(2, CANOPY_H, 3, STALL_H - CANOPY_H);
    g.fillRect(STALL_W - 8, CANOPY_H, 3, STALL_H - CANOPY_H);

    this.stall.add(g);
  }

  // ── 红白条纹顶棚 ──
  private drawCanopy(): void {
    const g = this.add.graphics();
    const stripeW = 24;
    const overhang = 15;

    // 顶棚形状（略微波浪形）
    for (let i = 0; i < Math.ceil((STALL_W + overhang * 2) / stripeW); i++) {
      const sx = -overhang + i * stripeW;
      const color = i % 2 === 0 ? 0xDD4444 : 0xFFFFFF;
      g.fillStyle(color, 0.95);
      g.beginPath();
      g.moveTo(sx, CANOPY_H);
      g.lineTo(sx + 4, 6);
      g.lineTo(sx + stripeW + 4, 6);
      g.lineTo(sx + stripeW, CANOPY_H);
      g.closePath();
      g.fillPath();
    }

    // 顶棚波浪下沿
    g.fillStyle(0xCC3333, 0.8);
    for (let x = -overhang; x < STALL_W + overhang; x += 20) {
      g.fillEllipse(x + 10, CANOPY_H + 4, 22, 10);
    }

    // 顶棚描边
    g.lineStyle(3, 0x8B2222, 0.8);
    g.beginPath();
    g.moveTo(-overhang, CANOPY_H + 2);
    for (let x = -overhang; x <= STALL_W + overhang; x += 20) {
      g.lineTo(x + 10, CANOPY_H + 7);
      g.lineTo(x + 20, CANOPY_H + 2);
    }
    g.strokePath();

    // 顶棚顶部横杆
    g.fillStyle(0x8B6914, 1);
    g.fillRect(-overhang, 2, STALL_W + overhang * 2, 8);
    g.lineStyle(2, 0x5A4010, 1);
    g.strokeRect(-overhang, 2, STALL_W + overhang * 2, 8);

    // 标题
    this.stall.add(g);

    const title = this.add.text(STALL_W / 2, CANOPY_H + 18, "种子商店", {
      fontSize: "15px", color: "#4A2A0A", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#E0C890", strokeThickness: 3,
    }).setOrigin(0.5, 0.5);
    this.stall.add(title);
  }

  // ── 木质搁板 ──
  private drawShelves(): void {
    const g = this.add.graphics();

    for (let row = 0; row < SHELF_ROWS; row++) {
      const shelfY = SHELF_Y_START + row * SHELF_ROW_H + BAG_H + 8;

      // 搁板主体
      g.fillStyle(0x9A7030, 1);
      g.fillRect(8, shelfY, STALL_W - 16, 10);

      // 搁板高光
      g.fillStyle(0xBB9040, 0.6);
      g.fillRect(8, shelfY, STALL_W - 16, 3);

      // 搁板阴影
      g.fillStyle(0x6A4A18, 0.5);
      g.fillRect(8, shelfY + 10, STALL_W - 16, 4);

      // 搁板支撑
      g.fillStyle(0x8B6914, 1);
      g.fillRect(18, shelfY + 4, 6, 14);
      g.fillRect(STALL_W - 24, shelfY + 4, 6, 14);
    }

    this.stall.add(g);
  }

  // ── 种子袋位（可替换内容）──
  private createBagSlots(): void {
    for (let row = 0; row < SHELF_ROWS; row++) {
      for (let col = 0; col < SHELF_COLS; col++) {
        const x = SHELF_PAD_X + col * (BAG_W + BAG_GAP_X) + BAG_W / 2;
        const y = SHELF_Y_START + row * SHELF_ROW_H + BAG_H / 2;
        const slot = this.add.container(x, y);
        this.stall.add(slot);
        this.bagSlots.push(slot);
      }
    }
  }

  // ── 底部（翻页 + 说明）──
  private drawFooter(): void {
    const footerY = STALL_H - FOOTER_H;

    // 底座木板
    const g = this.add.graphics();
    g.fillStyle(0x8B6914, 1);
    g.fillRoundedRect(4, footerY, STALL_W - 8, FOOTER_H - 4, { tl: 0, tr: 0, bl: 10, br: 10 });
    g.fillStyle(0xAA8844, 0.3);
    g.fillRect(8, footerY + 2, STALL_W - 16, 3);
    this.stall.add(g);

    // 左箭头
    const leftBtn = this.add.text(30, footerY + 16, "◀", {
      fontSize: "20px", color: "#E0C890", fontFamily: "monospace",
    }).setOrigin(0.5, 0.5).setInteractive({ cursor: "pointer" });
    leftBtn.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.prevPage();
    });
    leftBtn.on("pointerover", () => leftBtn.setColor("#FFD700"));
    leftBtn.on("pointerout", () => leftBtn.setColor("#E0C890"));
    this.stall.add(leftBtn);

    // 页码
    this.pageText = this.add.text(STALL_W / 2, footerY + 16, "1/1", {
      fontSize: "12px", color: "#E0C890", fontFamily: "monospace",
    }).setOrigin(0.5, 0.5);
    this.stall.add(this.pageText);

    // 右箭头
    const rightBtn = this.add.text(STALL_W - 30, footerY + 16, "▶", {
      fontSize: "20px", color: "#E0C890", fontFamily: "monospace",
    }).setOrigin(0.5, 0.5).setInteractive({ cursor: "pointer" });
    rightBtn.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.nextPage();
    });
    rightBtn.on("pointerover", () => rightBtn.setColor("#FFD700"));
    rightBtn.on("pointerout", () => rightBtn.setColor("#E0C890"));
    this.stall.add(rightBtn);

    // 操作说明
    const hint = this.add.text(STALL_W / 2, footerY + 36, "点击种子袋选择 | Tab键快速切换", {
      fontSize: "8px", color: "#AA9060", fontFamily: "monospace",
    }).setOrigin(0.5, 0.5);
    this.stall.add(hint);

    // 关闭按钮
    const closeBtn = this.add.text(STALL_W - 16, CANOPY_H + 18, "✕", {
      fontSize: "14px", color: "#8B6914", fontFamily: "monospace", fontStyle: "bold",
      stroke: "#E0C890", strokeThickness: 1,
    }).setOrigin(0.5, 0.5).setInteractive({ cursor: "pointer" });
    closeBtn.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.close();
    });
    closeBtn.on("pointerover", () => closeBtn.setColor("#CC4444"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#8B6914"));
    this.stall.add(closeBtn);
  }

  // ══════════════════════════════════════
  //  翻页
  // ══════════════════════════════════════

  private prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.refreshPage();
    }
  }

  private nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.refreshPage();
    }
  }

  // ══════════════════════════════════════
  //  刷新当前页
  // ══════════════════════════════════════

  private refreshPage(): void {
    const startIdx = this.currentPage * ITEMS_PER_PAGE;
    this.pageText?.setText(`${this.currentPage + 1}/${this.totalPages}`);

    for (let i = 0; i < this.bagSlots.length; i++) {
      const slot = this.bagSlots[i];
      slot.removeAll(true);

      const cropIdx = startIdx + i;
      if (cropIdx >= CROPS.length) continue;

      const crop = CROPS[cropIdx];
      this.fillBagSlot(slot, crop);
    }
  }

  private fillBagSlot(slot: Phaser.GameObjects.Container, crop: CropConfig): void {
    const state = this.cachedState;
    const isUnlocked = state ? state.unlockedCropIds.includes(crop.id) : false;
    const isSelected = crop.id === this.selectedCropId;

    // 选中高光背景
    if (isSelected) {
      const glow = this.add.graphics();
      glow.fillStyle(0xFFD700, 0.15);
      glow.fillRoundedRect(-BAG_W / 2 - 4, -BAG_H / 2 - 4, BAG_W + 8, BAG_H + 26, 6);
      glow.lineStyle(2, 0xFFD700, 0.6);
      glow.strokeRoundedRect(-BAG_W / 2 - 4, -BAG_H / 2 - 4, BAG_W + 8, BAG_H + 26, 6);
      slot.add(glow);
    }

    // 种子袋图
    const seedKey = `seed-${crop.id}`;
    const hasTexture = this.textures.exists(seedKey);
    if (hasTexture) {
      const bag = this.add.image(0, 0, seedKey).setDisplaySize(BAG_W - 4, BAG_H - 4);
      if (!isUnlocked) bag.setTint(0x555555);
      slot.add(bag);
    } else {
      const emoji = this.add.text(0, 0, crop.emoji, {
        fontSize: "32px",
      }).setOrigin(0.5, 0.5);
      if (!isUnlocked) emoji.setAlpha(0.4);
      slot.add(emoji);
    }

    // 锁定遮罩
    if (!isUnlocked) {
      const lock = this.add.text(0, -2, "🔒", {
        fontSize: "18px",
      }).setOrigin(0.5, 0.5);
      slot.add(lock);

      const price = this.add.text(0, BAG_H / 2 + 6, `${crop.unlockGold}g`, {
        fontSize: "8px", color: "#888", fontFamily: "monospace",
      }).setOrigin(0.5, 0);
      slot.add(price);
    } else {
      // 种子名称标签
      const label = this.add.text(0, BAG_H / 2 + 4, crop.name, {
        fontSize: "9px",
        color: isSelected ? "#FFD700" : "#4A2A0A",
        fontFamily: "monospace",
        fontStyle: isSelected ? "bold" : "normal",
      }).setOrigin(0.5, 0);
      slot.add(label);

      // 收益信息
      const info = this.add.text(0, BAG_H / 2 + 16, `+${crop.harvestGold}g`, {
        fontSize: "8px", color: "#6A8A3A", fontFamily: "monospace",
      }).setOrigin(0.5, 0);
      slot.add(info);
    }

    // 交互热区
    const hit = this.add.zone(0, 0, BAG_W + 4, BAG_H + 20)
      .setInteractive({ cursor: isUnlocked ? "pointer" : "not-allowed" });

    if (isUnlocked) {
      hit.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        this.selectedCropId = crop.id;
        this.events.emit("select-seed", crop.id);
        this.refreshPage();
        // 选中弹跳动画
        this.tweens.add({
          targets: slot, scaleX: 1.1, scaleY: 1.1,
          duration: 100, yoyo: true, ease: "Quad.easeOut",
        });
      });

      hit.on("pointerover", () => {
        if (crop.id !== this.selectedCropId) {
          this.tweens.add({ targets: slot, scaleX: 1.05, scaleY: 1.05, duration: 80 });
        }
      });
      hit.on("pointerout", () => {
        this.tweens.add({ targets: slot, scaleX: 1, scaleY: 1, duration: 80 });
      });
    }

    slot.add(hit);
  }
}
