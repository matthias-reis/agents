import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "~": srcDir
    }
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    css: true,
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"]
    }
  }
});
