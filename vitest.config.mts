import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve "@/..." imports from tsconfig.json
    tsconfigPaths: true,
    alias: {
      // "server-only" throws outside the React server bundle; tests run plain Node
      "server-only": new URL("./tests/stubs/empty.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
