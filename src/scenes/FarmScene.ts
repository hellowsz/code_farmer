// ── 农场岛主场景 ──

import Phaser from "phaser";
import { KEYBOARD_LAYOUT } from "../config/keyboard-layout";
import { KEY_SIZE, KEY_GAP, SKY_H } from "../config/constants";
import { drawIsland } from "../objects/IslandRenderer";
import { KeyPlot } from "../objects/KeyPlot";
import { showToast } from "../ui/Toast";
import {
  createInitialState,
  handleKeyPress,
  tryUnlockNextCrop,
  getSelectedCrop,
  selectSeed,
  bulkPlant,
  type GameState,
  type GameEvent,
} from "../systems/FarmManager";
import { ShopScene } from "./ShopScene";
import { StatsScene } from "./StatsScene";
import {
  startInputBridge,
  onInput,
  type InputEvent,
} from "../systems/InputBridge";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

// 岛布局（紧凑，填满窗口，对标指尖农场）
const BUILDING_H = 70;
const SIDE_W = 15;
const KB_PAD = 3;

// 窗口缩放
const BASE_W = 860;
const BASE_H = 500;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.0;
const SCALE_STEP = 0.05;

export class FarmScene extends Phaser.Scene {
  private keyPlots = new Map<string, KeyPlot>();
  private keyCounts = new Map<string, number>();
  private countTexts = new Map<string, Phaser.GameObjects.Text>();
  private gameState: GameState = createInitialState();
  private island!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private seedText!: Phaser.GameObjects.Text;

  private kbWidth = 0;
  private kbHeight = 0;
  private islandW = 0;
  private islandH = 0;
  private kbX = 0;
  private kbY = 0;
  private windowScale = 1.0;

  constructor() {
    super({ key: "FarmScene" });
  }

  create(): void {
    this.calcDimensions();
    // 岛直接占满整个窗口，零边距
    this.island = this.add.container(0, 0);

    // 岛造型
    drawIsland(this, this.island, this.islandW, this.islandH, SKY_H, BUILDING_H, this.kbY, this.kbHeight, this.kbX, this.kbWidth);

    // 键盘
    this.buildKeyboard();

    // 岛内 UI
    this.createUI();

    // 拖拽
    this.setupDragging();

    // 滚轮缩放 → 真正调整窗口大小
    this.input.on("wheel", (_p: unknown, _go: unknown[], _dx: number, dy: number) => {
      const next = Phaser.Math.Clamp(
        this.windowScale + (dy > 0 ? -SCALE_STEP : SCALE_STEP),
        MIN_SCALE, MAX_SCALE,
      );
      if (next !== this.windowScale) {
        this.windowScale = next;
        const w = Math.round(BASE_W * next);
        const h = Math.round(BASE_H * next);
        getCurrentWindow().setSize(new LogicalSize(w, h)).catch(() => {});
      }
    });


    // 输入监听
    this.startListening();

    // 启动商店场景（并行）
    this.scene.launch("ShopScene");
    this.scene.bringToTop("ShopScene");
    this.setupShopEvents();

    // 启动统计场景（并行）
    this.scene.launch("StatsScene");
    this.scene.bringToTop("StatsScene");
  }

  private calcDimensions(): void {
    const { width, height } = this.scale;

    // 键盘原始宽高
    let maxW = 0;
    for (const row of KEYBOARD_LAYOUT) {
      let w = 0;
      for (const k of row) w += KEY_SIZE * k.width + KEY_GAP * k.width + KEY_GAP;
      maxW = Math.max(maxW, w);
    }
    this.kbWidth = maxW;
    this.kbHeight = (KEY_SIZE + KEY_GAP) * KEYBOARD_LAYOUT.length;

    // 岛 = 窗口大小，键盘贴左侧，右边留给池塘
    this.islandW = width;
    this.islandH = height;
    this.kbX = 12; // 紧贴左侧
    this.kbY = SKY_H + BUILDING_H + 8;
  }

  private buildKeyboard(): void {
    let ry = this.kbY;
    for (const row of KEYBOARD_LAYOUT) {
      let cx = this.kbX;
      for (const kd of row) {
        const plot = new KeyPlot(this, cx, ry, kd);
        this.island.add(plot);
        this.keyPlots.set(kd.id, plot);
        this.keyCounts.set(kd.id, 0);

        // 计数气泡
        if (!kd.isModifier) {
          const bx = cx + (KEY_SIZE * kd.width) / 2;
          const by = ry - 4;
          const ct = this.add
            .text(bx, by, "", {
              fontSize: "7px",
              color: "#5a3a1a",
              fontFamily: "monospace",
              backgroundColor: "#fff8dccc",
              padding: { x: 2, y: 1 },
            })
            .setOrigin(0.5, 1)
            .setVisible(false);
          this.island.add(ct);
          this.countTexts.set(kd.id, ct);
        }

        cx += KEY_SIZE * kd.width + KEY_GAP * kd.width + KEY_GAP;
      }
      ry += KEY_SIZE + KEY_GAP;
    }
  }

