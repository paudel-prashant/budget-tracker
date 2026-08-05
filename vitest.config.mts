import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/domain/**", "lib/validation/**", "lib/currency/**", "lib/forecasting/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
});
