// Builds src/artifact.jsx as one IIFE that expects React and ReactDOM as globals,
// so the published page loads React from cdnjs instead of inlining it.
import { defineConfig } from "vite";
import { packFile } from "./pack.config.js";

export default defineConfig({
  define: { __ARTIFACT__: "true", "process.env.NODE_ENV": '"production"' },
  // preserveSymlinks: private-packs/ may be a link to a separately cloned private repo.
  resolve: { alias: { "@pack": packFile }, preserveSymlinks: true },
  esbuild: { jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment" },
  build: {
    outDir: "dist-artifact/build",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: "src/artifact.jsx", name: "IncidentCommanderApp", formats: ["iife"], fileName: () => "app.js" },
    rollupOptions: {
      external: ["react", "react-dom/client"],
      output: { globals: { react: "React", "react-dom/client": "ReactDOM" }, assetFileNames: "app.[ext]" },
    },
  },
});
