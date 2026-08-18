/**
 * ViewerEngine  -  the museum-quality 3D stage for the Structure Atlas.
 *
 * Renderer: three.js WebGPURenderer (WebGPU where available, WebGL2 fallback),
 * with TSL node materials for atmosphere, contact shadow, rim light and the
 * selection glow. Models are normalized into a consistent museum frame and
 * occluded markers use BVH-accelerated raycasts.
 */
import * as THREE from "three/webgpu";
import {
  color,
  float,
  normalView,
  positionLocal,
  positionViewDirection,
  smoothstep,
  uniform,
} from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";
import gsap from "gsap";
import type { Structure, Vec3 } from "@/types/structure";
import { withBase } from "@/lib/utils";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;

/** Coarse-pointer / touch-only devices (phones, tablets) have a much lower
 *  practical GPU memory ceiling than desktop  -  iOS Safari in particular has
 *  been observed crash-looping a tab well under 300MB of active texture
 *  memory. Used to scale back residency and preloading on those devices. */
export const IS_LOW_MEMORY_DEVICE =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;

/** dwellings kept parsed in memory at once (~2MB of source geometry each) */
const MAX_RESIDENT = IS_LOW_MEMORY_DEVICE ? 2 : 6;

/** Above this file size, a .glb reliably crash-loops low-memory devices
 *  (see IS_LOW_MEMORY_DEVICE) well before the browser's actual OOM ceiling -
 *  the download itself, the decoded texture upload, and the rest of the
 *  scene already on stage all add up. Desktop has no such limit.
 *
 *  Scaled by `navigator.deviceMemory` (RAM in GB) where the browser exposes
 *  it - Chrome/Android does, Safari/iOS never does. A flat 90MB limit was
 *  observed too high for at least one real low-memory device (a stalled
 *  load that Safari then killed with "A problem repeatedly occurred"), so
 *  devices that don't report their memory get a more conservative default
 *  rather than the old flat ceiling. */
function lowMemoryModelByteLimit(): number {
  const MB = 1024 * 1024;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof deviceMemory === "number") {
    // Roughly: a 4GB-RAM phone gets ~60MB, 8GB gets ~90MB, capped both ends.
    return Math.max(30, Math.min(90, deviceMemory * 15)) * MB;
  }
  // Unknown RAM (notably all of iOS Safari): assume the low end.
  return 45 * MB;
}

export class ModelTooHeavyError extends Error {
  byteSize: number;
  constructor(byteSize: number) {
    super(`model exceeds low-memory device limit: ${byteSize} bytes`);
    this.name = "ModelTooHeavyError";
    this.byteSize = byteSize;
  }
}

/** For a resolved `/models/<file>.glb` path, points at the pre-compressed
 *  mobile counterpart in `/models/mobile/<file>.glb`, if one could exist.
 *  Callers still HEAD-check it since not every model has a mobile build. */
function toMobilePath(resolvedPath: string): string | null {
  // A modelPath may carry a cache-busting query string (e.g. "?v=3"), which
  // must round-trip onto the mobile URL too, or the browser/CDN never sees
  // it as a different resource from whatever it cached before the bump.
  const [path, query] = resolvedPath.split(/(?=\?)/);
  const m = path.match(/^(.*)\/models\/([^/]+\.glb)$/);
  if (!m) return null;
  const [, prefix, file] = m;
  return `${prefix}/models/mobile/${file}${query || ""}`;
}
const TARGET_SIZE = 2.0; // normalized model footprint, world units
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export interface AnchorProjection {
  x: number;
  y: number;
  /** distance from camera to the anchor, world units (drives depth scaling) */
  distance: number;
  behindCamera: boolean;
  occluded: boolean;
}

export interface LoadedModel {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  /** What hotspot/hover/occlusion raycasts are actually cast against. Equal
   *  to `meshes` for every model except the ones in RAYCAST_PROXY_STRUCTURES
   *  (see buildRaycastProxy), where a coarse invisible stand-in mesh is used
   *  instead so picking stays cheap without needing a BVH over the visible
   *  geometry. Kept separate from `meshes` so wireframe/xray/rendering  -
   *  which do need the real visible mesh list  -  are unaffected. */
  raycastMeshes: THREE.Mesh[];
  size: THREE.Vector3;
  structureId: string;
  /** the exact `${structureId}:${targetPath}` key this model is cached under  -
   *  distinct model variants (default vs. inside) of the same structure get
   *  distinct keys, so residency tracking must key on this, not structureId. */
  cacheKey: string;
}

/** Structures whose visible geometry is too dense to build a BVH over
 *  without blocking the main thread  -  see buildRaycastProxy. Their
 *  hotspots are raycast against a coarse invisible proxy box instead. */
const RAYCAST_PROXY_STRUCTURES = new Set([
  "eden_fall",
  "solomon_temple",
  "tower_babel",
  "mount_of_olives",
  "golgotha",
  "new_jerusalem",
  "noahs_ark_inside",
  "tabernacle_inside",
  "walls_jericho",
  "herods_temple",
  "parting_sea",
]);

/** Ceiling on how long a model's shader/texture warm-up may hold up a
 *  structure swap  -  see the comment on `warm()`. This is a last-resort
 *  safety net against a genuinely pathological compileAsync stall (multiple
 *  minutes), not a normal-case budget: a heavy model (a large embedded 4K
 *  texture, hundreds of thousands of triangles) can legitimately take real
 *  seconds to compile, and cutting that short shows the model before its
 *  texture has actually uploaded  -  a few blank-white seconds that read as
 *  "broken" even though the texture is just about to land. Keep this high
 *  enough that ordinary loads always finish warm. */
const WARM_TIMEOUT_MS = 20000;

type FrameCallback = () => void;

/** Top-surface heights over a model's footprint, in model-local units. */
interface HeightField {
  n: number;
  y: Float32Array;
  min: number;
  max: number;
}

