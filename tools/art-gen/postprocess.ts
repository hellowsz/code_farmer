import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ASSET_MANIFEST, type AssetEntry } from "./manifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "../../public/assets/.raw");
const SPRITES_DIR = join(__dirname, "../../public/assets/sprites");

/** 处理单帧素材：缩放到目标尺寸 */
async function processSingle(entry: AssetEntry): Promise<void> {
  const inputPath = join(RAW_DIR, entry.category, `${entry.id}.png`);
  const outputDir = join(SPRITES_DIR, entry.category);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${entry.id}.png`);

  await sharp(inputPath)
    .resize(entry.targetSize[0], entry.targetSize[1], {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

/** 处理多帧素材：缩放每帧后横向拼合为 Spritesheet */
async function processSpritesheet(entry: AssetEntry): Promise<void> {
  const [fw, fh] = entry.targetSize;
  const outputDir = join(SPRITES_DIR, entry.category);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${entry.id}.png`);

  const frameBuffers: Buffer[] = [];
  for (let i = 0; i < entry.frames; i++) {
    const inputPath = join(RAW_DIR, entry.category, `${entry.id}_frame${i}.png`);
    const buf = await sharp(inputPath)
      .resize(fw, fh, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    frameBuffers.push(buf);
  }

  const totalWidth = fw * entry.frames;
  const composites = frameBuffers.map((buf, i) => ({
    input: buf,
    left: i * fw,
    top: 0,
  }));

  await sharp({
    create: {
      width: totalWidth,
      height: fh,
      channels: 4 as const,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
}

/** 主入口 */
export async function postprocess(filter?: string): Promise<void> {
  const entries = filter
    ? ASSET_MANIFEST.filter((e) => e.id.includes(filter) || e.category === filter)
    : [...ASSET_MANIFEST];

  console.log(`后处理 ${entries.length} 个素材...`);

  for (const entry of entries) {
    try {
      if (entry.frames === 1) {
        await processSingle(entry);
      } else {
        await processSpritesheet(entry);
      }
      console.log(`  [OK] ${entry.id} → sprites/${entry.category}/${entry.id}.png`);
    } catch (err) {
      console.error(`  [FAIL] ${entry.id}:`, err);
    }
  }

  console.log("后处理完成。素材已输出到 public/assets/sprites/");
}
