// ── 农场岛渲染器（多层堆叠布局）──

import Phaser from "phaser";

// ── 有机轮廓参数 ──
const TOP_INSET = 20;
const SIDE_BULGE = 8;
const BOT_INSET = 6;

// ── 贝塞尔曲线采样 ──
function cubicBez(
  g: Phaser.GameObjects.Graphics,
  x0: number, y0: number,
  cx1: number, cy1: number, cx2: number, cy2: number,
  ex: number, ey: number, n = 16,
): void {
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    g.lineTo(
      u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * ex,
      u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * ey,
    );
  }
}

interface BezSeg { cx1: number; cy1: number; cx2: number; cy2: number; ex: number; ey: number }

function topSegs(w: number, skyH: number): BezSeg[] {
  const ti = TOP_INSET;
  return [
    { cx1: ti - 8, cy1: skyH * 0.45, cx2: ti + 12, cy2: 18, ex: w * 0.2, ey: 10 },
    { cx1: w * 0.28, cy1: -2, cx2: w * 0.38, cy2: 10, ex: w * 0.48, ey: 0 },
    { cx1: w * 0.58, cy1: 8, cx2: w * 0.72, cy2: -4, ex: w * 0.82, ey: 10 },
    { cx1: w - ti + 12, cy1: 18, cx2: w - ti + 8, cy2: skyH * 0.45, ex: w - ti, ey: skyH },
  ];
}

function traceTop(g: Phaser.GameObjects.Graphics, w: number, skyH: number, sx: number, sy: number): { x: number; y: number } {
  let cx = sx, cy = sy;
  for (const s of topSegs(w, skyH)) {
    cubicBez(g, cx, cy, s.cx1, s.cy1, s.cx2, s.cy2, s.ex, s.ey);
    cx = s.ex; cy = s.ey;
  }
  return { x: cx, y: cy };
}

function traceIsland(g: Phaser.GameObjects.Graphics, w: number, h: number, skyH: number): void {
  const ti = TOP_INSET, sb = SIDE_BULGE, bi = BOT_INSET;
  g.beginPath();
  g.moveTo(ti, skyH);
  const top = traceTop(g, w, skyH, ti, skyH);
  cubicBez(g, top.x, top.y, w + sb, skyH + (h - skyH) * 0.2, w + sb, skyH + (h - skyH) * 0.7, w - bi, h - 6);
  cubicBez(g, w - bi, h - 6, w * 0.7, h + 8, w * 0.3, h + 8, bi, h - 6);
  cubicBez(g, bi, h - 6, -sb, skyH + (h - skyH) * 0.7, -sb, skyH + (h - skyH) * 0.2, ti, skyH);
  g.closePath();
}

