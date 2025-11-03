import path from "path";
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

const resolve = {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
};

const plugins = [
  react({
    plugins: [["@lingui/swc-plugin", {}]],
  }),
  lingui(),
];

export default defineConfig({
  test: {
    projects: [
      {
        plugins,
        resolve,
        test: {
          name: "actions",
          environment: "node",
          include: ["src/tests/actions/**/*.test.ts"],
        },
      },
      {
        plugins,
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
