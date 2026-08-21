import path from "path"
import { createRequire } from "module"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

const require = createRequire(import.meta.url)

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
  optimizeDeps: {
    // three-mesh-bvh's worker helper (src/three/engine.ts's upgradeRaycastMeshes)
    // spins up a Worker via `new URL('./generateMeshBVH.worker.js', import.meta.url)`
    // relative to its own module. Vite's dep pre-bundler flattens the package
    // into a single file under node_modules/.vite/deps/ before that URL is
    // ever evaluated, so import.meta.url points at the bundle instead of the
    // package's real location and the worker file 404s. Excluding both entry
    // points serves them as real, unbundled ESM straight from node_modules,
    // where the relative worker URL resolves correctly.
    // "three" itself is excluded too: it's aliased below to three/webgpu's
    // file, and Vite's pre-alias plugin re-optimizes an aliased specifier's
    // *resolved target* under its own cache entry when that target is
    // optimizable - which silently recreates the exact two-instances problem
    // the alias exists to prevent. Excluding it forces the real file to be
    // served directly, so the alias's job (one shared module instance) actually
    // holds.
    exclude: ["three-mesh-bvh", "three-mesh-bvh/worker", "three", "three/webgpu"],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Some third-party hosts (e.g. the desamenkomst.nl uploader) don't
        // reliably serve Vite's default assets/ subfolder — files inside it
        // 404 even though sibling folders like gltf/ or per-structure img
        // folders work fine. Flattening build output to the site root
        // sidesteps that entirely: every file sits next to index.html.
        //
        // No content hash in the filenames: the desamenkomst.nl uploader
        // renames on conflict instead of overwriting, so a hash that changes
        // every build meant every re-upload left the previous build's files
        // behind (multiple index-*.html/js/css piling up). Fixed names mean
        // a re-upload just replaces the same files.
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
        manualChunks: {
          three: ["three", "three/webgpu", "three/tsl", "three-mesh-bvh"],
          gsap: ["gsap"],
        },
      },
    },
  },
  resolve: {
    // Array form (not the plain-object shorthand) because the "three" entry
    // below needs a RegExp `find` - see its comment.
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // engine.ts renders with three/webgpu, but three-mesh-bvh and every
      // three/addons module (GLTFLoader, OrbitControls, DRACOLoader,
      // OBJLoader) import plain 'three' instead. Vite pre-bundles 'three'
      // and 'three/webgpu' as separate dep entries, so without this alias
      // they end up as two distinct module instances in the browser even
      // though they're the same on-disk package (surfaced as three.js's own
      // "Multiple instances of Three.js being imported" warning) - classes
      // like Mesh from one instance then fail `instanceof` checks against
      // the other. three-mesh-bvh's acceleratedRaycast hits exactly this:
      // its `this instanceof Mesh` check (Mesh captured from plain 'three')
      // fails for a three/webgpu Mesh once boundsTree is missing, throwing
      // "BVH: Fallback raycast function not found." Aliasing 'three' itself
      // to three/webgpu's entry makes every import - ours and every
      // dependency's - resolve to the one instance.
      // A RegExp `find` (not a string with a literal trailing "$", which
      // Vite's alias matcher treats as plain startsWith on that literal
      // string - it never actually matches) pins this to the exact "three"
      // specifier only. Without the anchor, Vite also rewrites
      // "three/addons/..." and "three/webgpu" themselves (both start with
      // "three"), pointing them at a file path with nonsense subpaths
      // appended and breaking dep pre-bundling.
      { find: /^three$/, replacement: require.resolve("three/webgpu") },
    ],
  },
});