/** 主入口 */
export function drawIsland(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  w: number, h: number,
  skyH: number, buildingH: number,
  kbY: number, kbH: number,
  kbX: number, kbW: number,
): void {
  const fenceY = skyH + buildingH;
  const pondX = kbX + kbW + 8;
  const pondW = w - pondX - 15;

  // 1. 岛体底色
  const bodyG = scene.add.graphics();
  bodyG.fillStyle(0x5A4010, 1);
  traceIsland(bodyG, w, h, skyH);
  bodyG.fillPath();
  container.add(bodyG);

  // 2. 天空
  drawSky(scene, container, w, skyH);

  // 3. 草地带
  drawGrass(scene, container, w, skyH, kbY);

  // 4. 泥土截面
  drawDirt(scene, container, w, h, kbY + kbH);

  // 5. 键盘区背景
  drawKBBed(scene, container, kbX - 2, kbY - 2, kbW + 4, kbH + 4);

  // 6. 后排栅栏（粗木板，跨越右侧和后方）
  drawBackFences(scene, container, w, fenceY);

  // 7. 后排向日葵（大量填充）
  drawBackSunflowers(scene, container, w, fenceY);

  // 8. 后排建筑（钟楼 + 树，高大，在后面）
  drawBackBuildings(scene, container, w, fenceY);

  // 9. 中间向日葵（填充建筑之间的缝隙）
  drawMidSunflowers(scene, container, w, fenceY);

  // 10. 前排建筑（店铺 + 仓房，矮，在前面）
  drawFrontBuildings(scene, container, w, fenceY);

  // 11. 前排小物件（邮箱、扩音器在栅栏/树旁）
  drawSmallProps(scene, container, w, fenceY);

  // 12. 中文路标（右侧树前，带设置/统计/箭头/删除）
  drawSignpost(scene, container, w, fenceY);

  // 13. 前排向日葵
  drawFrontSunflowers(scene, container, w, fenceY);

  // 14. 前排白色尖头栅栏（左下角区域）
  drawFrontWhiteFence(scene, container, w, fenceY);

  // 15. 主栅栏分界线
  drawMainFence(scene, container, w, fenceY);

  // 16. 底部栅栏
  drawBottomFences(scene, container, kbX, kbW, kbY + kbH + 2);

  // 17. 池塘
  const pondH = (kbH + 30) * 2 / 3;
  const pondTopY = kbY + kbH - pondH + 10;
  drawPond(scene, container, pondX, pondTopY, pondW, pondH);

  // 18. 动物
  drawAnimals(scene, container, kbX, kbY, kbH, kbW, w, h, pondX, pondW, pondTopY, pondH);

  // 19. 岛体描边
  const outG = scene.add.graphics();
  outG.lineStyle(5, 0x1A0A00, 1);
  traceIsland(outG, w, h, skyH);
  outG.strokePath();
  container.add(outG);
}

// ══════════════════════════════════════
//  天空
// ══════════════════════════════════════

function drawSky(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, skyH: number): void {
  const g = scene.add.graphics();
  const ti = TOP_INSET;

  g.fillStyle(0x7DCCE8, 1);
  g.beginPath();
  g.moveTo(ti, skyH);
  traceTop(g, w, skyH, ti, skyH);
  g.lineTo(ti, skyH);
  g.closePath();
  g.fillPath();

  g.fillStyle(0x5AADE0, 0.25);
  g.beginPath();
  g.moveTo(ti + 15, skyH * 0.3);
  cubicBez(g, ti + 15, skyH * 0.3, w * 0.3, -5, w * 0.7, -5, w - ti - 15, skyH * 0.3);
  g.lineTo(ti + 15, skyH * 0.3);
  g.closePath();
  g.fillPath();

  fillCloud(g, w * 0.12, 42, 65, 24);
  fillCloud(g, w * 0.35, 30, 100, 38);
  fillCloud(g, w * 0.55, 22, 130, 48);
  fillCloud(g, w * 0.72, 28, 140, 50);
  fillCloud(g, w * 0.85, 38, 80, 32);
  fillCloud(g, w * 0.25, 58, 45, 16);
  fillCloud(g, w * 0.48, 65, 40, 14);

  ct.add(g);
}

function fillCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, cw: number, ch: number): void {
  g.fillStyle(0xFFFFFF, 0.85);
  g.fillEllipse(x, y, cw, ch);
  g.fillEllipse(x - cw * 0.25, y + ch * 0.1, cw * 0.55, ch * 0.65);
  g.fillEllipse(x + cw * 0.25, y - ch * 0.05, cw * 0.5, ch * 0.7);
  g.fillStyle(0xFFFFFF, 0.4);
  g.fillEllipse(x + cw * 0.05, y - ch * 0.2, cw * 0.3, ch * 0.3);
}

// ══════════════════════════════════════
//  草地
// ══════════════════════════════════════

function drawGrass(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, top: number, bottom: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0x5A9E3A, 1);
  g.fillRect(0, top - 2, w, bottom - top + 10);
  g.fillStyle(0x488A2E, 0.5);
  g.fillRect(0, bottom + 2, w, 8);
  g.fillStyle(0x6EBB4A, 0.3);
  g.fillRect(2, top, w - 4, 4);
  g.lineStyle(2, 0x3A7520, 0.5);
  for (let x = 4; x < w - 4; x += 6 + Math.random() * 4) {
    g.lineBetween(x, top + 2, x - 1, top - 3 - Math.random() * 3);
  }
  ct.add(g);
}

