#!/usr/bin/env node
/**
 * Audits every hotspot against the geometry it is supposed to sit on.
 *
 * The anchors are authored by hand in normalised box space, so nothing stops
 * one from pointing at empty air beside the building, or at the courtyard
 * floor when it names the sanctuary. This loads each GLB, builds a height
 * field, and reports anchors that miss.
 *
 * Run after changing a model or adding a dwelling:
 *   node tools/audit-hotspots.cjs
 */
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const fs = require('fs');
const path = require('path');

// Published models are Draco-compressed with WebP textures. The audit only
// needs POSITION data, but the reader still refuses a file whose extensions
// it does not know, so register them.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
let ioReady = null;
async function readerReady() {
  if (!ioReady) {
    ioReady = draco3d.createDecoderModule().then((decoder) => {
      io.registerDependencies({ 'draco3d.decoder': decoder });
    });
  }
  return ioReady;
}

const N = 60;

/** OBJ is plain text; read only the v-lines. Some dwellings ship an .obj
 *  rather than a .glb, and they need auditing just the same. */
function objPoints(file) {
  const pts = [];
  const src = fs.readFileSync(file, 'utf8');
  const re = /^v\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)/gm;
  let m;
  while ((m = re.exec(src))) pts.push([+m[1], +m[2], +m[3]]);
  return pts;
}

async function field(glb) {
  await readerReady();
  let pts = [];
  if (glb.endsWith('.obj')) {
    pts = objPoints(glb);
  } else {
    const doc = await io.read(glb);
    for (const m of doc.getRoot().listMeshes())
      for (const p of m.listPrimitives()) {
        const a = p.getAttribute('POSITION');
        if (!a) continue;
        const arr = a.getArray();
        for (let i = 0; i < arr.length; i += 3) pts.push([arr[i], arr[i + 1], arr[i + 2]]);
      }
  }
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of pts) for (let c = 0; c < 3; c++) {
    if (p[c] < mn[c]) mn[c] = p[c];
    if (p[c] > mx[c]) mx[c] = p[c];
  }
  const s = mx.map((v, i) => v - mn[i]);
  const h = new Float32Array(N * N).fill(-1);
  for (const p of pts) {
    const x = (p[0] - mn[0]) / s[0], y = (p[1] - mn[1]) / s[1], z = (p[2] - mn[2]) / s[2];
    const i = Math.min(N - 1, Math.floor(x * N)), j = Math.min(N - 1, Math.floor(z * N));
    if (y > h[j * N + i]) h[j * N + i] = y;
  }
  return {
    h,
    at(x, z) {
      const i = Math.min(N - 1, Math.floor(x * N)), j = Math.min(N - 1, Math.floor(z * N));
      const v = h[j * N + i];
      if (v >= 0) return v;
      // A slender feature  -  a free-standing pillar  -  can fall between grid
      // cells and read as empty. Before calling it a miss, look at the
      // neighbours: geometry touching any of them means the anchor is on the
      // model, just on something thinner than one cell.
      let best = -1;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const a = i + di, b = j + dj;
          if (a < 0 || b < 0 || a >= N || b >= N) continue;
          if (h[b * N + a] > best) best = h[b * N + a];
        }
      return best;
    },
    /** highest point anywhere, to judge "is this the tall mass or the floor" */
    peak: Math.max(...h),
  };
}

(async () => {
  const dir = 'src/data/structures/nl';
  let problems = 0, checked = 0;

  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts')) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const mp = src.match(/modelPath: "([^"]+)"/);
    if (!mp) continue;
    // A dwelling may ship several models for the same hotspot list (an
    // exterior and a cutaway, say). They are separate exports with their own
    // bounds and orientation, so one anchor cannot be assumed to fit both  -
    // every variant has to be checked against the same anchors.
    const paths = [mp[1], ...[...src.matchAll(/path: "([^"]+)"/g)].map(m => m[1])];
    const models = [...new Set(paths.map(p => ("public" + p).replace(/\?.*$/, "")))];

    // a variant may override anchors; audit each model against the ones it
    // will actually be shown with, not against the defaults it never uses
    const overridesFor = (glb) => {
      const base = path.basename(glb);
      // Split the variant list into entries first. Matching the filename
      // inside the whole file would let "tabernacle.glb" match the entry for
      // "tabernacle_inside.glb" and steal its anchors.
      const entries = src.split(/\{\s*id: "/).slice(1);
      const entry = entries.find((e) => {
        const pm = e.match(/path: "([^"]+)"/);
        return pm && path.basename(pm[1].replace(/\?.*$/, '')) === base;
      });
      if (!entry) return null;
      const block = entry.match(/anchors: \{([\s\S]*?)\n\s*\}/);
      if (!block) return null;
      const map = {};
      for (const m of block[1].matchAll(/(\w+):\s*(\[[^\]]*\]|null)/g))
        map[m[1]] = m[2] === 'null' ? null : m[2].slice(1, -1).split(',').map(Number);
      return map;
    };

    for (const glb of models) {
    const ov = overridesFor(glb);
    if (!fs.existsSync(glb)) { console.log(`${f}: model missing ${glb}`); continue; }

    let fld;
    try { fld = await field(glb); }
    catch (e) { console.log(`${f}: cannot read model (${e.message})`); continue; }

    console.log(`\n── ${f}  [${path.basename(glb)}]  (peak height ${fld.peak.toFixed(2)})`);
    const re = /id: "([^"]+)",\s*\n\s*title: "([^"]*)"[\s\S]{0,700}?anchor: \[([^\]]+)\],(?:\s*\n\s*snap: "([a-z]+)")?/g;
    let m;
    while ((m = re.exec(src))) {
      const [, id, title, vec, snap] = m;
      if (ov && ov[id] === null) continue;                    // hidden here
      const [x, y, z] = (ov && ov[id]) ? ov[id] : vec.split(',').map(v => parseFloat(v));
      const h = fld.at(x, z);
      checked++;
      let verdict = 'ok';
      if (h < 0) { verdict = 'MISS — anchor is over empty space, pin floats in air'; problems++; }
      else if (snap === 'roof' && h < fld.peak * 0.45) {
        // a "roof" pin resolving onto near-ground means the anchor drifted off
        // the mass it names and onto the court or terrain beside it
        verdict = `LOW — snap:"roof" but the surface here is only h=${h.toFixed(2)} of ${fld.peak.toFixed(2)}`; problems++;
      }
      else if (y > 0.05 && Math.abs(y - h) > 0.45 && snap !== 'wall') {
        verdict = `FAR — authored y=${y} is far from the ${h.toFixed(2)} surface it lands on`; problems++;
      }
      console.log(`   ${verdict === 'ok' ? ' ' : '!'} ${id.padEnd(20)} [${x}, ${y}, ${z}] snap=${(snap || '-').padEnd(5)} surface=${h < 0 ? '  none' : h.toFixed(3)}  ${verdict === 'ok' ? '' : verdict}`);
    }
    }
  }
  console.log(`\n${checked} hotspots checked, ${problems} problem(s).`);
})();
