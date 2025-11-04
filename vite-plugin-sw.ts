import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

export function injectServiceWorker(): Plugin {
  return {
    name: "inject-service-worker",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const swTemplatePath = path.resolve(__dirname, "public/sw.js");
      const swOutputPath = path.resolve(distDir, "sw.js");

      // Read all files in dist directory recursively
      const getFiles = (dir: string, baseDir: string = dir): string[] => {
        const files: string[] = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            files.push(...getFiles(fullPath, baseDir));
          } else {
            // Get relative path from dist and convert to URL path
            const relativePath = path.relative(baseDir, fullPath);
            files.push(relativePath.replace(/\\/g, "/"));
          }
        }
        return files;
      };

      // Get all build artifacts
      const buildFiles = getFiles(distDir)
        .filter((file) => {
          // Exclude service worker itself and source maps
          return file !== "sw.js" && !file.endsWith(".map");
        })
        .map((file) => `/dungeonmix/${file}`);

      // Read the service worker template
      let swContent = fs.readFileSync(swTemplatePath, "utf-8");

      // Create the assets array as a formatted string
      const assetsArray = buildFiles.map((file) => `  "${file}",`).join("\n");

      // Replace the placeholder with actual build files
      swContent = swContent.replace(
        "// __BUILD_ASSETS__",
        assetsArray.trimEnd(),
      );

      // Write the modified service worker to dist
      fs.writeFileSync(swOutputPath, swContent);

      console.log(
        `✓ Service worker generated with ${buildFiles.length} cached assets`,
      );
    },
  };
}