// ══════════════════════════════════════
//  泥土
// ══════════════════════════════════════

function drawDirt(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, h: number, dirtTop: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0x6B4F10, 1);
  g.fillRect(1, dirtTop, w - 2, h - dirtTop - 6);
  g.lineStyle(1, 0x5A4010, 0.3);
  for (let y = dirtTop + 3; y < h - 8; y += 5) {
    for (let x = 5; x < w - 5; x += 12 + Math.random() * 8) {
      g.lineBetween(x, y, x + 4 + Math.random() * 5, y);
    }
  }
  ct.add(g);
}

// ══════════════════════════════════════
//  键盘区背景
// ══════════════════════════════════════

function drawKBBed(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number): void {
  const g = scene.add.graphics();
  g.fillStyle(0x8B7020, 0.12);
  g.fillRoundedRect(x, y, w, h, 3);
  ct.add(g);
}

// ══════════════════════════════════════
//  精灵辅助
// ══════════════════════════════════════

function addSprite(
  scene: Phaser.Scene, ct: Phaser.GameObjects.Container,
  x: number, baseY: number, key: string, displayH: number,
): void {
  const img = scene.add.image(x, baseY, key).setOrigin(0.5, 1);
  img.setScale(displayH / img.height);
  ct.add(img);
}

function addFenceSprite(
  scene: Phaser.Scene, ct: Phaser.GameObjects.Container,
  x: number, baseY: number, displayW: number, displayH: number,
): void {
  const img = scene.add.image(x, baseY, "building-fence").setOrigin(0.5, 1);
  img.setDisplaySize(displayW, displayH);
  ct.add(img);
}

// ══════════════════════════════════════
//  后排栅栏（粗木板，右侧和后方）
// ══════════════════════════════════════

function drawBackFences(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const g = scene.add.graphics();
  const y = fenceY - 8;

  // 后方粗木板栅栏（横跨上方，形成后景）
  const postW = 7, postH = 30, gap = 16;
  for (let px = w * 0.3; px < w * 0.95; px += gap) {
    g.fillStyle(0x8A6A22, 1);
    g.fillRect(px - postW / 2, y - postH, postW, postH);
    g.fillStyle(0x9A7A30, 0.8);
    g.fillRect(px - postW / 2 + 1, y - postH + 2, postW - 2, postH - 4);
    g.lineStyle(1.2, 0x3A2A0A, 0.5);
    g.strokeRect(px - postW / 2, y - postH, postW, postH);
  }
  // 横杠
  g.fillStyle(0x7A5A1A, 0.9);
  g.fillRect(w * 0.3, y - postH + 6, w * 0.65, 4);
  g.fillRect(w * 0.3, y - postH + 18, w * 0.65, 4);

  ct.add(g);
}

// ══════════════════════════════════════
//  后排建筑（钟楼 + 树，高大在后）
// ══════════════════════════════════════

function drawBackBuildings(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const baseY = fenceY + 12;

  // 钟楼（中偏左，最高建筑）
  addSprite(scene, ct, w * 0.38, baseY, "building-clock", 190);

  // 大树（右侧，高大茂密）
  addSprite(scene, ct, w * 0.82, baseY + 5, "building-tree", 180);

  // 水井（右侧树旁）
  addSprite(scene, ct, w * 0.70, baseY + 15, "building-well", 80);
}

// ══════════════════════════════════════
//  中间向日葵（大量填充建筑间缝隙）
// ══════════════════════════════════════

