#!/usr/bin/env node
/**
 * Model feature analyzer.
 *
 * Tripo exports arrive as a single unnamed mesh, so there are no part names to
 * match a hotspot against. This derives the features from the geometry itself:
 * a height field over the footprint, plus facade projections that reveal what
 * stands proud of a wall (pillars, gate jambs) which a top-down map hides
 * under the roof it sits below.
 *
 * Usage:
 *   node tools/analyze-model.cjs <model.glb>            overview + height map
 *   node tools/analyze-model.cjs <model.glb> --front    facade, front (max z)
 *   node tools/analyze-model.cjs <model.glb> --side     facade, right (max x)
 *   node tools/analyze-model.cjs <model.glb> --protrude y0 y1 [axis]
 *                                                      protrusion profile:
 *                                                      finds pillars/jambs
 */
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');

// published models are Draco-compressed with WebP textures
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
let ready = null;
const ioReady = () => (ready ??= draco3d.createDecoderModule().then(
  (d) => io.registerDependencies({ 'draco3d.decoder': d })));

async function points(file) {
  await ioReady();
  const doc = await io.read(file);
  const pts = [];
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()) {
      const a = p.getAttribute('POSITION');
      if (!a) continue;
      const arr = a.getArray();
      for (let i = 0; i < arr.length; i += 3) pts.push([arr[i], arr[i + 1], arr[i + 2]]);
    }
  if (!pts.length) throw new Error('no POSITION data in ' + file);
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of pts) for (let c = 0; c < 3; c++) {
    if (p[c] < mn[c]) mn[c] = p[c];
    if (p[c] > mx[c]) mx[c] = p[c];
  }
  const size = mx.map((v, i) => v - mn[i]);
  // normalised to the same 0..1 box space the hotspot anchors use
  const nrm = pts.map(p => [
    (p[0] - mn[0]) / size[0],
    (p[1] - mn[1]) / size[1],
    (p[2] - mn[2]) / size[2],
  ]);
  return { pts: nrm, size, count: pts.length };
}

const CH = ' .:-=+*#%@';

function heightMap(pts, N) {
  const h = new Float32Array(N * N).fill(-1);
  for (const [x, y, z] of pts) {
    const i = Math.min(N - 1, Math.floor(x * N));
    const j = Math.min(N - 1, Math.floor(z * N));
    if (y > h[j * N + i]) h[j * N + i] = y;
  }
  return h;
}

/** Where is the built mass actually centred? The bounding box is dragged
 *  off-centre by outlying courtyard objects, so a pin placed at x=0.5
 *  misses the building it names. */
function massCentre(pts) {
  let sx = 0, sz = 0;
  for (const [x, , z] of pts) { sx += x; sz += z; }
  return [sx / pts.length, sz / pts.length];
}

async function main() {
  const file = process.argv[2];
  const mode = process.argv[3];
  const { pts, size, count } = await points(file);
  const [cx, cz] = massCentre(pts);

  if (mode === '--protrude') {
    const y0 = +process.argv[4], y1 = +process.argv[5];
    const axis = process.argv[6] || 'z';
    const N = 200;
    const prof = new Float32Array(N).fill(-1);
    for (const [x, y, z] of pts) {
      if (y < y0 || y > y1) continue;
      const across = axis === 'z' ? x : z;
      const depth = axis === 'z' ? z : x;
      const i = Math.min(N - 1, Math.floor(across * N));
      if (depth > prof[i]) prof[i] = depth;
    }
    // a pillar is a local maximum standing proud of the wall behind it
    const peaks = [];
    for (let i = 2; i < N - 2; i++) {
      if (prof[i] < 0) continue;
      const local = prof[i];
      if (local > prof[i - 2] + 0.004 && local >= prof[i + 2] - 0.0005 &&
          local > prof[i - 2] && local >= prof[i + 1]) peaks.push({ at: (i + 0.5) / N, depth: local });
    }
    console.log(`protrusion along ${axis === 'z' ? 'x' : 'z'}, band y=${y0}..${y1}`);
    for (let i = 0; i < N; i++) if (prof[i] > 0)
      console.log(`  ${((i + 0.5) / N).toFixed(4)}  ${prof[i].toFixed(4)} ${'#'.repeat(Math.round(prof[i] * 40))}`);
    console.log('\nlocal maxima (candidate pillars / jambs):');
    peaks.forEach(p => console.log(`  at=${p.at.toFixed(4)} depth=${p.depth.toFixed(4)}`));
    return;
  }

  if (mode === '--front' || mode === '--side') {
    const N = 100;
    const front = new Float32Array(N * N).fill(-1);
    for (const [x, y, z] of pts) {
      const across = mode === '--front' ? x : z;
      const depth = mode === '--front' ? z : x;
      const i = Math.min(N - 1, Math.floor(across * N));
      const j = Math.min(N - 1, Math.floor(y * N));
      if (depth > front[j * N + i]) front[j * N + i] = depth;
    }
    console.log(`${mode === '--front' ? 'FRONT (looking -z)' : 'SIDE (looking -x)'} — symbol = how far toward viewer`);
    for (let j = N - 1; j >= 0; j--) {
      let row = '';
      for (let i = 0; i < N; i++) {
        const d = front[j * N + i];
        row += d < 0 ? ' ' : CH[Math.min(9, Math.floor(d * 10))];
      }
      if (row.trim()) console.log(`y=${((j + 0.5) / N).toFixed(2)} ${row}`);
    }
    return;
  }

  const N = 46;
  const h = heightMap(pts, N);
  console.log(`=== ${file}`);
  console.log(`verts ${count}  size ${size.map(v => v.toFixed(2)).join(' x ')}`);
  console.log(`bbox centre is (0.5,0.5) but the MASS centre is x=${cx.toFixed(3)} z=${cz.toFixed(3)}`);
  console.log(`  → anchors meant for "the middle of the building" belong near that, not 0.5\n`);
  console.log('TOP-DOWN height map (rows: z 0→1, cols: x 0→1)');
  for (let j = 0; j < N; j++) {
    let row = '';
    for (let i = 0; i < N; i++) {
      const v = h[j * N + i];
      row += v < 0 ? ' ' : CH[Math.min(9, Math.floor(v * 10))];
    }
    console.log('  ' + row);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
