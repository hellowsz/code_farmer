import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 开发服务器配置，Tauri 会连接到此端口
  server: {
    port: 1420,
    strictPort: true,
  },
  // 清空输出目录
  clearScreen: false,
  // 环境变量前缀
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    // Tauri 在 Windows 上使用 Chromium, macOS 上使用 WebKit
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
