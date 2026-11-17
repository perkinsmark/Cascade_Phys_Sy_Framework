// Builds src/artifact.jsx as one IIFE that expects React and ReactDOM as globals,
// so the published page loads React from cdnjs instead of inlining it.
import { defineConfig } from "vite";

export default defineConfig({
  define: { __ARTIFACT__: "true", "process.env.NODE_ENV": '"production"' },
  esbuild: { jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", jsxInject: "" },
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
