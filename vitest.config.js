import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    mockReset: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // all + include: report every src file, not just ones a test loaded
      all: true,
      include: ["src/**/*.ts"],
      // acquire.ts/release.ts are thin wiring that call run() on import; the
      // integration CI jobs exercise them against a real bucket instead
      exclude: ["src/acquire.ts", "src/release.ts"],
      // Remove to stop enforcing coverage (also revert ci.yml's pnpm coverage -> pnpm test)
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