function drawMidSunflowers(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const by = fenceY + 8;
  // 钟楼左边
  for (let i = 0; i < 6; i++) drawSunflower(scene, ct, w * 0.22 + i * 12, by - 6, 30 + Math.random() * 18);
  // 钟楼右边到树之间（密集）
  for (let i = 0; i < 10; i++) drawSunflower(scene, ct, w * 0.46 + i * 11, by - 4, 26 + Math.random() * 20);
  // 树后面
  for (let i = 0; i < 4; i++) drawSunflower(scene, ct, w * 0.88 + i * 10, by - 2, 20 + Math.random() * 14);
}

// ══════════════════════════════════════
//  前排建筑（店铺 + 仓房，矮，在前面）
// ══════════════════════════════════════

function drawFrontBuildings(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const baseY = fenceY + 14;

  // 店铺（最左前）
  addSprite(scene, ct, w * 0.10, baseY + 4, "shop-tent", 130);

  // 红色仓房（店铺右侧，前排）
  addSprite(scene, ct, w * 0.25, baseY + 6, "building-barn", 120);
}

// ══════════════════════════════════════
//  小物件（邮箱、扩音器 → 栅栏/树旁）
// ══════════════════════════════════════

function drawSmallProps(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const baseY = fenceY + 14;

  // 扩音器 → 左侧白栅栏附近
  addSprite(scene, ct, w * 0.03, baseY + 10, "building-windvane", 70);

  // 邮箱 → 右侧树旁
  addSprite(scene, ct, w * 0.92, baseY + 12, "building-mailbox", 72);
}

// ══════════════════════════════════════
//  中文路标（右侧树前，带设置/统计等）
// ══════════════════════════════════════

function drawSignpost(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const x = w * 0.76, baseY = fenceY + 14;
  const g = scene.add.graphics();
  const postH = 60;

  // 木桩
  g.fillStyle(0x8B6914, 1);
  g.fillRect(x - 3, baseY - postH, 6, postH);
  g.lineStyle(1, 0x5A4010, 0.6);
  g.strokeRect(x - 3, baseY - postH, 6, postH);

  // 顶部圆帽
  g.fillStyle(0xAA8040, 1);
  g.fillCircle(x, baseY - postH - 2, 5);

  ct.add(g);

  // 箭头牌子们
  const labels = [
    { text: "< 设置", dy: -48, color: 0xCC8844 },
    { text: "统计 >", dy: -34, color: 0x88AA44 },
    { text: "x 删除", dy: -20, color: 0xCC5544 },
  ];

  for (const lb of labels) {
    const bw = 48, bh = 12;
    const bx = x - bw / 2;
    const by = baseY + lb.dy;
    const bg = scene.add.graphics();
    bg.fillStyle(lb.color, 0.9);
    bg.fillRoundedRect(bx, by, bw, bh, 3);
    bg.lineStyle(1, 0x3A2A0A, 0.5);
    bg.strokeRoundedRect(bx, by, bw, bh, 3);
    ct.add(bg);

    const txt = scene.add.text(x, by + bh / 2, lb.text, {
      fontSize: "8px",
      color: "#fff8dc",
      fontFamily: "monospace",
      stroke: "#3a2a0a",
      strokeThickness: 1.5,
    }).setOrigin(0.5, 0.5);
    ct.add(txt);
  }
}

// ══════════════════════════════════════
//  前排白色尖头栅栏（左下角，用素材）
// ══════════════════════════════════════

function drawFrontWhiteFence(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const y = fenceY + 12;
  // 从最左边到 ~30% 宽度，用 building-fence.png 素材排列
  const fenceW = 52, fenceH = 32;
  for (let fx = 8; fx < w * 0.32; fx += fenceW - 4) {
    addFenceSprite(scene, ct, fx + fenceW / 2, y, fenceW, fenceH);
  }
}

// ══════════════════════════════════════
//  后排向日葵
// ══════════════════════════════════════

function drawBackSunflowers(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const by = fenceY + 2;
  // 大量向日葵，跨越整个后排
  for (let i = 0; i < 10; i++) drawSunflower(scene, ct, w * 0.05 + i * 18, by - 12, 32 + Math.random() * 22);
  for (let i = 0; i < 8; i++) drawSunflower(scene, ct, w * 0.55 + i * 16, by - 10, 28 + Math.random() * 18);
}

