import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getApiKey, ARK_API_URL, DEFAULT_PARAMS, STYLE_PREFIX } from "./config.js";
import { ASSET_MANIFEST, type AssetEntry } from "./manifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "../../public/assets/.raw");

interface ApiResponse {
  data: Array<{ url: string }>;
}

/** 调用 Seedream API 生成单张图片 */
async function generateImage(prompt: string, size: string): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(ARK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...DEFAULT_PARAMS,
      prompt: `${STYLE_PREFIX}, ${prompt}`,
      size,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${text}`);
  }

  const result = (await response.json()) as ApiResponse;
  return result.data[0].url;
}

/** 下载图片到本地 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

/** 生成单个素材条目 */
async function generateEntry(entry: AssetEntry): Promise<void> {
  const rawDir = join(RAW_DIR, entry.category);
  await mkdir(rawDir, { recursive: true });

  if (entry.frames === 1) {
    console.log(`  生成 ${entry.id}...`);
    const url = await generateImage(entry.prompt, entry.apiSize);
    await downloadImage(url, join(rawDir, `${entry.id}.png`));
  } else {
    for (let i = 0; i < entry.frames; i++) {
      const framePrompt = entry.framePrompts?.[i] ?? `第${i + 1}阶段`;
      const fullPrompt = `${entry.prompt}, ${framePrompt}`;
      console.log(`  生成 ${entry.id} 帧${i}/${entry.frames}...`);
      const url = await generateImage(fullPrompt, entry.apiSize);
      await downloadImage(url, join(rawDir, `${entry.id}_frame${i}.png`));

      // API 限流：每次请求间隔 500ms
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/** 主入口 */
export async function generate(filter?: string): Promise<void> {
  const entries = filter
    ? ASSET_MANIFEST.filter((e) => e.id.includes(filter) || e.category === filter)
    : [...ASSET_MANIFEST];

  console.log(`开始生成 ${entries.length} 个素材...`);

  for (const entry of entries) {
    try {
      await generateEntry(entry);
      console.log(`  [OK] ${entry.id}`);
    } catch (err) {
      console.error(`  [FAIL] ${entry.id}:`, err);
    }
  }

  console.log("原始图片生成完成。运行 npm run art:post 进行后处理。");
}
