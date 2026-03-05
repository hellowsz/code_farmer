export interface AssetEntry {
  /** 素材唯一 id，也是输出文件名（不含扩展名） */
  readonly id: string;
  /** 分类目录 */
  readonly category: "crops" | "animals" | "buildings" | "ui" | "backgrounds" | "keys" | "particles";
  /** 发给 Seedream 的 prompt（不含风格前缀，会自动拼接） */
  readonly prompt: string;
  /** API 请求的 size 参数 */
  readonly apiSize: string;
  /** 生成后需要裁剪/缩放到的最终尺寸 [width, height] */
  readonly targetSize: [number, number];
  /** Spritesheet 帧数，1 表示单图 */
  readonly frames: number;
  /** 多帧时，每帧的 prompt 后缀（描述不同阶段） */
  readonly framePrompts?: readonly string[];
}

export const ASSET_MANIFEST: readonly AssetEntry[] = [
  // ─── 背景 ───
  {
    id: "bg-sky", category: "backgrounds",
    prompt: "蓝天白云, 晴朗天气, 卡通天空背景, 横版, 渐变蓝色",
    apiSize: "2560x1440", targetSize: [960, 300], frames: 1,
  },
  {
    id: "bg-grass", category: "backgrounds",
    prompt: "绿色草地, 自然草坪, 横版地面, 俯视角度, 嫩绿色",
    apiSize: "2560x1440", targetSize: [960, 240], frames: 1,
  },

  // ─── 键盘底板 ───
  {
    id: "farm-board", category: "keys",
    prompt: "游戏键盘形状的农场岛, 泥土地面, 木头边框, 木栅栏围绕, 俯视角, 圆角矩形",
    apiSize: "2560x1440", targetSize: [860, 320], frames: 1,
  },

  // ─── 键帽纹理 ───
  {
    id: "key-soil", category: "keys",
    prompt: "一小块泥土地, 翻过的棕色土壤, 正方形, 微微凸起, 游戏图标",
    apiSize: "1920x1920", targetSize: [64, 64], frames: 1,
  },
  {
    id: "key-grass", category: "keys",
    prompt: "一小块绿色草地, 嫩绿色草坪, 正方形, 生机勃勃, 游戏图标",
    apiSize: "1920x1920", targetSize: [64, 64], frames: 1,
  },
  {
    id: "key-modifier", category: "keys",
    prompt: "一小块木板地面, 浅棕色木纹, 正方形, 功能按键, 游戏图标",
    apiSize: "1920x1920", targetSize: [64, 64], frames: 1,
  },

  // ─── 作物（每种多帧，各阶段分别生成后拼合） ───
  {
    id: "crop-wheat", category: "crops",
    prompt: "小麦作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 4,
    framePrompts: ["刚播种的泥土小坑, 种子", "冒出的绿色小苗, 两片叶子", "长高的绿色麦苗, 茂盛", "成熟的金黄色麦穗, 饱满"],
  },
  {
    id: "crop-carrot", category: "crops",
    prompt: "胡萝卜作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 4,
    framePrompts: ["刚播种的泥土小坑, 种子", "冒出的绿色小苗", "茂盛的绿色胡萝卜叶", "露出橙色胡萝卜头, 成熟"],
  },
  {
    id: "crop-tomato", category: "crops",
    prompt: "番茄作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "番茄植株长高", "开出黄色小花", "结出红色番茄果实, 成熟"],
  },
  {
    id: "crop-corn", category: "crops",
    prompt: "玉米作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "玉米秆长高", "玉米秆顶部有花穗", "金黄色玉米棒, 成熟"],
  },
  {
    id: "crop-eggplant", category: "crops",
    prompt: "茄子作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 5,
    framePrompts: ["泥土种子", "绿色小苗", "茄子植株", "开出紫色花", "挂着紫色茄子, 成熟"],
  },
  {
    id: "crop-strawberry", category: "crops",
    prompt: "草莓作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "草莓叶片展开", "开出白色小花", "结出青色小果", "鲜红草莓果实, 成熟"],
  },
  {
    id: "crop-pumpkin", category: "crops",
    prompt: "南瓜作物", apiSize: "1920x1920", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "南瓜藤蔓展开", "开出黄色大花", "结出绿色小南瓜", "橙色大南瓜, 成熟"],
  },
  {
    id: "crop-sunflower", category: "crops",
    prompt: "向日葵", apiSize: "1920x1920", targetSize: [48, 48], frames: 6,
    framePrompts: ["泥土种子", "绿色小苗", "向日葵茎秆长高", "顶部长出花苞", "花苞打开一半", "盛开的金色向日葵, 成熟"],
  },

  // ─── 动物（4 帧行走） ───
  {
    id: "animal-cat", category: "animals",
    prompt: "橘色小猫", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿行走", "站立侧面", "迈右腿行走"],
  },
  {
    id: "animal-dog", category: "animals",
    prompt: "棕色小狗", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿行走", "站立侧面", "迈右腿行走"],
  },
  {
    id: "animal-rabbit", category: "animals",
    prompt: "白色兔子", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["蹲坐侧面", "跳起准备", "跳到空中", "落地"],
  },
  {
    id: "animal-chicken", category: "animals",
    prompt: "黄色小鸡", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左脚", "站立侧面", "迈右脚"],
  },
  {
    id: "animal-sheep", category: "animals",
    prompt: "白色绵羊", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },
  {
    id: "animal-cow", category: "animals",
    prompt: "黑白花纹奶牛", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },
  {
    id: "animal-pig", category: "animals",
    prompt: "粉色小猪", apiSize: "1920x1920", targetSize: [64, 64], frames: 4,
    framePrompts: ["站立侧面", "迈左腿", "站立侧面", "迈右腿"],
  },

  // ─── 装饰建筑 ───
  {
    id: "building-barn", category: "buildings",
    prompt: "红色小谷仓, 尖顶, 木门, 农场建筑",
    apiSize: "1920x1920", targetSize: [128, 128], frames: 1,
  },
  {
    id: "building-clock", category: "buildings",
    prompt: "小型钟楼, 木头结构, 顶部有时钟, 农场建筑",
    apiSize: "1920x1920", targetSize: [96, 128], frames: 1,
  },
  {
    id: "building-tree", category: "buildings",
    prompt: "一棵大绿树, 圆形树冠, 粗树干, 农场大树",
    apiSize: "1920x1920", targetSize: [128, 128], frames: 1,
  },
  {
    id: "building-fence", category: "buildings",
    prompt: "一段木栅栏, 白色木头栅栏, 三根竖柱两根横杠",
    apiSize: "1920x1920", targetSize: [96, 64], frames: 1,
  },
  {
    id: "building-mailbox", category: "buildings",
    prompt: "红色邮箱, 木杆上的信箱, 农场邮箱",
    apiSize: "1920x1920", targetSize: [48, 80], frames: 1,
  },
  {
    id: "building-well", category: "buildings",
    prompt: "石头水井, 木桶和绳子, 农场水井",
    apiSize: "1920x1920", targetSize: [80, 96], frames: 1,
  },
  {
    id: "building-windvane", category: "buildings",
    prompt: "风向标, 公鸡造型, 金属杆上, 农场装饰",
    apiSize: "1920x1920", targetSize: [48, 96], frames: 1,
  },
  {
    id: "building-signpost", category: "buildings",
    prompt: "木制指路牌, 两块木板箭头, 农场标识",
    apiSize: "1920x1920", targetSize: [64, 96], frames: 1,
  },

  // ─── UI 元素 ───
  {
    id: "ui-coin", category: "ui",
    prompt: "一枚金色硬币, 游戏金币图标, 正面有星号",
    apiSize: "1920x1920", targetSize: [32, 32], frames: 1,
  },
  {
    id: "ui-panel", category: "ui",
    prompt: "棕色木质面板, 游戏 UI 背景板, 圆角矩形, 木纹",
    apiSize: "1920x1920", targetSize: [256, 192], frames: 1,
  },
  {
    id: "shop-tent", category: "ui",
    prompt: "红白条纹帐篷, 商店摊位, 农场市集, 正面视角",
    apiSize: "1920x1920", targetSize: [192, 160], frames: 1,
  },
  {
    id: "tomato-timer", category: "ui",
    prompt: "一个大番茄造型的计时器, 红色番茄, 顶部有绿色叶子, 正面有时钟表盘",
    apiSize: "1920x1920", targetSize: [96, 96], frames: 1,
  },

  // ─── 粒子 ───
  {
    id: "particle-coin", category: "particles",
    prompt: "小金币, 迷你游戏粒子, 闪亮",
    apiSize: "1920x1920", targetSize: [16, 16], frames: 1,
  },
  {
    id: "particle-leaf", category: "particles",
    prompt: "绿色小叶子, 迷你游戏粒子, 飘落",
    apiSize: "1920x1920", targetSize: [16, 16], frames: 1,
  },
  {
    id: "particle-star", category: "particles",
    prompt: "黄色小星星, 迷你游戏粒子, 闪烁",
    apiSize: "1920x1920", targetSize: [16, 16], frames: 1,
  },
];
