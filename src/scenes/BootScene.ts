import Phaser from "phaser";
import {
  startInputBridge,
  onInput,
  checkAccessibility,
  openAccessibilitySettings,
  type InputEvent,
} from "../systems/InputBridge";

export class BootScene extends Phaser.Scene {
  private keyText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private recentKeys: string[] = [];

  constructor() {
    super({ key: "BootScene" });
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 40, "键盘农场", {
        fontSize: "36px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, 90, "检查辅助功能权限...", {
        fontSize: "16px",
        color: "#d4e8c0",
        fontFamily: "Arial, sans-serif",
      })
      .setOrigin(0.5);

    this.keyText = this.add
      .text(width / 2, height / 2, "在任意 App 中打字试试", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 30, "最近按键将显示在这里", {
        fontSize: "14px",
        color: "#a0c890",
        fontFamily: "Arial, sans-serif",
      })
      .setOrigin(0.5);

    // 检查辅助功能权限
    try {
      const trusted = await checkAccessibility();
      if (trusted) {
        this.statusText.setText("辅助功能权限: 已授权 ✓");
        this.statusText.setColor("#90ee90");
      } else {
        this.statusText.setText(
          "需要辅助功能权限 — 点击此处打开设置"
        );
        this.statusText.setColor("#ffcc00");
        this.statusText.setInteractive({ useHandCursor: true });
        this.statusText.on("pointerdown", () => {
          openAccessibilitySettings();
        });
      }
    } catch {
      this.statusText.setText("权限检查跳过（非 Tauri 环境）");
      this.statusText.setColor("#888888");
    }

    // 启动输入桥接
    try {
      await startInputBridge();
      onInput((event: InputEvent) => {
        this.handleInput(event);
      });
    } catch {
      this.statusText.setText("输入桥接启动失败（非 Tauri 环境）");
    }
  }

  private handleInput(event: InputEvent): void {
    const label =
      event.event_type === "key_press"
        ? event.key_id.toUpperCase()
        : `🖱 ${event.key_id}`;

    this.recentKeys.unshift(label);
    if (this.recentKeys.length > 10) {
      this.recentKeys = this.recentKeys.slice(0, 10);
    }

    this.keyText.setText(this.recentKeys.join("  "));

    // 按键缩放动画
    this.tweens.add({
      targets: this.keyText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 50,
      yoyo: true,
    });
  }
}
