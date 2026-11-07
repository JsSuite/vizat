import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VIZAT",
      fileName: "vizat",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      output: { exports: "named" },
    },
  },
});
