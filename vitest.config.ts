import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // .kilo/worktrees holds git worktrees (extra checkouts of this same
    // repo) — without excluding them every test would run twice, and the
    // copies would race each other over the shared .data/ folder.
    exclude: ["node_modules", "e2e", ".next", "**/.kilo/**"],
  },
});
