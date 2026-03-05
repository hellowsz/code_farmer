export const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
export const ARK_MODEL = "doubao-seedream-5-0-260128";

/** 从环境变量读取，绝不硬编码 */
export function getApiKey(): string {
  const key = process.env.ARK_API_KEY;
  if (!key) {
    throw new Error("缺少环境变量 ARK_API_KEY，请在 .env 文件中配置");
  }
  return key;
}

/** 所有素材共用的风格 prompt 前缀 */
export const STYLE_PREFIX =
  "手绘卡通风格, 粗黑色线条描边, 暖色调, 圆润造型, 可爱治愈, 游戏素材, 纯色背景";

/** API 请求通用参数 */
export const DEFAULT_PARAMS = {
  model: ARK_MODEL,
  sequential_image_generation: "disabled",
  response_format: "url",
  stream: false,
  watermark: false,
} as const;
