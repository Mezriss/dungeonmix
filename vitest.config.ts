import path from "path";
import { defineConfig } from "vitest/config";

const resolve = {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve,
        test: {
          name: "actions",
          environment: "node",
          include: ["src/tests/actions/**/*.test.ts"],
        },
      },
      {
        resolve,
        test: {
          globals: true,
          name: "default",
          environment: "happy-dom",
          include: ["src/tests/**/*.test.ts"],
          exclude: ["src/tests/actions/**"],
        },
      },
    ],
  },
});
