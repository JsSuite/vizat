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
        index: resolve(__dirname, "demo/index.html"),
        playground: resolve(__dirname, "demo/playground.html"),
      },
    },
  },
  resolve: {
    alias: {
      vizat: resolve(__dirname, "src/index.ts"),
    },
  },
});