// ══════════════════════════════════════
//  前排向日葵
// ══════════════════════════════════════

function drawFrontSunflowers(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, fenceY: number): void {
  const by = fenceY + 14;
  // 店铺和仓房之间
  for (let i = 0; i < 4; i++) drawSunflower(scene, ct, w * 0.16 + i * 10, by, 14 + Math.random() * 8);
  // 仓房右侧到钟楼
  for (let i = 0; i < 5; i++) drawSunflower(scene, ct, w * 0.30 + i * 10, by + 2, 12 + Math.random() * 6);
  // 右侧散布
  for (let i = 0; i < 3; i++) drawSunflower(scene, ct, w * 0.60 + i * 14, by, 13 + Math.random() * 7);
}

function drawSunflower(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, x: number, baseY: number, h: number): void {
  const g = scene.add.graphics();
  const sway = (Math.random() - 0.5) * 5;
  g.lineStyle(3, 0x3A7A1A, 1);
  g.lineBetween(x, baseY, x + sway, baseY - h);
  g.fillStyle(0x4A9A2A, 1);
  g.fillEllipse(x + 5, baseY - h * 0.35, 9, 4);
  g.fillEllipse(x - 4, baseY - h * 0.55, 8, 3.5);
  const fx = x + sway, fy = baseY - h - 2;
  g.fillStyle(0xFFD700, 1);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
    g.fillEllipse(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 5, 3);
  }
  g.fillStyle(0x8B4513, 1);
  g.fillCircle(fx, fy, 4);
  ct.add(g);
}

// ══════════════════════════════════════
//  主栅栏分界线（建筑区和键盘区之间）
// ══════════════════════════════════════

function drawMainFence(scene: Phaser.Scene, ct: Phaser.GameObjects.Container, w: number, y: number): void {
  const g = scene.add.graphics();
  const startX = 6, endX = w - 6;
  const gap = 14, postW = 6, postH = 28;

  for (let i = 0; i <= Math.floor((endX - startX) / gap); i++) {
    const px = startX + i * gap;
    g.fillStyle(0x9A7030, 1);
    g.fillRect(px - postW / 2, y - postH + 6, postW, postH);
    g.fillStyle(0xAA8040, 1);
    g.fillTriangle(px - postW / 2 - 1, y - postH + 6, px + postW / 2 + 1, y - postH + 6, px, y - postH - 4);
    g.lineStyle(1.5, 0x3A2A0A, 0.6);
    g.strokeRect(px - postW / 2, y - postH + 6, postW, postH);
  }
  g.fillStyle(0x8A6A22, 0.9);
  g.fillRect(startX, y - postH + 12, endX - startX, 4);
  g.fillRect(startX, y - postH + 22, endX - startX, 4);
  g.lineStyle(0.8, 0x3A2A0A, 0.35);
  g.strokeRect(startX, y - postH + 12, endX - startX, 4);
  g.strokeRect(startX, y - postH + 22, endX - startX, 4);
  ct.add(g);
}

// ══════════════════════════════════════
//  底部栅栏（左白 + 右棕）
// ══════════════════════════════════════