  private createUI(): void {
    this.goldText = this.add.text(this.kbX, SKY_H + 5, "🪙 0", {
      fontSize: "12px", color: "#fff8dc", fontFamily: "monospace",
      stroke: "#3a2a0a", strokeThickness: 3,
    });
    this.island.add(this.goldText);

    this.seedText = this.add.text(this.kbX + this.kbWidth, SKY_H + 5, "🌾 小麦", {
      fontSize: "11px", color: "#fff8dc", fontFamily: "monospace",
      stroke: "#3a2a0a", strokeThickness: 3,
    }).setOrigin(1, 0);
    this.island.add(this.seedText);

    // 点击棚子（shop-tent）打开商店
    // 棚子位置：IslandRenderer 中 drawFrontBuildings 里 x=w*0.10, baseY=fenceY+18, h=130
    const tentX = this.islandW * 0.10;
    const tentBaseY = SKY_H + BUILDING_H + 18;
    const tentHitZone = this.add.zone(tentX, tentBaseY - 65, 80, 130)
      .setInteractive({ cursor: "pointer" }).setDepth(50);
    tentHitZone.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.toggleShop();
    });

    // 点击路标（signpost）打开统计
    // 路标位置：IslandRenderer drawSignpost x=w*0.76, baseY=fenceY+14, h~60
    const signX = this.islandW * 0.76;
    const signBaseY = SKY_H + BUILDING_H + 14;
    const signHitZone = this.add.zone(signX, signBaseY - 30, 60, 70)
      .setInteractive({ cursor: "pointer" }).setDepth(50);
    signHitZone.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.toggleStats();
    });
  }

  private setupDragging(): void {
    // 拖拽：用 Phaser input 的 topOnly 机制
    // 商店按钮等 UI 在上层，会优先接收事件
    this.input.topOnly = true;
    const dragZone = this.add.zone(
      this.islandW / 2, this.islandH / 2,
      this.islandW, this.islandH,
    ).setInteractive({ cursor: "grab" }).setDepth(-10);

    dragZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const shop = this.getShopScene();
      const stats = this.getStatsScene();

      // 商店打开时
      if (shop.getIsOpen()) {
        if (pointer.x < 320) return; // 商店区域不拖拽
        shop.close();
        return;
      }
      // 统计打开时
      if (stats.getIsOpen()) {
        if (pointer.x > this.islandW - 300) return; // 统计区域不拖拽
        stats.close();
        return;
      }
      try {
        getCurrentWindow().startDragging();
      } catch { /* non-Tauri */ }
    });
  }

  private getShopScene(): ShopScene {
    return this.scene.get("ShopScene") as ShopScene;
  }

  private setupShopEvents(): void {
    const shop = this.getShopScene();

    // 商店选择种子
    shop.events.on("select-seed", (cropId: string) => {
      this.gameState = selectSeed(this.gameState, cropId);
      shop.refreshGrid(this.gameState);
      this.updateUI();
    });

    // 批量播种
    shop.events.on("bulk-plant", () => {
      const plantableKeys: string[] = [];
      for (const row of KEYBOARD_LAYOUT) {
        for (const k of row) {
          if (!k.isModifier) plantableKeys.push(k.id);
        }
      }
      const result = bulkPlant(this.gameState, plantableKeys);
      this.gameState = result.state;
      for (const ev of result.events) this.handleEvent(ev);
      this.refreshPlots();
      this.updateUI();
      shop.refreshGrid(this.gameState);
    });
  }

  private toggleShop(): void {
    const shop = this.getShopScene();
    shop.toggle(this.gameState);
  }

  private getStatsScene(): StatsScene {
    return this.scene.get("StatsScene") as StatsScene;
  }

  private toggleStats(): void {
    const stats = this.getStatsScene();
    stats.toggle(this.gameState);
  }

  private async startListening(): Promise<void> {
    try {
      await startInputBridge();
      onInput((e: InputEvent) => this.onKeyEvent(e));
      console.log("[FarmScene] Input bridge started OK");
    } catch (err) {
      console.error("[FarmScene] Input bridge failed:", err);
    }
  }

  private onKeyEvent(event: InputEvent): void {
    if (event.event_type !== "key_press") return;

    // 按键计数
    this.keyCounts.set(event.key_id, (this.keyCounts.get(event.key_id) ?? 0) + 1);
    this.updateBubble(event.key_id);

    // 游戏逻辑
    const result = handleKeyPress(this.gameState, event.key_id);
    this.gameState = result.state;
    const unlock = tryUnlockNextCrop(this.gameState);
    this.gameState = unlock.state;

    this.keyPlots.get(event.key_id)?.playPressAnim();
    for (const ev of result.events) this.handleEvent(ev);
    this.refreshPlots();
    this.updateUI();

    // 同步面板状态
    const shop = this.getShopScene();
    if (shop.getIsOpen()) shop.refreshGrid(this.gameState);
    const stats = this.getStatsScene();
    if (stats.getIsOpen()) stats.refresh(this.gameState);
  }

  private updateBubble(id: string): void {
    const t = this.countTexts.get(id);
    if (!t) return;
    const c = this.keyCounts.get(id) ?? 0;
    if (c > 0) { t.setText(String(c)); t.setVisible(true); }
  }

  private handleEvent(ev: GameEvent): void {
    const kp = ev.keyId ? this.keyPlots.get(ev.keyId) : undefined;
    switch (ev.type) {
      case "harvest":
        if (kp) {
          const b = kp.getBounds();
          showToast(this, b.centerX, b.y - 10, `+${ev.gold}`, "#ffd700");
        }
        break;
      case "mature":
        kp?.playMatureAnim();
        break;
      case "switch_seed":
        showToast(this, this.scale.width / 2, this.scale.height / 2 - 60, `${ev.seedName}`, "#90ee90");
        break;
    }
  }

  private refreshPlots(): void {
    for (const [id, kp] of this.keyPlots) kp.render(this.gameState.plots[id]);
  }

  private updateUI(): void {
    const crop = getSelectedCrop(this.gameState);
    this.goldText.setText(`🪙 ${this.gameState.gold}`);
    this.seedText.setText(`${crop.emoji} ${crop.name}`);
  }
}
