import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /the3d-bible/, so that's the default.
  // The upload-package workflow overrides this to './' (relative) so the
  // build works when dropped into any subfolder on any other host.
  base: process.env.VITE_BASE || '/the3d-bible/',
  plugins: [inspectAttr(), react()],
  server: { strictPort: true,
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Some third-party hosts (e.g. the desamenkomst.nl uploader) don't
        // reliably serve Vite's default assets/ subfolder — files inside it
        // 404 even though sibling folders like gltf/ or per-structure img
        // folders work fine. Flattening build output to the site root
        // sidesteps that entirely: every hashed file sits next to index.html.
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash][extname]",
        manualChunks: {
          three: ["three", "three/webgpu", "three/tsl", "three-mesh-bvh"],
          gsap: ["gsap"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
