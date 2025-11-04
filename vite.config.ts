import path from "node:path";
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/dungeonmix/",
  plugins: [
    react({
      plugins: [["@lingui/swc-plugin", {}]],
    }),
    lingui(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "note-dark.png", "note-light.png"],
      manifest: {
        name: "DungeonMix",
        short_name: "DungeonMix",
        description: "An app for creating audio boards for your game sessions",
        theme_color: "#D5D8DE",
        background_color: "#0E0F11",
        display: "standalone",
        scope: "/dungeonmix/",
        start_url: "/dungeonmix/",
        orientation: "any",
        icons: [
          {
            src: "/dungeonmix/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/dungeonmix/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/dungeonmix/icon-192x192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/dungeonmix/icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["entertainment", "games", "utilities"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        runtimeCaching: [
          {
            handler: "StaleWhileRevalidate",
            urlPattern: /.*/,
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
