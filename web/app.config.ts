import { defineConfig } from "@solidjs/start/config";
import mdx from "@mdx-js/rollup";

export default defineConfig({
  vite: {
    resolve: {
      conditions: []
    },
    plugins: [
      mdx({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      })
    ],
    optimizeDeps: {
      include: ["solid-mdx"]
    }
  }
});
