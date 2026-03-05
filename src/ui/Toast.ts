// ── 浮动提示文字 ──

import Phaser from "phaser";

export function showToast(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color = "#ffd700",
): void {
  const text = scene.add
    .text(x, y, message, {
      fontSize: "16px",
      color,
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setDepth(100);

  scene.tweens.add({
    targets: text,
    y: y - 40,
    alpha: 0,
    duration: 800,
    ease: "Cubic.easeOut",
    onComplete: () => text.destroy(),
  });
}