function drawBottomFences(
  scene: Phaser.Scene, ct: Phaser.GameObjects.Container,
  kbX: number, kbW: number, fenceY: number,
): void {
  const g = scene.add.graphics();

  // 左侧白色尖桩栅栏
  const wS = 4, wE = kbX + kbW * 0.35;
  for (let i = 0; i <= Math.floor((wE - wS) / 8); i++) {
    const px = wS + i * 8;
    g.fillStyle(0xF8F4E8, 1);
    g.fillRect(px - 2, fenceY, 4, 16);
    g.fillTriangle(px - 3, fenceY, px + 3, fenceY, px, fenceY - 5);
    g.lineStyle(1.2, 0x8A7A6A, 0.6);
    g.strokeRect(px - 2, fenceY, 4, 16);
  }
  g.fillStyle(0xF0ECE0, 1);
  g.fillRect(wS, fenceY + 3, wE - wS, 2.5);
  g.fillRect(wS, fenceY + 9, wE - wS, 2.5);

  // 右侧棕色木栅栏
  const bS = kbX + kbW * 0.6, bE = kbX + kbW + 5;
  for (let i = 0; i <= Math.floor((bE - bS) / 10); i++) {
    const px = bS + i * 10;
    g.fillStyle(0xA07830, 1);
    g.fillRect(px - 2.5, fenceY - 2, 5, 18);
    g.fillTriangle(px - 3, fenceY - 2, px + 3.5, fenceY - 2, px, fenceY - 7);
    g.lineStyle(1.2, 0x3A2A0A, 0.5);
    g.strokeRect(px - 2.5, fenceY - 2, 5, 18);
  }
  g.fillStyle(0x8A6A22, 1);
  g.fillRect(bS, fenceY + 2, bE - bS, 2.5);
  g.fillRect(bS, fenceY + 9, bE - bS, 2.5);

  ct.add(g);
}

// ══════════════════════════════════════
//  池塘
// ══════════════════════════════════════

function drawPond(
  scene: Phaser.Scene, ct: Phaser.GameObjects.Container,
  x: number, y: number, pw: number, ph: number,
): void {
  const g = scene.add.graphics();
  const cx = x + pw / 2;

  g.fillStyle(0x5AAACC, 1);
  g.fillRoundedRect(x, y, pw, ph, 10);
  g.fillStyle(0x88CCEE, 0.8);
  g.fillRoundedRect(x + 3, y + 3, pw - 6, ph - 6, 8);

  g.fillStyle(0xAADDFF, 0.5);
  g.fillRoundedRect(x + 5, y + ph * 0.2, pw - 10, ph * 0.15, 4);
  g.fillRoundedRect(x + 7, y + ph * 0.5, pw - 14, ph * 0.1, 3);
  g.fillRoundedRect(x + 6, y + ph * 0.75, pw - 12, ph * 0.08, 3);

  g.lineStyle(3, 0x6A5020, 1);
  g.strokeRoundedRect(x, y, pw, ph, 10);

  g.fillStyle(0xFF8844, 0.7);
  g.fillEllipse(cx - 2, y + ph * 0.4, 8, 4);
  g.fillTriangle(cx + 3, y + ph * 0.4, cx + 7, y + ph * 0.4 - 3, cx + 7, y + ph * 0.4 + 3);

  g.fillStyle(0xFFAA66, 0.6);
  g.fillEllipse(cx + 4, y + ph * 0.65, 6, 3);

  ct.add(g);
}

// ══════════════════════════════════════
//  动物
// ══════════════════════════════════════

