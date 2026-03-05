// ── 农场主场景 ──

import Phaser from "phaser";
import { KEYBOARD_LAYOUT, type KeyDef } from "../config/keyboard-layout";
import { KEY_SIZE, KEY_GAP, BOARD_OFFSET_X, BOARD_OFFSET_Y } from "../config/constants";
import { KeyPlot } from "../objects/KeyPlot";
import { HUD } from "../ui/HUD";
import { showToast } from "../ui/Toast";
import {
  createInitialState,
  handleKeyPress,
  tryUnlockNextCrop,
  type GameState,
  type GameEvent,
} from "../systems/FarmManager";
import {
  startInputBridge,
  onInput,
  type InputEvent,
} from "../systems/InputBridge";

export class FarmScene extends Phaser.Scene {
  private keyPlots = new Map<string, KeyPlot>();
  private hud!: HUD;
  private gameState: GameState = createInitialState();

  constructor() {
    super({ key: "FarmScene" });
  }

  create(): void {
    const { width } = this.scale;

    // 背景
    this.cameras.main.setBackgroundColor(0x87ceeb);

    // HUD
    this.hud = new HUD(this, width);
    this.hud.update(this.gameState);

    // 渲染键盘
    this.buildKeyboard();

    // 功能键提示
    this.add
      .text(width / 2, BOARD_OFFSET_Y - 18, "Tab:换种  Enter:收获  Shift:施肥  Space:加速  ⌫:铲除", {
        fontSize: "11px",
        color: "#ffffff88",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // 启动输入监听
    this.startListening();
  }

  private buildKeyboard(): void {
    let rowY = BOARD_OFFSET_Y;

    for (const row of KEYBOARD_LAYOUT) {
      let colX = BOARD_OFFSET_X;

      for (const keyDef of row) {
        const plot = new KeyPlot(this, colX, rowY, keyDef);
        this.keyPlots.set(keyDef.id, plot);
        colX += KEY_SIZE * keyDef.width + KEY_GAP * keyDef.width + KEY_GAP;
      }

      rowY += KEY_SIZE + KEY_GAP;
    }
  }

  private async startListening(): Promise<void> {
    try {
      await startInputBridge();
      onInput((event: InputEvent) => this.onKeyEvent(event));
    } catch {
      // 非 Tauri 环境
    }
  }

  private onKeyEvent(event: InputEvent): void {
    if (event.event_type !== "key_press") return;

    // 更新游戏状态
    const result = handleKeyPress(this.gameState, event.key_id);
    this.gameState = result.state;

    // 尝试自动解锁下一种作物
    const unlockResult = tryUnlockNextCrop(this.gameState);
    this.gameState = unlockResult.state;

    // 按键动画
    const keyPlot = this.keyPlots.get(event.key_id);
    if (keyPlot) {
      keyPlot.playPressAnim();
    }

    // 处理事件
    for (const ev of result.events) {
      this.handleGameEvent(ev);
    }

    // 刷新所有键帽显示
    this.refreshAllPlots();

    // 更新 HUD
    this.hud.update(this.gameState);
  }

  private handleGameEvent(ev: GameEvent): void {
    const keyPlot = ev.keyId ? this.keyPlots.get(ev.keyId) : undefined;

    switch (ev.type) {
      case "harvest": {
        if (keyPlot) {
          const bounds = keyPlot.getBounds();
          showToast(this, bounds.centerX, bounds.y, `+${ev.gold} 金币`);
        }
        break;
      }
      case "mature": {
        keyPlot?.playMatureAnim();
        break;
      }
      case "switch_seed": {
        const { width } = this.scale;
        showToast(this, width / 2, 60, `种子: ${ev.seedName}`, "#90ee90");
        break;
      }
      case "fertilize": {
        const { width } = this.scale;
        showToast(this, width / 2, 60, "施肥!", "#88ccff");
        break;
      }
      case "speed_up": {
        const { width } = this.scale;
        showToast(this, width / 2, 60, "加速!", "#ffaa00");
        break;
      }
    }
  }

  private refreshAllPlots(): void {
    for (const [keyId, keyPlot] of this.keyPlots) {
      const plot = this.gameState.plots[keyId];
      keyPlot.render(plot);
    }
  }
}
