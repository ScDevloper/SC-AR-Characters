import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

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
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist/github-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
