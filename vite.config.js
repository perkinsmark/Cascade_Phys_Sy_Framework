import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { packFile } from "./pack.config.js";

export default defineConfig({
  plugins: [react()],
  define: { __ARTIFACT__: "false" },
  resolve: { alias: { "@pack": packFile } },
  base: "./",
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
