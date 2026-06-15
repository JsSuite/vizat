import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "demo",
  publicDir: "../public",
  build: {
    outDir: "../dist-demo",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        playground: resolve(__dirname, "demo/playground.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@jssuite/vizat": resolve(__dirname, "src/index.ts"),
    },
  },
});
