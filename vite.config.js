import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { packFile } from "./pack.config.js";

export default defineConfig({
  plugins: [react()],
  define: { __ARTIFACT__: "false" },
  // preserveSymlinks: private-packs/ may be a link to a separately cloned private repo.
  resolve: { alias: { "@pack": packFile }, preserveSymlinks: true },
  base: "./",
  test: { environment: "node", include: ["test/**/*.test.js"] },
});
