import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { copyFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./github-pages", import.meta.url)),
  base: "/SC-AR-Characters/",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  plugins: [
    react(),
    {
      // GitHub Pages serves 404.html for any path with no matching file.
      // Making it a copy of index.html turns every unknown path into an SPA
      // entry point, so /ar and /qr resolve instead of hitting GitHub's 404.
      name: "spa-404-fallback",
      closeBundle() {
        const dir = fileURLToPath(new URL("./dist/github-pages", import.meta.url));
        copyFileSync(join(dir, "index.html"), join(dir, "404.html"));
      },
    },
  ],
  build: {
    outDir: fileURLToPath(new URL("./dist/github-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
