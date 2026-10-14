import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // Server modules import "server-only", which throws outside Next's server build.
    alias: {
      "server-only": new URL("./node_modules/server-only/empty.js", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Most tests create accounts freely; tests/unit/access.test.ts covers invite-only mode.
    // tests/unit/sample.test.ts covers the sample data.
    env: { NEXT_PUBLIC_OPEN_SIGNUP: "1", NEXT_PUBLIC_SAMPLE_DATA: "0" },
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
      // Needs TEST_DATABASE_URL (a throwaway Postgres database); skipped without it.
      "tests/server/**/*.test.ts",
    ],
  },
});
