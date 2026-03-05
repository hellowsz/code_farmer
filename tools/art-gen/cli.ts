import "dotenv/config";
import { generate } from "./generate.js";
import { postprocess } from "./postprocess.js";

const [,, command, filter] = process.argv;

async function main() {
  switch (command) {
    case "gen":
      await generate(filter);
      break;
    case "post":
      await postprocess(filter);
      break;
    case "all":
      await generate(filter);
      await postprocess(filter);
      break;
    default:
      console.log(`用法:
  npm run art:gen [filter]     生成原始图片
  npm run art:post [filter]    后处理（缩放+拼合）
  npm run art:all [filter]     生成 + 后处理

filter 可选：素材 id 或分类名（crops / animals / buildings / ui / ...）

示例:
  npm run art:all              全部生成
  npm run art:all crops        只生成作物
  npm run art:all crop-wheat   只生成小麦
  npm run art:gen animals      只生成动物原始图
  npm run art:post             只做后处理`);
  }
}

main().catch(console.error);