function drawAnimals(
  scene: Phaser.Scene, ct: Phaser.GameObjects.Container,
  kbX: number, kbY: number, kbH: number, kbW: number,
  _w: number, _h: number,
  pondX: number, pondW: number,
  pondTopY: number, pondH: number,
): void {
  const g = scene.add.graphics();

  // ── 小猪（左下角）──
  const pigX = kbX - 3, pigY = kbY + kbH * 0.65;
  g.fillStyle(0xFFB6C1, 1);
  g.fillEllipse(pigX + 4, pigY + 8, 28, 20);
  g.fillCircle(pigX - 6, pigY - 1, 12);
  g.fillStyle(0xFF8888, 1);
  g.fillEllipse(pigX - 15, pigY, 6, 4.5);
  g.fillStyle(0x2A2A2A, 1);
  g.fillCircle(pigX - 9, pigY - 4, 2.2);
  g.fillStyle(0xFFB6C1, 1);
  g.fillTriangle(pigX - 11, pigY - 9, pigX - 5, pigY - 9, pigX - 8, pigY - 18);
  g.fillTriangle(pigX - 1, pigY - 9, pigX + 5, pigY - 9, pigX + 2, pigY - 18);
  g.fillRect(pigX - 4, pigY + 16, 5, 9);
  g.fillRect(pigX + 7, pigY + 16, 5, 9);
  g.lineStyle(2.5, 0x2A1A0A, 0.9);
  g.strokeEllipse(pigX + 4, pigY + 8, 28, 20);
  g.strokeCircle(pigX - 6, pigY - 1, 12);
  g.lineStyle(2, 0x3A8A2A, 1);
  g.lineBetween(pigX - 16, pigY - 2, pigX - 22, pigY - 12);
  g.fillStyle(0x4AA030, 1);
  g.fillEllipse(pigX - 23, pigY - 15, 8, 5);
  g.fillEllipse(pigX - 20, pigY - 11, 6, 4);

  // ── 绵羊（键盘中间）──
  const sX = kbX + kbW * 0.55, sY = kbY + 49 * 1.2;
  g.fillStyle(0xF5F0E0, 1);
  g.fillCircle(sX, sY + 2, 10);
  g.fillCircle(sX + 6, sY, 8);
  g.fillCircle(sX - 6, sY, 8);
  g.fillCircle(sX + 3, sY + 7, 7);
  g.fillCircle(sX - 3, sY + 7, 7);
  g.fillStyle(0x3A3A3A, 1);
  g.fillCircle(sX - 10, sY - 1, 6);
  g.fillStyle(0xFFFFFF, 1);
  g.fillCircle(sX - 11, sY - 2, 2.5);
  g.fillStyle(0x1A1A1A, 1);
  g.fillCircle(sX - 11, sY - 2, 1.2);
  g.fillStyle(0x3A3A3A, 1);
  g.fillRect(sX - 5, sY + 11, 3, 7);
  g.fillRect(sX + 3, sY + 11, 3, 7);
  g.lineStyle(1.5, 0x2A1A0A, 0.6);
  g.strokeCircle(sX, sY + 2, 10);

  ct.add(g);

  // ── 橘猫（池塘旁钓鱼）──
  const catX = pondX + pondW + 5;
  const catY = pondTopY + pondH;
  const catImg = scene.add.image(catX, catY, "cat-fishing").setOrigin(0.5, 1);
  catImg.setDisplaySize(50, 55);
  ct.add(catImg);

  // ── 鱼竿 + 鱼线 ──
  const rodG = scene.add.graphics();
  const rodTipX = pondX + pondW * 0.5;
  const rodTipY = pondTopY - 15;
  rodG.lineStyle(2.5, 0x8B6914, 1);
  rodG.beginPath();
  rodG.moveTo(catX - 15, catY - 30);
  rodG.lineTo(catX - 22, catY - 55);
  rodG.lineTo(rodTipX, rodTipY);
  rodG.strokePath();
  rodG.lineStyle(1, 0xCCCCCC, 0.7);
  rodG.lineBetween(rodTipX, rodTipY, rodTipX, pondTopY + pondH * 0.4);
  rodG.fillStyle(0xFF4444, 1);
  rodG.fillCircle(rodTipX, pondTopY + pondH * 0.4, 3);
  rodG.fillStyle(0xFFFFFF, 1);
  rodG.fillCircle(rodTipX, pondTopY + pondH * 0.4 - 2, 1.5);
  ct.add(rodG);

  // ── 水桶 ──
  const bucketG = scene.add.graphics();
  bucketG.fillStyle(0x888888, 0.8);
  bucketG.fillRect(catX + 10, catY - 12, 9, 12);
  bucketG.lineStyle(1.5, 0x555555, 1);
  bucketG.strokeRect(catX + 10, catY - 12, 9, 12);
  bucketG.lineStyle(1.5, 0x666666, 1);
  bucketG.beginPath();
  bucketG.moveTo(catX + 11, catY - 12);
  bucketG.lineTo(catX + 14.5, catY - 17);
  bucketG.lineTo(catX + 18, catY - 12);
  bucketG.strokePath();
  ct.add(bucketG);
}
