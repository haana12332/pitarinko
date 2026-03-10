import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path"; // パスモジュールをインポート
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4500,
    host: "0.0.0.0", // すべてのIPからアクセスを許可
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"), // パスエイリアスを設定
    },
  },
  build: {
    outDir: "build", // 出力先ディレクトリを "build" に変更
  },
});
