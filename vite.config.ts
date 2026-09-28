import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Served from https://olliestevenson1.github.io/gymplan/
export default defineConfig({
  base: "/gymplan/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "gymplan",
        short_name: "gymplan",
        description: "HHF 12 Week Turnover lift log",
        start_url: "/gymplan/",
        scope: "/gymplan/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F5F6F8",
        theme_color: "#12284C",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2,woff}"],
        navigateFallback: "/gymplan/index.html",
      },
    }),
  ],
});
