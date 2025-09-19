import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
});
