import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each test file gets its own in-memory libsql DB (see database/test-helpers.ts),
    // so tests never touch the real Turso DB. Keep them single-threaded per file —
    // the in-memory DB isn't shared across workers anyway, and admin-foundation
    // tests are fast enough this isn't a bottleneck.
    fileParallelism: true,
    isolate: true,
  },
});