export class ViewerEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGPURenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private loader: GLTFLoader;
  private manager: THREE.LoadingManager;

  private stage = new THREE.Group(); // holds the model group
  private current: LoadedModel | null = null;
  private cache = new Map<string, Promise<LoadedModel>>();
  private frameCbs = new Set<FrameCallback>();
  private raycaster = new THREE.Raycaster();
  private glowShell: THREE.Mesh | null = null;
  private glowPulse = uniform(0.6);
  private rimColor = uniform(new THREE.Color(0xdce4ea));
  private rimIntensity = uniform(0.14);
  private wireOverlays: THREE.Mesh[] = [];
  /** surfaces swapped to plaster for the wireframe view, and their originals */
  private wireSwapped: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
  private wireOn = false;
  private xrayOn = false;
  private grid: THREE.PolarGridHelper | null = null;
  /* lighting rig  -  kept as fields so an structure swap can re-tint it */
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private bounceLight!: THREE.DirectionalLight;
  private envTex: THREE.Texture | null = null;
  private contact: THREE.Mesh | null = null;
  private contactOpacity = uniform(0.46);
  private occlusionTimer = 0;
  private occlusionCache = new Map<string, boolean>();
  /** anchors resolved onto the mesh surface, keyed structureId:anchor */
  private snapped = new Map<string, THREE.Vector3>();
  /** per-model top-surface height fields, built once on first use */
  private fields = new Map<string, HeightField>();
  /** structure ids by recency; the tail is evicted once past MAX_RESIDENT */
  private lru: string[] = [];
  /** the swap currently playing, so a new request can interrupt it */
  private activeTl: gsap.core.Timeline | null = null;
  private activeResolve: (() => void) | null = null;
  /** waiting beneath the parchment, attached but not yet handed over */
  private staged: LoadedModel | null = null;
  private clock = new THREE.Clock();
  private disposed = false;
  /** frames of shadow-map refresh still owed (see renderer.shadowMap.autoUpdate) */
  private shadowDirty = 2;
  /** models retired mid-transition; freed once the animation is over */
  private retired: LoadedModel[] = [];
  private resizeObs: ResizeObserver | null = null;
  /** throwaway target used to warm a model's pipelines off-screen */
  private warmTarget: THREE.RenderTarget | null = null;
  private projScratch = new THREE.Vector3();
  private occScratch = new THREE.Vector3();
  private camState = { az: -38, el: 34, dist: 2.6, tx: 0, ty: 0.4, tz: 0 };
  private reducedMotion = false;
  private ready = false;
  /** the dwelling the resting camera was last computed for, so a stage that
   *  changes shape can re-fit rather than cropping the model it already framed */
  private framedStructure: Structure | null = null;
  private anchorPickTimer = 0;

  onLoadProgress: ((pct: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (_u, loaded, total) => {
      if (this.onLoadProgress && total > 0) this.onLoadProgress(Math.round((loaded / total) * 100));
    };
    const draco = new DRACOLoader(this.manager).setDecoderPath(withBase("/draco/gltf/"));
    this.loader = new GLTFLoader(this.manager);
    this.loader.setDRACOLoader(draco);
  }

  async init() {
    const renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      antialias: !IS_LOW_MEMORY_DEVICE,
      alpha: true,
      forceWebGL: true,
    });
    // the stage backdrop is painted in CSS, not in the scene: filmic tone
    // mapping would drain the warmth out of a rendered parchment gradient
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    await renderer.init();
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    scene.fog = new THREE.Fog(0xeef2f4, 9, 26);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    this.camera.position.set(-1.7, 1.6, 2.4);

    // ── Image-based light: a warm gallery dome so PBR surfaces pick up
    //    sky above / parchment floor bounce instead of flat directional light ──
    this.envTex = this.buildEnvironment();
    if (this.envTex) {
      scene.environment = this.envTex;
      // enough ambient to fill shadow, not so much that everything goes flat
      scene.environmentIntensity = 0.4;
    }

    // ── Lighting: hard sun over soft ambient. The ambient terms stay low so
    //    that form reads through shadow rather than washing out. ──
    const hemi = new THREE.HemisphereLight(0xf7f9fa, 0xaab6bd, 0.18);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xf7f9fa, 3.1);
    key.position.set(3.0, 4.4, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -2.2;
    key.shadow.camera.right = 2.2;
    key.shadow.camera.top = 2.2;
    key.shadow.camera.bottom = -2.2;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.bias = -0.00016;
    key.shadow.normalBias = 0.018;
    // tight penumbra  -  architecture wants crisp eaves, not a haze
    key.shadow.radius = 2.6;
    // Orbiting moves the camera, not the building, so the shadow map is only
    // redrawn when the geometry actually changes  -  the biggest per-frame win.
    key.shadow.autoUpdate = false;
    key.shadow.needsUpdate = true;
    scene.add(key);
    this.keyLight = key;

    // cool sky fill opposite the key  -  keeps shadow sides from going muddy
    const fill = new THREE.DirectionalLight(0xd6e2f2, 0.22);
    fill.position.set(-3.6, 2.1, -1.7);
    scene.add(fill);

    // cool back rim  -  separates the silhouette from the white/blue backdrop
    const rim = new THREE.DirectionalLight(0xc9d6de, 0.72);
    rim.position.set(-2.1, 2.7, -3.7);
    scene.add(rim);
    this.rimLight = rim;

    // floor bounce  -  a soft upward fill under eaves and colonnades
    const bounce = new THREE.DirectionalLight(0xe4eaee, 0.16);
    bounce.position.set(0.5, -2.0, 2.4);
    scene.add(bounce);
    this.bounceLight = bounce;

    // ── Ground: a pale disc that dissolves into the backdrop, so the
    //    dwelling reads as resting on paper rather than on a visible slab ──
    let ground: THREE.Mesh;
    try {
      const gm = new THREE.MeshStandardNodeMaterial({ roughness: 1, metalness: 0, transparent: true });
      gm.colorNode = color(0xeef2f4);
      gm.opacityNode = smoothstep(0.62, 0.98, positionLocal.xy.length().div(4.2)).oneMinus();
      ground = new THREE.Mesh(new THREE.CircleGeometry(4.2, 96), gm);
    } catch {
      ground = new THREE.Mesh(
        new THREE.CircleGeometry(9, 72),
        new THREE.MeshStandardMaterial({ color: 0xeef2f4, roughness: 1, metalness: 0 }),
      );
    }
    ground.rotation.x = -Math.PI / 2;
    // a hair below the dwellings, whose own base slab sits at y=0: coplanar
    // surfaces z-fight, and the shimmer shows up whenever the camera moves
    ground.position.y = -0.014;
    ground.receiveShadow = true;
    scene.add(ground);

    try {
      const shadowMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
      const d = positionLocal.xy.length().div(1.35);
      shadowMat.colorNode = color(0x1d2b33);
      shadowMat.opacityNode = smoothstep(0.05, 0.88, d).oneMinus().mul(this.contactOpacity);
      const contact = new THREE.Mesh(new THREE.CircleGeometry(1.35, 64), shadowMat);
      contact.rotation.x = -Math.PI / 2;
      contact.position.y = -0.007;
      contact.renderOrder = 1;
      this.contact = contact;
      this.stage.add(contact);
    } catch {
      /* standard shadow map remains as fallback */
    }

    // ── Selection glow shell (TSL fresnel, additive) ──
    try {
      const glowMat = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const fres = float(1.0).sub(normalView.dot(positionViewDirection).clamp(0, 1)).pow(1.8);
      glowMat.colorNode = color(0x3c5e70);
      glowMat.opacityNode = fres.mul(this.glowPulse).mul(0.85);
      this.glowShell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), glowMat);
      this.glowShell.visible = false;
      this.glowShell.renderOrder = 3;
      this.stage.add(this.glowShell);
    } catch {
      this.glowShell = null;
    }

    // ── Polar grid (museum turntable reference) ──
    this.grid = new THREE.PolarGridHelper(1.6, 12, 6, 48, 0x8b98a3, 0xcdd5dc);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.35;
    this.grid.visible = false;
    this.stage.add(this.grid);

    // ── Controls ──
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.1;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.autoRotateSpeed = 0.9;
    this.controls = controls;

    this.scene.add(this.stage);
    this.resize();
    window.addEventListener("resize", this.resize);
    // the stage can also change height without a window resize (page layout,
    // panel growth), so watch the canvas host directly
    if (typeof ResizeObserver !== "undefined" && this.canvas.parentElement) {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.canvas.parentElement);
    }
    this.ready = true;
    this.loop();

    // ── anchor picker: double-click the model to read off an anchor ──
    // Hotspots are authored as normalised box coordinates, which are near
    // impossible to guess by hand. Double-clicking the spot you mean converts
    // the ray hit straight into the triple the data file wants, and copies it
    // to the clipboard so it can be pasted into the structure's hotspot list.
    // Dev-only: a visitor double-clicking the model in production should
    // never see an internal authoring readout.
    const devMode =
      import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";
    if (devMode) this.canvas.addEventListener("dblclick", (e: MouseEvent) => {
      if (!this.current) return;
      const rect = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
      const hits = this.raycaster.intersectObjects(this.current.raycastMeshes, false);
      if (!hits.length) {
        this.showAnchorPick("no surface under the cursor  -  aim at the model");
        return;
      }
      const pt = this.current.group.worldToLocal(hits[0].point.clone());
      const s = this.current.size;
      const anchor: [number, number, number] = [
        +(pt.x / s.x + 0.5).toFixed(3),
        +(pt.y / s.y).toFixed(3),
        +(pt.z / s.z + 0.5).toFixed(3),
      ];
      const snippet = `anchor: [${anchor.join(", ")}],`;
      navigator.clipboard?.writeText(snippet).catch(() => {});
      this.showAnchorPick(snippet);
      console.log(`%c[anchor] ${snippet}`, "color:#e6a020;font-weight:bold;font-size:14px", "  (copied)");
    });
  }

  /** Small transient readout for the anchor picker, so the coordinates can be
   *  read without opening devtools. */
  private showAnchorPick(text: string) {
    const id = "atlas-anchor-pick";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;" +
        "background:#1f2933;color:#ffd9a0;font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;" +
        "padding:10px 14px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.28);pointer-events:none;" +
        "max-width:min(90vw,520px);text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = text.startsWith("anchor") ? `${text}   (copied to clipboard)` : text;
    el.style.opacity = "1";
    window.clearTimeout(this.anchorPickTimer);
    this.anchorPickTimer = window.setTimeout(() => {
      const node = document.getElementById(id);
      if (node) node.style.opacity = "0";
    }, 4000);
  }

  /** A hand-painted equirectangular gallery dome: cool white/grey sky, a soft
   *  key-side glow, and a pale floor that bounces back into the model.
   *  Cheap to build (64×32 canvas) and gives node materials real IBL. */
  private buildEnvironment(): THREE.Texture | null {
    try {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      const sky = ctx.createLinearGradient(0, 0, 0, 32);
      sky.addColorStop(0.0, "#ffffff"); // zenith
      sky.addColorStop(0.42, "#f2f5f6");
      sky.addColorStop(0.52, "#e2e9ec"); // horizon
      sky.addColorStop(1.0, "#c3ccd1"); // floor bounce
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 64, 32);
      // soft sun patch on the key side
      const sun = ctx.createRadialGradient(46, 5, 0, 46, 5, 22);
      sun.addColorStop(0, "rgba(255,255,255,0.95)");
      sun.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, 64, 32);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    } catch {
      return null;
    }
  }

  /** Warm the rig toward an structure's accent colour  -  Byzantine gold reads
   *  differently from Inca stone, and the light should say so. */
  setTint(hex: string, dur = 1.1) {
    const tint = new THREE.Color(hex);
    const targets: [THREE.Color | undefined, THREE.Color][] = [
      [this.rimLight?.color, new THREE.Color(0xc9d6de).lerp(tint, 0.45)],
      [this.keyLight?.color, new THREE.Color(0xf7f9fa).lerp(tint, 0.16)],
      [this.bounceLight?.color, new THREE.Color(0xe4eaee).lerp(tint, 0.35)],
      [this.rimColor.value as THREE.Color, new THREE.Color(0xdce4ea).lerp(tint, 0.4)],
    ];
    targets.forEach(([src, to]) => {
      if (!src) return;
      if (this.reducedMotion || dur <= 0.01) src.copy(to);
      else gsap.to(src, { r: to.r, g: to.g, b: to.b, duration: dur, ease: "power2.inOut" });
    });
  }

  /**
   * Tip a dwelling about the hinge line running along the rear edge of its
   * base  -  the edge furthest from the camera  -  so it falls backwards away
   * from the room rather than toward it.
   *
   * Rotating about that edge rather than the model's own origin is what keeps
   * every part of it above the floor for the whole arc: at -90° the building
   * lies flat *behind* the hinge, so it never dips through the ground plane
   * and never throws the shadow acne a floor intersection causes.
   */
  /** Ask for the shadow map to be redrawn over the next few frames. */
  private markShadowDirty(frames = 2) {
    this.shadowDirty = Math.max(this.shadowDirty, frames);
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent || !this.renderer) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 2 || h < 2) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // Resolution budget: full DPR on modest canvases, scaled back on large
    // ones so a retina 2× never asks for more fragments than it can afford.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const MAX_PIXELS = 3_500_000;
    const wanted = w * h * dpr * dpr;
    const ratio = wanted > MAX_PIXELS ? Math.max(1, dpr * Math.sqrt(MAX_PIXELS / wanted)) : dpr;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);

    /* A narrower stage needs the camera further back to keep the whole
       dwelling in frame. Only ever pull back, never push in, so a resize
       cannot undo a zoom the visitor chose for themselves. */
    if (this.framedStructure && this.current && this.controls) {
      const needed = Math.min(this.fitDistance(this.framedStructure), this.controls.maxDistance);
      if (needed > this.camState.dist) {
        this.camState.dist = needed;
        this.applyCam();
      }
    }
    this.markShadowDirty(2);
  };

  private loop = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.loop);
    const dt = this.clock.getDelta();
    this.controls?.update();
    // idle glow pulse  -  only worth computing while something is highlighted
    if (this.glowShell?.visible) {
      this.glowPulse.value = 0.55 + Math.sin(performance.now() * 0.0024) * 0.25;
    }
    // throttled occlusion refresh
    this.occlusionTimer += dt;
    if (this.occlusionTimer > 0.14) {
      this.occlusionTimer = 0;
      this.refreshOcclusion();
    }
    this.frameCbs.forEach((cb) => cb());
    if (this.shadowDirty > 0) {
      this.shadowDirty--;
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  };

  /* ── model loading & normalization ─────────────────────────────── */
  load(structure: Structure, variantPath?: string): Promise<LoadedModel> {
    const desktopPath = withBase(variantPath || structure.modelPath);
    const cacheKey = `${structure.id}:${desktopPath}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const p = (async (): Promise<LoadedModel> => {
      let targetPath = desktopPath;
      // Low-memory devices (phones/tablets) reliably crash on very large
      // .glb files well before the browser reports an out-of-memory error.
      // Heavy models (>~140MB) are pre-compressed (Draco geometry + WebP
      // textures, same visual quality, no simplification) into
      // /models/mobile/<file>. On a low-memory device, prefer that file when
      // it exists; desktop always gets the original, full-quality asset.
      if (IS_LOW_MEMORY_DEVICE && !targetPath.endsWith(".obj")) {
        const mobilePath = toMobilePath(targetPath);
        if (mobilePath) {
          try {
            const head = await fetch(mobilePath, { method: "HEAD" });
            // A bare `head.ok` check isn't enough: some dev servers (Vite's
            // SPA fallback) and misconfigured static hosts answer a missing
            // file with 200 + index.html instead of a real 404, which then
            // sends GLTFLoader an HTML document to parse as glTF binary and
            // fails the load entirely. Require the content-type to actually
            // look like a model response before trusting the mobile path.
            const type = head.headers.get("content-type") || "";
            if (head.ok && !type.includes("text/html")) targetPath = mobilePath;
          } catch {
            /* mobile variant unreachable  -  fall through to the desktop path */
          }
        }
        try {
          const head = await fetch(targetPath, { method: "HEAD" });
          const type = head.headers.get("content-type") || "";
          if (!head.ok || type.includes("text/html")) {
            throw new Error(`model not found at ${targetPath}`);
          }
          const len = Number(head.headers.get("content-length") || 0);
          if (len > lowMemoryModelByteLimit()) {
            throw new ModelTooHeavyError(len);
          }
        } catch (e) {
          if (e instanceof ModelTooHeavyError) throw e;
          // A real network failure (offline, server quirk) shouldn't block
          // loading  -  let the real load attempt surface its own error. But
          // if we just proved the file doesn't exist there, retry against
          // the desktop path instead of feeding GLTFLoader an HTML response.
          if (targetPath === mobilePath) targetPath = desktopPath;
        }
      }
      return this.loadInner(structure, targetPath, cacheKey);
    })();
    this.cache.set(cacheKey, p);
    return p;
  }

  private loadInner(structure: Structure, targetPath: string, cacheKey: string): Promise<LoadedModel> {
    return new Promise<LoadedModel>((resolve, reject) => {
      const isObj = targetPath.endsWith('.obj');
      // .obj geometry carries no material of its own, so it always needs its
      // external /img/{id}/texture_*.png maps applied.
      const needsExternalTextures = isObj;

      const applyExternalTextures = (object: THREE.Object3D) => {
        const textureLoader = new THREE.TextureLoader();
        const loadTexture = (url: string) => new Promise<THREE.Texture>((res, rej) => textureLoader.load(url, res, undefined, rej));
        const imgPath = withBase(`/img/${structure.id}`);
        return Promise.all([
          loadTexture(`${imgPath}/texture_diffuse.webp`),
          loadTexture(`${imgPath}/texture_normal.webp`),
          loadTexture(`${imgPath}/texture_roughness.webp`),
          loadTexture(`${imgPath}/texture_metallic.webp`).catch(() => null),
        ]).then(([diffuse, normal, roughness, metallic]) => {
          if (diffuse) diffuse.colorSpace = THREE.SRGBColorSpace;
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                map: diffuse,
                normalMap: normal,
                roughnessMap: roughness,
                metalnessMap: metallic ?? undefined,
                metalness: metallic ? 1.0 : 0.2,
                roughness: 1.0,
              });
            }
          });
        });
      };

      if (isObj) {
        const objLoader = new OBJLoader();
        objLoader.load(
          targetPath,
          (object) => {
            applyExternalTextures(object).then(() => {
              const [model, rimReady] = this.normalize(object, structure, cacheKey);
              this.snapAnchors(model, structure);
              rimReady.then(() => this.warm(model)).then(() => resolve(model));
            }).catch(reject);
          },
          undefined,
          reject,
        );
      } else {
        // Load GLB (default)
        this.loader.load(
          targetPath,
          (gltf) => {
            const applied = needsExternalTextures
              ? applyExternalTextures(gltf.scene)
              : Promise.resolve();
            applied.then(() => {
              try {
                const [model, rimReady] = this.normalize(gltf.scene, structure, cacheKey);
                this.snapAnchors(model, structure);
                rimReady.then(() => this.warm(model)).then(() => resolve(model));
              } catch (e) {
                reject(e);
              }
            }).catch(reject);
          },
          undefined,
          reject,
        );
      }
    });
  }

  /** Compile a model's shaders and upload its textures while it is still
   *  off-stage, so its first visible frame costs nothing extra.
   *
   *  `compileAsync` has been observed to pathologically stall for tens of
   *  seconds on some transitions (WebGPURenderer's compat/WebGL path paying
   *  a cold shader-cache cost right after the landing dwelling) even though
   *  it always resolves eventually. Racing it against a timeout bounds how
   *  long a swap can be held hostage; when the timeout wins, the warm-up's
   *  scene-mutating steps (render-target render, `scene.add/remove`) are
   *  simply skipped rather than left to run detached from this call  -  a
   *  late finish could otherwise fight `transition()` over `model.group`
   *  once the model is already on stage. The uncompiled model still shows;
   *  it just pays the compile cost on its first real frame instead. */
  private async warm(model: LoadedModel) {
    if (!this.renderer) return;
    try {
      // Compile against the live scene for lighting context, but WITHOUT
      // putting the model in it: this await spans many frames, and a model
      // sitting in the scene graph across it would be drawn on top of the
      // dwelling currently on stage  -  which is what flashed on hover.
      const timedOut = Symbol("warm-timeout");
      const result = await Promise.race([
        this.renderer.compileAsync(model.group, this.camera, this.scene),
        new Promise((res) => setTimeout(() => res(timedOut), WARM_TIMEOUT_MS)),
      ]);
      if (result === timedOut) return;

      // The shadow-depth pipeline needs a real render with the model casting.
      // Everything from here to the removal is synchronous  -  no await  -  so no
      // visible frame can ever catch the model in the scene.
      this.warmTarget ??= new THREE.RenderTarget(16, 16);
      model.group.position.set(0, 0, 0);
      this.renderer.setRenderTarget(this.warmTarget);
      this.scene.add(model.group);
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
      this.scene.remove(model.group);
      // and redraw the shadow map for the real scene, so the warm pass leaves
      // no trace of itself for the next on-screen frame to pick up
      if (this.keyLight) this.keyLight.shadow.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    } catch {
      /* warming is an optimisation; a failure just means the first frame pays */
    } finally {
      this.renderer?.setRenderTarget(null);
      this.scene.remove(model.group);
      model.group.position.set(0, 0, 0);
      this.markShadowDirty(2);
    }
  }

  /** Warms a neighbour in the background. The load itself (Draco decode,
   *  BVH build, shader warm-up) is heavy, synchronous, main-thread work with
   *  no chunking support in this three-mesh-bvh version  -  running it eagerly
   *  can stall a concurrent, user-initiated `load()` for several seconds (the
   *  two don't share a promise, but they share the one JS thread). Deferring
   *  to requestIdleCallback lets a real navigation's own load claim the
   *  thread first; the preload only runs once the browser is truly idle. */
  preload(structure: Structure, variantPath?: string) {
    const run = () => this.load(structure, variantPath).catch(() => {});
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 4000 });
    } else {
      run();
    }
  }

  /** Returns the model plus a promise that resolves once every mesh's
   *  material textures (see applyRim) are actually decoded  -  callers must
   *  await it before warm()'s compileAsync, or a shader can get compiled
   *  and locked in against still-empty textures (see applyRim's doc comment). */
  private normalize(sceneObj: THREE.Group, structure: Structure, cacheKey: string): [LoadedModel, Promise<void>] {
    const group = new THREE.Group();
    const inner = sceneObj;
    group.add(inner);

    const box = new THREE.Box3().setFromObject(inner);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxXZ = Math.max(size.x, size.z) || 1;
    const s = TARGET_SIZE / maxXZ;
    inner.scale.setScalar(s);
    // recenter: footprint center to origin, base to y=0
    inner.position.set(-center.x * s, -box.min.y * s, -center.z * s);

    const usesProxy = RAYCAST_PROXY_STRUCTURES.has(structure.id);
    const meshes: THREE.Mesh[] = [];
    const rimReady: Promise<void>[] = [];
    inner.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        const geo = m.geometry as THREE.BufferGeometry;
        // Skipped for proxy structures: their raycasts never touch this
        // geometry (see buildRaycastProxy below), and building a BVH over it
        // anyway is exactly the multi-second-to-unbounded main-thread stall
        // the proxy exists to avoid  -  see RAYCAST_PROXY_STRUCTURES.
        if (!usesProxy && !(geo as any).boundsTree) {
          // indirect keeps the index buffer as authored instead of reordering
          // it, and fatter leaves mean far less tree to build  -  this runs on
          // the main thread during load, and our query load is tiny (one snap
          // pass plus four occlusion rays a few times a second)
          (geo as any).computeBoundsTree({ indirect: true, maxLeafTris: 24 });
        }
        rimReady.push(this.applyRim(m, structure.id, cacheKey));
        meshes.push(m);
      }
    });

    const nsize = size.clone().multiplyScalar(s);
    const raycastMeshes = usesProxy ? [this.buildRaycastProxy(group, nsize)] : meshes;
    const model = { group, meshes, raycastMeshes, size: nsize, structureId: structure.id, cacheKey };
    return [model, Promise.all(rimReady).then(() => {})];
  }

  /** A coarse, invisible stand-in for hotspot/hover/occlusion raycasts, used
   *  only by structures in RAYCAST_PROXY_STRUCTURES whose visible geometry
   *  is too dense to ever raycast against directly (see that set's comment).
   *  A single box over the model's full footprint is a deliberately loose
   *  approximation  -  it can't distinguish "behind the tree" from "behind
   *  the ground"  -  but every hotspot these structures carry today is
   *  authored with snap: "none" (placed exactly, no surface search needed),
   *  so the only things this proxy actually has to answer are hover-pick
   *  and occlusion, where "roughly where the model's mass is" is enough. */
  private buildRaycastProxy(group: THREE.Group, size: THREE.Vector3): THREE.Mesh {
    const geo = new THREE.BoxGeometry(size.x || 1, size.y || 1, size.z || 1);
    geo.translate(0, (size.y || 1) / 2, 0);
    const proxy = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    proxy.visible = false;
    group.add(proxy);
    return proxy;
  }

  /** TSL rim-light: a soft warm fresnel edge so the architecture reads
   *  against the parchment backdrop. Falls back silently to the
   *  original material if node patching fails.
   *
   *  This is also where each structure's per-model texture override lives
   *  (search below for `structureId ===`). An override REPLACES whatever
   *  UV-mapped texture the .glb already carries, so it only produces a
   *  correct result if the external /img/{id}/texture_*.* file was baked
   *  against the SAME UV atlas as that specific model. Swapping in a
   *  higher-resolution file from a different export (a re-render, a
   *  different tool pass, etc.) usually means a different atlas layout,
   *  which scrambles the surface into disconnected patches rather than
   *  sharpening it. Before adding or changing an override here, extract
   *  and visually diff the model's embedded texture against the external
   *  one first  -  do not assume "higher resolution" means "compatible". */
  /** Returns a promise that resolves once any textures this mesh needs are
   *  actually decoded and assigned. `warm()` calls `renderer.compileAsync`
   *  right after `normalize()`  -  with MeshStandardNodeMaterial, that
   *  compiles and locks in the shader against whatever `map`/`normalMap`/etc
   *  hold *at that moment*. TextureLoader.load() returns an empty Texture
   *  immediately and fills it in asynchronously, so if the swap-in above
   *  isn't awaited before compileAsync runs, the shader gets compiled
   *  against blank textures and never picks up the real image once it
   *  arrives  -  the mesh renders as flat, textureless material forever
   *  (see the noahs_ark default variant regression this fixed). */
  private applyRim(mesh: THREE.Mesh, structureId: string, cacheKey?: string): Promise<void> {
    // new_jerusalem's embedded texture is already correct for its model's UV
    // atlas; the external /img/new_jerusalem/texture_*.webp files were a
    // different, incompatible bake and have been removed. Do not re-add an
    // override here without first confirming the UV layout matches.
    if (structureId === "new_jerusalem") return Promise.resolve();
    // The noahs_ark override below is baked ONLY against the original
    // default/exterior model's UV atlas (public/models/noahs_ark.glb).
    // Every other variant (inside, rainbow, and any future addition) is a
    // separate export with its own embedded texture and must keep it  -
    // applying this override to the wrong UV layout scrambles the surface
    // into flat/disconnected patches (see the tower_babel and
    // solomon_temple/herods_temple notes below for the same failure mode).
    // Opt IN by exact model path instead of opting OUT by variant id, so a
    // newly added variant is safe by default even if no one remembers to
    // exclude it here.
    const isNoahsArkDefaultVariant = structureId === "noahs_ark" && !!cacheKey?.endsWith("/models/noahs_ark.glb");
    try {
      const src = mesh.material as THREE.MeshStandardMaterial;
      const nm = new THREE.MeshStandardNodeMaterial();
      nm.color = src.color ? src.color.clone() : new THREE.Color(0xffffff);
      nm.map = src.map ?? null;
      nm.normalMap = src.normalMap ?? null;
      nm.roughnessMap = (src as any).roughnessMap ?? null;
      nm.metalnessMap = (src as any).metalnessMap ?? null;
      nm.aoMap = (src as any).aoMap ?? null;
      nm.roughness = src.roughness ?? 0.8;
      nm.metalness = src.metalness ?? 0.1;
      mesh.material = nm;

      if (isNoahsArkDefaultVariant) {
        const texLoader = new THREE.TextureLoader();

        return Promise.all([
          texLoader.loadAsync(withBase("/img/noahs_ark/texture_diffuse.webp")),
          texLoader.loadAsync(withBase("/img/noahs_ark/texture_normal.webp")),
          texLoader.loadAsync(withBase("/img/noahs_ark/texture_pbr.webp")),
        ]).then(([diffuse, normal, pbr]) => {
          diffuse.colorSpace = THREE.SRGBColorSpace;
          diffuse.flipY = false;
          normal.flipY = false;
          pbr.flipY = false;
          nm.map = diffuse;
          nm.normalMap = normal;
          nm.roughnessMap = pbr;
          nm.metalnessMap = pbr;
          nm.roughness = 1.0;
        });
      }
      /* tower_babel intentionally has no override here (removed): the
         external /img/tower_babel/texture_*.webp files were baked against
         the old model's UV atlas. The current model (swapped in for a
         sharper Meshy AI export) has its own different UV layout and
         carries its own embedded, already-correct texture  -  applying the
         old override here scrambled the surface into the flat, detail-less
         sand color seen instead of the baked stonework. Do not re-add
         without first confirming the external texture's UV layout matches
         the current model. */
      /* solomon_temple and herods_temple intentionally have no override here:
         their external /img/{id}/texture_*.* files use a different UV atlas
         than the embedded model, so applying them scrambles the surface into
         disconnected patches. herods_temple already sources its own textures
         via needsExternalTextures above  -  an override here would never even
         run for it. Do not re-add either without first
         confirming the external texture's UV layout matches the model.
         noahs_ark's "inside" variant is skipped above for the same reason:
         it is a distinct export with its own embedded UV atlas, not the
         exterior's. */
      const fres = float(1.0).sub(normalView.dot(positionViewDirection).clamp(0, 1)).pow(2.6);
      nm.emissiveNode = fres.mul(this.rimColor).mul(this.rimIntensity);
      mesh.material = nm;
      return Promise.resolve();
    } catch {
      /* keep original material */
      return Promise.resolve();
    }
  }

  /** Present a loaded model (assumes transition choreography is driven by caller). */
  /** Put a model on the turntable. The outgoing one is retired separately,
   *  so both can be on stage together while they pass each other under the
   *  floor. */
  attach(model: LoadedModel) {
    if (!model.group.parent) this.stage.add(model.group);
    // the contact shadow hugs whatever footprint is on the turntable
    if (this.contact) {
      const spread = Math.max(model.size.x, model.size.z) / 2;
      this.contact.scale.setScalar(Math.max(0.4, spread * 0.92));
    }
    this.markShadowDirty(1);
  }

  /** Hand the stage over: `model` becomes the current dwelling. Recently
   *  seen dwellings stay parsed and resident, so switching back to one is
   *  instant instead of a fresh download, re-parse and re-snap. */
  present(model: LoadedModel) {
    const old = this.current;
    if (old && old !== model) this.stage.remove(old.group);
    this.current = model;
    this.occlusionCache.clear();
    this.attach(model);
    this.touchResidency(model.cacheKey);
    // carry the active layers onto the dwelling that just arrived
    this.buildWireframe();
    if (this.xrayOn) this.setXray(true);
  }

  clearStage() {
    if (this.current) {
      this.stage.remove(this.current.group);
      this.current = null;
    }
  }

  /** Mark a model (by its full cache key, so distinct variants of the same
   *  structure are tracked separately) as most-recently-used and evict past
   *  the residency cap. Evicted models are queued, never freed mid-animation. */
  private touchResidency(cacheKey: string) {
    this.lru = [cacheKey, ...this.lru.filter((x) => x !== cacheKey)];
    while (this.lru.length > MAX_RESIDENT) {
      const drop = this.lru.pop();
      if (!drop || drop === this.current?.cacheKey) continue;
      const p = this.cache.get(drop);
      this.cache.delete(drop);
      p?.then((m) => {
        if (m !== this.current) {
          this.stage.remove(m.group);
          this.fields.delete(m.structureId);
          this.retired.push(m);
        }
      }).catch(() => undefined);
    }
  }

  /** Free everything retired by the last swap. Called once the stage is still. */
  private flushRetired() {
    const list = this.retired;
    this.retired = [];
    list.forEach((m) => {
      if (m !== this.current) this.disposeModel(m);
    });
  }

  /**
   * The exhibit exchange. The outgoing dwelling descends straight through the
   * stage floor and the new one rises out of the same spot  -  no dissolve.
   * Fading the materials meant turning off depth writes, which let you see
   * clean through the building into its own interior and read as a corrupted
   * model; sinking behind an opaque floor keeps the geometry solid the whole
   * way. `onMidpoint` fires at the handover, when the panels should flip.
   */
  /**
   * The exchange, played as a turntable spin. The dwelling on stage spins up
   * about its own axis, and at the point where it is turning fastest  -  where
   * the eye cannot resolve which building it is looking at  -  the next one
   * takes over the same rotation and carries it, decelerating, round to rest.
   *
   * Nothing leaves the ground, so there is no floor plane to cut a colonnade
   * or an open courtyard in half, no surface to withdraw, and no moment where
   * the stage is empty. The dwelling casts its shadow throughout, and the
   * shadow turns with it.
   */
  transition(next: LoadedModel, structure: Structure, opts: { instant?: boolean; onMidpoint?: () => void } = {}): Promise<void> {
    const { onMidpoint } = opts;
    const instant = opts.instant || this.reducedMotion;

    // ── interrupt whatever is in flight, wherever it happens to be ──
    this.activeTl?.kill();
    this.activeTl = null;
    this.activeResolve?.();
    this.activeResolve = null;
    if (this.staged && this.staged !== next && this.staged !== this.current) {
      this.stage.remove(this.staged.group);
    }
    this.staged = null;

    const old = this.current !== next ? this.current : null;

    /** where the baton passes, and where the spin comes to rest  -  a whole
     *  number of turns, so the dwelling lands back on its own bearing */
    const HANDOVER = 210;
    const REST = 720;

    const stand = () => {
      next.group.scale.setScalar(1);
      next.group.rotation.set(0, 0, 0);
      next.group.position.set(0, 0, 0);
    };

    const handover = () => {
      this.present(next);
      onMidpoint?.();
      this.setTint(structure.tint, 1.0);
      this.frameStructure(structure, !instant);
    };

    if (instant) {
      stand();
      this.contactOpacity.value = 0.46;
      handover();
      return Promise.resolve();
    }

    // one shared state, so the rotation the outgoing dwelling built up is the
    // rotation the incoming one continues  -  the spin never breaks stride
    const spin = { deg: old ? THREE.MathUtils.radToDeg(old.group.rotation.y) : HANDOVER, hop: 0 };
    const applyTo = (m: LoadedModel) => {
      m.group.rotation.set(0, THREE.MathUtils.degToRad(spin.deg), 0);
      m.group.position.set(0, spin.hop, 0);
      // it lightens on its footing as it comes up to speed
      this.contactOpacity.value = 0.46 * Math.max(0.35, 1 - spin.hop / (m.size.y * 0.09));
    };

    const tl = gsap.timeline();
    this.activeTl = tl;

    // ── winding up ──
    if (old) {
      tl.to(spin, {
        deg: HANDOVER,
        hop: old.size.y * 0.06,
        duration: 0.44,
        ease: "power2.in",
        onUpdate: () => applyTo(old),
      }, 0);
    }

    // ── the baton passes at full speed ──
    const at = old ? 0.44 : 0;
    tl.add(() => {
      stand();
      applyTo(next);
      handover();
    }, at);

    // ── and unwinds to rest on its own bearing ──
    tl.to(spin, {
      deg: REST,
      hop: 0,
      duration: 1.05,
      ease: "power3.out",
      onUpdate: () => applyTo(next),
    }, at);

    // the dwelling is turning, so the shadow keeps pace for the length of it
    tl.eventCallback("onUpdate", () => this.markShadowDirty(1));

    return new Promise<void>((resolve) => {
      this.activeResolve = resolve;
      tl.eventCallback("onComplete", () => {
        this.activeTl = null;
        this.activeResolve = null;
        this.staged = null;
        stand();
        this.contactOpacity.value = 0.46;
        this.flushRetired();
        this.markShadowDirty(2);
        resolve();
      });
    });
  }

  get currentModel() {
    return this.current;
  }

  private disposeModel(m: LoadedModel) {
    m.meshes.forEach((mesh) => {
      (mesh.geometry as any).disposeBoundsTree?.();
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm: any) => {
        ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap"].forEach((k) => mm[k]?.dispose?.());
        mm.dispose?.();
      });
    });
    // raycastMeshes is `meshes` itself except for RAYCAST_PROXY_STRUCTURES,
    // where it's one extra invisible proxy box not covered by the loop above
    if (m.raycastMeshes !== m.meshes) {
      m.raycastMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
    }
  }

  private disposeCached(id: string) {
    const p = this.cache.get(id);
    if (!p) return;
    this.cache.delete(id);
    p.then((m) => {
      if (m !== this.current) this.disposeModel(m);
    }).catch(() => undefined);
  }

  /* ── anchor projection & occlusion ─────────────────────────────── */

  /** Raw anchor position: normalised box space → model-local units. */
  private boxAnchor(anchor: Vec3, model: LoadedModel, out = new THREE.Vector3(), bias = true) {
    const { size } = model;
    out.set((anchor[0] - 0.5) * size.x, anchor[1] * size.y, (anchor[2] - 0.5) * size.z);
    if (!bias) return out;
    // sit the pin *on* the skin: a hair off the surface, pushed away from the
    // model core so it never z-fights, but close enough to read as attached
    const off = out.clone().sub(new THREE.Vector3(0, size.y * 0.45, 0));
    if (off.lengthSq() > 1e-6) out.add(off.normalize().multiplyScalar(0.022));
    return out;
  }

  /**
   * Land on the topmost surface at the anchor's footprint position, dropping
   * in from above the whole model. Starting above rather than at the anchor's
   * own height is what makes this reliable: over open sky it finds the
   * courtyard floor, over built mass it finds the roof, and it can never
   * start underneath the surface it was meant to land on. A few nearby
   * samples cover holes in the geometry  -  a basin, a light well.
   */
  /**
   * Top-surface height field over the model's footprint, sampled once by
   * dropping rays from above. It is what lets a pin find "the roof" or "the
   * courtyard" on a dwelling whose shape the data knows nothing about.
   */
  private heightField(model: LoadedModel, ray: THREE.Raycaster): HeightField {
    const cached = this.fields.get(model.structureId);
    if (cached) return cached;
    const n = 20;
    const y = new Float32Array(n * n).fill(NaN);
    let min = Infinity;
    let max = -Infinity;
    const top = model.size.y + 0.15;
    const probe = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        probe.set(((i + 0.5) / n - 0.5) * model.size.x, top, ((j + 0.5) / n - 0.5) * model.size.z);
        ray.set(model.group.localToWorld(probe), DOWN);
        ray.far = model.size.y + 0.6;
        const hit = ray.intersectObjects(model.raycastMeshes, false)[0];
        if (!hit) continue;
        const h = model.group.worldToLocal(hit.point.clone()).y;
        y[j * n + i] = h;
        if (h < min) min = h;
        if (h > max) max = h;
      }
    }
    const field: HeightField = { n, y, min, max };
    this.fields.set(model.structureId, field);
    return field;
  }

  /**
   * Choose the cell of the height field that best answers "roof" or "court",
   * breaking ties by nearness to the authored anchor so the data still says
   * *which* roof or *which* corner of the court is meant.
   */
  private pickCell(model: LoadedModel, field: HeightField, anchor: Vec3, kind: "roof" | "court", eye: THREE.Vector3, ray: THREE.Raycaster) {
    const { n, y, min, max } = field;
    const range = Math.max(1e-4, max - min);
    const roof = kind === "roof";
    // a roof must be near the top of the mass; a court near the bottom
    const limit = roof ? max - range * 0.2 : min + range * 0.32;
    const cellAt = (idx: number) =>
      new THREE.Vector3(
        ((idx % n) + 0.5) / n - 0.5,
        0,
        (Math.floor(idx / n) + 0.5) / n - 0.5,
      ).multiply(new THREE.Vector3(model.size.x, 0, model.size.z)).setY(y[idx] + 0.024);

    for (const central of roof ? [false] : [true, false]) {
      const cands: { idx: number; d: number }[] = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const h = y[j * n + i];
          if (Number.isNaN(h)) continue;
          if (roof ? h < limit : h > limit) continue;
          const cx = (i + 0.5) / n;
          const cz = (j + 0.5) / n;
          // an enclosed court sits inside the footprint, never on its lip
          if (central && (cx < 0.24 || cx > 0.76 || cz < 0.24 || cz > 0.76)) continue;
          cands.push({ idx: j * n + i, d: (cx - anchor[0]) ** 2 + (cz - anchor[2]) ** 2 });
        }
      }
      if (!cands.length) continue;
      cands.sort((p, q) => p.d - q.d);
      // walk out from the anchor and take the first candidate in clear view,
      // so a pin never lands correctly but out of sight behind a roofline
      for (const c of cands.slice(0, 40)) {
        const local = cellAt(c.idx);
        if (this.isVisibleFrom(eye, model.group.localToWorld(local.clone()), model, ray)) return local;
      }
      return cellAt(cands[0].idx);
    }
    return null;
  }

  /**
   * Come in horizontally from outside and stop on the outer skin. Sampling
   * matters more here: a single ray aimed at an arch or window opening sails
   * straight through the building and lands on a far interior wall, so the
   * bundle keeps whichever hit is nearest the outside.
   */
  private castIn(model: LoadedModel, local: THREE.Vector3, ray: THREE.Raycaster, eye: THREE.Vector3) {
    const outward = local.clone().setY(0);
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
    outward.normalize();
    const reach = Math.max(model.size.x, model.size.z) + 0.8;
    const side = new THREE.Vector3().crossVectors(outward, UP).normalize();
    const step = Math.max(model.size.x, model.size.z) * 0.05;
    const ring = [[0, 0], [step, 0], [-step, 0], [0, step], [0, -step], [step * 2, 0]];
    let best: THREE.Intersection | undefined;
    let bestSeen = false;
    // every hit, not just the first  -  the nearest surface is often the top of
    // a low garden wall or podium, and a pin named for a facade belongs on an
    // upright face, so flat-topped hits are skipped
    ray.firstHitOnly = false;
    for (const [du, ds] of ring) {
      const at = local.clone().addScaledVector(UP, du).addScaledVector(side, ds);
      const target = model.group.localToWorld(at.clone());
      const start = model.group.localToWorld(at.addScaledVector(outward, reach));
      ray.set(start, target.sub(start).normalize());
      ray.far = reach * 2.2;
      for (const hit of ray.intersectObjects(model.raycastMeshes, false)) {
        if (!hit.face) continue;
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        if (Math.abs(n.y) > 0.6) continue; // a floor or a coping, not a wall
        if (n.dot(ray.ray.direction) > 0) continue; // back face of a far wall
        const seen = this.isVisibleFrom(eye, hit.point, model, ray);
        ray.firstHitOnly = false;
        if (!best || (seen && !bestSeen) || (seen === bestSeen && hit.distance < best.distance)) {
          best = hit;
          bestSeen = seen;
        }
        break;
      }
    }
    ray.firstHitOnly = true;
    return best;
  }

  /**
   * Anchors are authored against the bounding box, so one placed at the top
   * of the box can hang in the air over a lower roofline. Drop each pin onto
   * the first surface below it  -  within a short search, so anchors that are
   * already on stone (or deliberately inside a courtyard) are left alone.
   */
  /** Where the camera comes to rest for this structure, computed before the
   *  fly-to has run  -  used to prefer pins the visitor can actually see. */
  private restingCamera(structure: Structure, model: LoadedModel) {
    const h = model.size.y;
    const dist = this.fitDistance(structure, 1.3, model);
    const a = THREE.MathUtils.degToRad(structure.camera.azimuth);
    const e = THREE.MathUtils.degToRad(structure.camera.elevation);
    const r = dist * Math.cos(e);
    return new THREE.Vector3(r * Math.sin(a), structure.camera.targetY * h + 0.05 + dist * Math.sin(e), r * Math.cos(a));
  }

  /** Is this world point in clear view from `from`, or is the building in the way? */
  private isVisibleFrom(from: THREE.Vector3, point: THREE.Vector3, model: LoadedModel, ray: THREE.Raycaster) {
    const dir = point.clone().sub(from);
    const dist = dir.length();
    ray.set(from, dir.normalize());
    ray.far = Math.max(0.01, dist - 0.06);
    ray.firstHitOnly = true;
    return ray.intersectObjects(model.raycastMeshes, false).length === 0;
  }

  private snapAnchors(model: LoadedModel, structure: Structure) {
    // Snapping happens at the handover, when the dwelling is still lowered and
    // scaled down mid-dissolve. Every ray here  -  height field, wall probes,
    // visibility  -  has to describe where things will *come to rest*, so the
    // group is put in its final pose for the duration.
    const g = model.group;
    const pose = { p: g.position.clone(), s: g.scale.clone(), r: g.rotation.clone() };
    g.position.set(0, 0, 0);
    g.scale.setScalar(1);
    g.rotation.set(0, 0, 0);
    g.updateMatrixWorld(true);

    const ray = new THREE.Raycaster();
    ray.firstHitOnly = true;
    const eye = this.restingCamera(structure, model);
    structure.hotspots.forEach((hs) => {
      const key = `${model.group.uuid}:${hs.anchor.join(",")}`;
      if (this.snapped.has(key)) return;
      const local = this.boxAnchor(hs.anchor, model, new THREE.Vector3(), false);

      // "none" means the anchor is already the exact spot  -  used for
      // free-standing objects in an open court (a basin, an altar), where
      // both the height-field search and the horizontal wall probe would
      // drag the pin onto whatever mass happens to be tallest or nearest.
      if (hs.snap === "none") {
        this.snapped.set(key, local);
        return;
      }

      if (hs.snap === "roof" || hs.snap === "court") {
        const cell = this.pickCell(model, this.heightField(model, ray), hs.anchor, hs.snap, eye, ray);
        if (cell) {
          this.snapped.set(key, cell);
        }
        return;
      }

      const hit = this.castIn(model, local, ray, eye);
      if (!hit) {
        return;
      }
      // lift the pin just clear of the wall it landed on
      const normal = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : UP.clone();
      const p = hit.point.clone().addScaledVector(normal, 0.024);
      this.snapped.set(key, model.group.worldToLocal(p));
    });

    g.position.copy(pose.p);
    g.scale.copy(pose.s);
    g.rotation.copy(pose.r);
    g.updateMatrixWorld(true);
  }

  anchorToWorld(anchor: Vec3, out = new THREE.Vector3()): THREE.Vector3 {
    if (!this.current) return out.set(0, 0, 0);
    const cached = this.snapped.get(`${this.current.group.uuid}:${anchor.join(",")}`);
    if (cached) out.copy(cached);
    else this.boxAnchor(anchor, this.current, out);
    return this.current.group.localToWorld(out);
  }

  /** Dev-mode only: cast a ray from a canvas-space point (as delivered by a
   *  pointer event) into the model and return the hit as a normalised anchor
   *  triple, exactly like the dblclick anchor-picker. Used by the in-browser
   *  hotspot editor to place and drag pins by pointing at the surface meant. */
  pointerToAnchor(nx: number, ny: number): Vec3 | null {
    if (!this.current) return null;
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    this.raycaster.firstHitOnly = true;
    const hits = this.raycaster.intersectObjects(this.current.raycastMeshes, false);
    if (!hits.length) return null;
    const pt = this.current.group.worldToLocal(hits[0].point.clone());
    const s = this.current.size;
    return [+(pt.x / s.x + 0.5).toFixed(4), +(pt.y / s.y).toFixed(4), +(pt.z / s.z + 0.5).toFixed(4)];
  }

  project(world: THREE.Vector3, w: number, h: number): AnchorProjection {
    const v = this.projScratch.copy(world);
    const distance = v.distanceTo(this.camera.position);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      distance,
      behindCamera: v.z > 1,
      occluded: false,
    };
  }

  /** camera→target distance; the reference depth for pin scaling */
  get cameraDistance() {
    return this.camState.dist;
  }

  private refreshOcclusion() {
    this.occlusionCache.clear();
    if (!this.current) return;
    // The coarse box proxy (see buildRaycastProxy) approximates a structure's
    // full footprint as one solid block. That's fine for hover/click picking,
    // but for occlusion it's actively wrong: any anchor that sits low or near
    // the model's own centre - a figure on open ground, a courtyard fitting -
    // is *inside* that block's volume, so a ray from the camera to it always
    // exits through the block's own near face first and reads as blocked,
    // regardless of viewing angle. These structures' hotspots are all
    // snap:"none" (placed exactly), so skipping occlusion for them just
    // means their pins stay visible, which is the correct behaviour here.
    if (this.current.raycastMeshes !== this.current.meshes) return;
    const camPos = this.camera.position;
    this.raycaster.firstHitOnly = true;
    this._pendingOcclusion?.forEach(({ id, world }) => {
      const dir = this.occScratch.copy(world).sub(camPos);
      const dist = dir.length();
      this.raycaster.set(camPos, dir.normalize());
      // pins rest on the mesh skin, so stop just short of the surface  -
      // anything the ray still hits is genuinely in front of the pin
      this.raycaster.far = Math.max(0.01, dist - 0.05);
      const hits = this.raycaster.intersectObjects(this.current!.raycastMeshes, false);
      this.occlusionCache.set(id, hits.length > 0);
    });
  }

  private _pendingOcclusion: { id: string; world: THREE.Vector3 }[] | null = null;
  queueOcclusion(list: { id: string; world: THREE.Vector3 }[]) {
    this._pendingOcclusion = list;
  }
  isOccluded(id: string) {
    return this.occlusionCache.get(id) ?? false;
  }

  /* ── camera system ─────────────────────────────────────────────── */
  private applyCam() {
    if (!this.controls || !this.camera) return;
    const { az, el, dist, tx, ty, tz } = this.camState;
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    const r = dist * Math.cos(e);
    this.camera.position.set(tx + r * Math.sin(a), ty + dist * Math.sin(e), tz + r * Math.cos(a));
    this.controls.target.set(tx, ty, tz);
    this.controls.update();
  }

  flyTo(az: number, el: number, dist: number, ty: number, dur = 1.4, onDone?: () => void) {
    const target = {
      az,
      el,
      dist,
      tx: 0,
      ty,
      tz: 0,
    };
    if (this.reducedMotion || dur <= 0.01) {
      Object.assign(this.camState, target);
      this.applyCam();
      onDone?.();
      return;
    }
    gsap.to(this.camState, {
      ...target,
      duration: dur,
      ease: "power3.inOut",
      onUpdate: () => this.applyCam(),
      onComplete: onDone,
    });
  }

  /** Distance at which the dwelling sits inside the frame with museum
   *  breathing room on every side, whatever the viewport aspect. Uses the
   *  footprint half-diagonal so the framing survives a full orbit. */
  private fitDistance(structure: Structure, margin = 1.3, model = this.current) {
    if (!model) return 3.6;
    const { size } = model;
    const radius = Math.hypot(size.x, size.z) * 0.5;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const tan = Math.tan(vFov / 2);
    const aspect = this.camera.aspect || 1;
    const forHeight = size.y * 0.5 / tan;
    const forWidth = radius / (tan * aspect);
    return Math.max(forHeight, forWidth, radius) * margin * structure.camera.dist;
  }

  frameStructure(structure: Structure, animate = true, onDone?: () => void) {
    if (!this.current) return;
    this.framedStructure = structure;
    const h = this.current.size.y;
    this.flyTo(
      structure.camera.azimuth,
      structure.camera.elevation,
      this.fitDistance(structure),
      structure.camera.targetY * h + 0.05,
      animate ? 1.5 : 0,
      onDone,
    );
  }

  focusAnchor(anchor: Vec3, structure: Structure, dur = 1.2) {
    if (!this.current) return;
    const world = this.anchorToWorld(anchor);
    const az = this.camState.az;
    gsap.to(this.camState, {
      dist: this.fitDistance(structure, 0.62),
      tx: world.x * 0.72,
      ty: world.y * 0.72 + 0.06,
      tz: world.z * 0.72,
      az,
      duration: this.reducedMotion ? 0 : dur,
      ease: "power3.inOut",
      onUpdate: () => this.applyCam(),
    });
  }

  /* ── modes ─────────────────────────────────────────────────────── */
  setPanMode(on: boolean) {
    if (!this.controls) return;
    this.controls.mouseButtons = {
      LEFT: on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.touches = on
      ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
      : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  }

  setAutoRotate(on: boolean) {
    if (!this.controls) return;
    this.controls.autoRotate = on;
  }

  /** Dev-mode only: suspend orbit/pan/zoom while a hotspot pin is being
   *  dragged, so the camera doesn't fight the raycast the drag is reading. */
  setControlsEnabled(on: boolean) {
    if (!this.controls) return;
    this.controls.enabled = on;
  }

  setGrid(on: boolean) {
    if (this.grid) this.grid.visible = on;
  }

  /** Anything that changes what casts or receives shadow must say so. */
  private afterMaterialChange() {
    this.markShadowDirty(3);
  }

  /**
   * Rebuild the wireframe overlay against whatever is on stage.
   *
   * Each overlay is parented to the mesh it traces, carrying no transform of
   * its own, so it inherits the entire chain the model was normalised through.
   * Copying only the mesh's own local transform onto the model group  -  as this
   * used to  -  skips the normalising scale and the recentre that live on the
   * intermediate node, which drew the overlay far too small and sunk inside
   * the building.
   */
  private buildWireframe() {
    this.clearWireframe();
    if (!this.wireOn || !this.current) return;
    this.current.meshes.forEach((src) => {
      // The building's own textured surface is swapped for pale plaster while
      // the wireframe is up. Drawn over a fully rendered dwelling the lines
      // read as surface detail rather than as structure; over a flat, lit
      // plaster form they read as a drawing. The surface is still there, so
      // edges on the far side stay hidden and the form is legible.
      this.wireSwapped.push({ mesh: src, material: src.material });
      src.material = new THREE.MeshStandardMaterial({
        color: 0xeef2f4,
        roughness: 0.96,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      const mat = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x34424f,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        // lift the lines off the surface they trace, or they z-fight with it
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const overlay = new THREE.Mesh(src.geometry, mat);
      overlay.renderOrder = 2;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      src.add(overlay);
      this.wireOverlays.push(overlay);
    });
    this.markShadowDirty(2);
  }

  private clearWireframe() {
    this.wireOverlays.forEach((o) => {
      o.parent?.remove(o);
      // the geometry is the source mesh's own and is not ours to dispose
      (o.material as THREE.Material).dispose();
    });
    this.wireOverlays = [];
    // restore from the record rather than from `current`, so a swap that
    // happens while the layer is up still puts the old dwelling back
    this.wireSwapped.forEach(({ mesh, material }) => {
      const plaster = mesh.material;
      mesh.material = material;
      if (Array.isArray(plaster)) plaster.forEach((m) => m.dispose());
      else plaster.dispose();
    });
    this.wireSwapped = [];
  }

  setWireframe(on: boolean) {
    this.wireOn = on;
    this.buildWireframe();
    this.afterMaterialChange();
  }

  setXray(on: boolean) {
    this.xrayOn = on;
    if (!this.current) return;
    this.current.meshes.forEach((m) => {
      const mat = m.material as any;
      mat.transparent = on;
      mat.opacity = on ? 0.42 : 1;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
    });
    this.afterMaterialChange();
  }

  zoomBy(factor: number) {
    const d = THREE.MathUtils.clamp(this.camState.dist * factor, this.controls.minDistance, this.controls.maxDistance);
    gsap.to(this.camState, { dist: d, duration: 0.4, ease: "power2.out", onUpdate: () => this.applyCam() });
  }

  /** keyboard orbit support */
  nudge(dAz: number, dEl: number) {
    this.camState.az += dAz;
    this.camState.el = THREE.MathUtils.clamp(this.camState.el + dEl, 10, 82);
    this.applyCam();
  }

  setHighlight(anchor: Vec3 | null) {
    if (!this.glowShell) return;
    if (anchor === null) {
      this.glowShell.visible = false;
      return;
    }
    const world = this.anchorToWorld(anchor);
    this.glowShell.position.copy(this.stage.worldToLocal(world.clone()));
    this.glowShell.visible = true;
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  onFrame(cb: FrameCallback) {
    this.frameCbs.add(cb);
    return () => this.frameCbs.delete(cb);
  }

  get readyState() {
    return this.ready;
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    window.clearTimeout(this.anchorPickTimer);
    document.getElementById("atlas-anchor-pick")?.remove();
    this.resizeObs?.disconnect();
    this.flushRetired();
    if (this.current) this.disposeModel(this.current);
    this.cache.forEach((_v, id) => this.disposeCached(id));
    this.envTex?.dispose();
    this.warmTarget?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
  }
}
