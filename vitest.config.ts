import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
  },
  resolve: {
    alias: {
      "@jssuite/vizat": resolve(__dirname, "src/index.ts"),
    },
  },
});
