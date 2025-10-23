import { defineConfig } from "@solidjs/start/config";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default defineConfig({
  vite: {
    resolve: {
      conditions: []
    },
    plugins: [
      {
        ...mdx({
          jsx: true,
          jsxImportSource: "solid-js",
          providerImportSource: "solid-mdx",
          remarkPlugins: [remarkFrontmatter, remarkGfm],
          rehypePlugins: [rehypeHighlight],
        }),
        enforce: "pre"
      }
    ],
    optimizeDeps: {
      include: ["solid-mdx"]
    }
  },
  extensions: ["mdx", "md"],
});
