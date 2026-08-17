#!/usr/bin/env node
// Guards against the class of bug where a heavy new .glb gets added to
// public/models/ without a corresponding public/models/mobile/ variant  -
// on a low-memory device (see IS_LOW_MEMORY_DEVICE / LOW_MEMORY_MODEL_BYTE_LIMIT
// in src/three/engine.ts) that model then refuses to load at all instead of
// degrading to the lighter version. Every model over the same byte limit the
// engine itself enforces must have a mobile counterpart, or the build fails.
import { readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const MODELS_DIR = join(ROOT, "public/models");
const MOBILE_DIR = join(MODELS_DIR, "mobile");

// Keep in sync with LOW_MEMORY_MODEL_BYTE_LIMIT in src/three/engine.ts
const LOW_MEMORY_MODEL_BYTE_LIMIT = 90 * 1024 * 1024;

const glbFiles = readdirSync(MODELS_DIR).filter((f) => f.endsWith(".glb"));

const missing = [];
for (const name of glbFiles) {
  const full = join(MODELS_DIR, name);
  const { size } = statSync(full);
  if (size > LOW_MEMORY_MODEL_BYTE_LIMIT && !existsSync(join(MOBILE_DIR, name))) {
    missing.push({ name, mb: (size / (1024 * 1024)).toFixed(0) });
  }
}

if (missing.length) {
  console.error("FAIL - the following models exceed the mobile size limit but have no public/models/mobile/ variant:");
  for (const { name, mb } of missing) {
    console.error(`  - ${name} (${mb}MB, limit is 90MB)`);
  }
  console.error("\nOn a low-memory device these fail to load entirely instead of falling back.");
  console.error("Compress a mobile variant (Draco geometry + WebP textures) into public/models/mobile/, e.g.:");
  console.error("  npx gltf-transform optimize public/models/<name>.glb public/models/mobile/<name>.glb --compress draco --texture-compress webp");
  process.exit(1);
}

console.log(`OK - all ${glbFiles.length} models are mobile-safe (under 90MB, or have a mobile/ variant).`);
