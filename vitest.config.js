import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["js/**/*.js", "data/**/*.js"],
      // config.js is nothing but the site owner's live keys and settings.
      exclude: ["js/config.js"],
      reportsDirectory: "coverage"
    }
  }
});
