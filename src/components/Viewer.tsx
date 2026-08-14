import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Empire, Vec3 } from "@/types/empire";
import { empiresFor } from "@/data";
import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { ViewerEngine, IS_LOW_MEMORY_DEVICE } from "@/three/engine";
import { HotspotLayer } from "./HotspotLayer";
import {
  RotateIcon,
  RotateCcwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PanIcon,
  LayersIcon,
  VaseIcon,
  TimelineIcon,
  ResetIcon,
  BulbIcon,
  CloseIcon,
  GridIcon,
  WireIcon,
  XrayIcon,
  EyeIcon,
  CheckIcon,
  ChevronDownIcon,
} from "./icons";

interface ViewerProps {
  empire: Empire; // the empire the viewer should display
  onSwap: (e: Empire) => void; // called mid-transition: panels should update
  reducedMotion: boolean;
  animating: boolean;
  onToggleAnimate?: () => void;
  focusHotspot: string | null;
  onFocusHandled: () => void;
  onArtifacts: () => void;
  onTimeline: () => void;
  /** hands the parent a way to warm a dwelling before it is picked */
  onPrefetchReady?: (prefetch: (e: Empire) => void) => void;
}

type ToolMode = "rotate" | "pan";

export const Viewer = memo(function Viewer({
  empire,
  onSwap,
  reducedMotion,
  animating,
  onToggleAnimate,
  focusHotspot,
  onFocusHandled,
  onArtifacts,
  onTimeline,
  onPrefetchReady,
}: ViewerProps) {
  const { locale } = useLocale();
  const t = useStrings(locale).viewer;
  const catLabel = useStrings(locale).hotspotCategory;
  const EMPIRES = empiresFor(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);
  const currentEmpireRef = useRef<Empire | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(false);
  const [loading, setLoading] = useState<{ name: string; pct: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolMode>("rotate");
  const [layersOpen, setLayersOpen] = useState(false);
  const layersRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState({ labels: true, grid: false, wire: false, xray: false });
  const [tipVisible, setTipVisible] = useState(true);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const requestRef = useRef(0);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Anchors are authored against the default model. A variant is a separate
     export with its own bounds and orientation, so while one is shown its
     own anchors apply: overridden where the feature sits elsewhere, dropped
     where the variant does not show that feature at all. */
  const shownEmpire = useMemo(() => {
    const overrides = empire.modelVariants?.find((v) => v.id === activeVariantId)?.anchors;
    if (!overrides) return empire;
    const hotspots = empire.hotspots
      .filter((hs) => overrides[hs.id] !== null)
      .map((hs) => (overrides[hs.id] ? { ...hs, anchor: overrides[hs.id] as Vec3 } : hs));
    return { ...empire, hotspots };
  }, [empire, activeVariantId]);

  const activeHs = shownEmpire.hotspots.find((h) => h.id === activeId) ?? null;

  /* ── engine lifecycle ── */
  useEffect(() => {
    const engine = new ViewerEngine(canvasRef.current!);
    engineRef.current = engine;
    let cancelled = false;
    engine.init().then(async () => {
      if (cancelled) return;
      engine.setReducedMotion(reducedMotion);
      engine.onLoadProgress = (pct) => {
        setLoading((l) => (l ? { ...l, pct } : null));
      };
      setEngineReady(true);
      onPrefetchReady?.((e) => engine.preload(e));
      await presentEmpire(empire, { initial: true });
    });
    return () => {
      cancelled = true;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    engineRef.current?.setAutoRotate(animating);
  }, [animating]);

  useEffect(() => {
    engineRef.current?.setPanMode(tool === "pan");
  }, [tool]);

  /* dismiss the layers menu on an outside click, or on Escape */
  useEffect(() => {
    if (!layersOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!layersRef.current?.contains(e.target as Node)) setLayersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLayersOpen(false);
    };
    // capture, so the menu closes even when the click lands on the canvas,
    // which stops propagation for its own orbit handling
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [layersOpen]);

  /* ── empire switching ── */
  /* Every request gets a token. A newer request supersedes an older one at
     any point  -  while its model is still downloading, or mid-animation  -  so
     rapid clicking always lands on the last dwelling picked instead of
     dropping the clicks that arrive during a swap. */
  const presentEmpire = useCallback(
    async (next: Empire, opts: { initial?: boolean, variantId?: string } = {}) => {
      const engine = engineRef.current;
      if (!engine) return;
      
      const targetVariantId = opts.variantId || next.modelVariants?.[0]?.id || null;
      const isSameEmpire = currentEmpireRef.current?.id === next.id;
      // If we are already showing this empire AND this variant, do nothing
      if (isSameEmpire && activeVariantId === targetVariantId && !opts.initial) return;
      
      const token = ++requestRef.current;
      currentEmpireRef.current = next;
      setActiveId(null);
      setHoverId(null);
      setMarkersVisible(false);
      setActiveVariantId(targetVariantId);

      // loading state if the fetch is slow
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      loadingTimer.current = setTimeout(() => {
        if (token === requestRef.current) setLoading({ name: next.dwelling, pct: 8 });
      }, 400);
      
      const variantPath = targetVariantId ? next.modelVariants?.find(v => v.id === targetVariantId)?.path : undefined;
      const model = await engine.load(next, variantPath).catch((e) => {
        console.error("model load failed", e);
        return null;
      });
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      if (token !== requestRef.current) return; // a newer pick won while loading
      setLoading(null);

      if (!model) {
        onSwap(next);
        engine.clearStage?.(); // We will add this to engine
        return;
      }

      // the engine drives the exchange; panels flip at the handover so copy
      // and geometry change on the same beat
      await engine.transition(model, next, {
        instant: opts.initial,
        onMidpoint: () => {
          if (token === requestRef.current) onSwap(next);
        },
      });
      if (token !== requestRef.current) return; // superseded mid-animation

      setMarkersVisible(true);

      // warm the neighbours so the next pick is already in memory  -  skipped
      // on touch/low-memory devices, where the initial model alone can
      // already sit close to the practical GPU memory ceiling (iOS Safari)
      if (!IS_LOW_MEMORY_DEVICE) {
        const idx = EMPIRES.findIndex((e) => e.id === next.id);
        window.setTimeout(() => {
          if (token !== requestRef.current) return;
          engine.preload(EMPIRES[(idx + 1) % EMPIRES.length]);
          engine.preload(EMPIRES[(idx - 1 + EMPIRES.length) % EMPIRES.length]);
        }, 1200);
      }
    },
    [onSwap, activeVariantId],
  );

  /* react to requested empire changes */
  useEffect(() => {
    if (engineReady && currentEmpireRef.current?.id !== empire.id) {
      void presentEmpire(empire);
    }
  }, [empire, engineReady, presentEmpire]);

  /* external hotspot focus (from search) */
  useEffect(() => {
    if (focusHotspot) {
      setActiveId(focusHotspot);
      onFocusHandled();
    }
  }, [focusHotspot, onFocusHandled]);

  /* camera + highlight follow the active marker */
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady) return;
    if (activeHs) {
      engine.focusAnchor(activeHs.anchor, empire);
      engine.setHighlight(activeHs.anchor);
    } else {
      engine.setHighlight(null);
    }
  }, [activeId, engineReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetView = useCallback(() => {
    setActiveId(null);
    engineRef.current?.frameEmpire(empire, true);
    setTool("rotate");
  }, [empire]);

  /* layer toggles */
  const toggleLayer = (key: "labels" | "grid" | "wire" | "xray") => {
    const next = { ...layers, [key]: !layers[key] };
    setLayers(next);
    const engine = engineRef.current;
    if (!engine) return;
    if (key === "grid") engine.setGrid(next.grid);
    if (key === "wire") engine.setWireframe(next.wire);
    if (key === "xray") engine.setXray(next.xray);
  };

  const LAYER_ITEMS: { key: "labels" | "grid" | "wire" | "xray"; label: string; icon: typeof GridIcon }[] = [
    { key: "labels", label: t.layerLabels, icon: EyeIcon },
    { key: "grid", label: t.layerGrid, icon: GridIcon },
    { key: "wire", label: t.layerWire, icon: WireIcon },
    { key: "xray", label: t.layerXray, icon: XrayIcon },
  ];

  return (
    <div className="atlas-card relative h-full w-full overflow-hidden" data-panel="viewer">
      <div
        ref={containerRef}
        className="viewer-stage absolute inset-0"
        role="application"
        aria-label={t.stageAria(empire.dwelling)}
        tabIndex={0}
        onKeyDown={(e) => {
          const eng = engineRef.current;
          if (!eng) return;
          const step = e.shiftKey ? 18 : 8;
          if (e.key === "ArrowLeft") eng.nudge(-step, 0);
          else if (e.key === "ArrowRight") eng.nudge(step, 0);
          else if (e.key === "ArrowUp") eng.nudge(0, step * 0.6);
          else if (e.key === "ArrowDown") eng.nudge(0, -step * 0.6);
          else if (e.key === "+" || e.key === "=") eng.zoomBy(0.85);
          else if (e.key === "-" || e.key === "_") eng.zoomBy(1.18);
          else if (e.key === "Home") resetView();
          else return;
          e.preventDefault();
        }}
      >
        <canvas ref={canvasRef} className="block h-full w-full touch-none" aria-label={t.canvasAria(empire.dwelling)} />
        {/* holds the outgoing frame still while the next dwelling takes its
            place underneath, so a swap dissolves instead of blinking */}
      </div>

      {/* pins fixed to the dwelling */}
      <HotspotLayer
        engine={engineReady ? engineRef.current : null}
        empire={shownEmpire}
        containerRef={containerRef}
        activeId={activeId}
        hoverId={hoverId}
        onHover={setHoverId}
        onActivate={setActiveId}
        visible={markersVisible && layers.labels}
      />

      {/* ── tool rail ── */}
      <div className="absolute left-2 top-1/2 z-30 -translate-y-1/2 md:left-3" role="toolbar" aria-label={t.toolsAria} aria-orientation="vertical">
        {/* px keeps the active pill clear of the rail's own edges */}
        <div className="atlas-card flex w-[46px] flex-col items-center gap-0.5 !rounded-2xl px-1.5 py-2 sm:w-[58px] md:w-[68px] md:px-2 md:py-2.5">
          <button className={`tool-btn ${tool === "rotate" ? "is-on" : ""}`} onClick={() => setTool("rotate")} aria-pressed={tool === "rotate"}>
            <RotateIcon />
            <span>{t.rotate}</span>
          </button>
          <button className={`tool-btn ${tool === "pan" ? "is-on" : ""}`} onClick={() => setTool(tool === "pan" ? "rotate" : "pan")} aria-pressed={tool === "pan"}>
            <PanIcon />
            <span>{t.pan}</span>
          </button>
          {/* zoom acts on the camera directly rather than arming a mode, so it
              takes two plain buttons instead of a toggle that hides them */}
          <button className="tool-btn" onClick={() => engineRef.current?.zoomBy(0.78)}>
            <ZoomInIcon />
            <span>{t.zoomIn}</span>
          </button>
          <button className="tool-btn" onClick={() => engineRef.current?.zoomBy(1.28)}>
            <ZoomOutIcon />
            <span>{t.zoomOut}</span>
          </button>
          <div className="relative" ref={layersRef}>
            <button className={`tool-btn ${layersOpen ? "is-on" : ""}`} onClick={() => setLayersOpen((v) => !v)} aria-expanded={layersOpen} aria-haspopup="true">
              <LayersIcon />
              <span>{t.layers}</span>
            </button>
            {layersOpen && (
              <div className="atlas-card absolute left-[52px] top-0 z-40 w-[168px] !rounded-xl p-1.5 sm:left-[70px]" role="menu">
                {LAYER_ITEMS.map((it) => (
                  <button
                    key={it.key}
                    role="menuitemcheckbox"
                    aria-checked={layers[it.key]}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[0.8rem] text-ink-soft transition-colors hover:bg-paper-deep"
                    onClick={() => toggleLayer(it.key)}
                  >
                    <it.icon className="h-4 w-4 text-slateblue" />
                    <span className="flex-1">{it.label}</span>
                    {layers[it.key] && <CheckIcon className="h-3.5 w-3.5 text-terracotta" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="tool-btn" onClick={onArtifacts}>
            <VaseIcon />
            <span>{t.artifacts}</span>
          </button>
          <button className="tool-btn" onClick={onTimeline}>
            <TimelineIcon />
            <span>{t.timeline}</span>
          </button>
          <div className="my-1 h-px w-9 bg-line-warm" />
          <button className="tool-btn" onClick={resetView}>
            <ResetIcon />
            <span>{t.reset}</span>
          </button>
        </div>
      </div>

      {/* ── 3D-model accuracy disclaimer  -  top-right corner of the stage ── */}
      <div className="atlas-card absolute top-3 right-3 z-20 hidden w-[220px] !rounded-2xl border border-line-strong bg-[#eef2f4]/95 p-3 shadow-card backdrop-blur-sm md:top-4 md:right-4 md:block">
        <p className="font-serif text-[0.78rem] leading-snug text-ink-soft">
          {t.disclaimer}
        </p>
      </div>

      {/* ── Model Variant Toggle (Top Center) ── */}
      {empire.modelVariants && empire.modelVariants.length > 1 && (
        <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full border border-line-strong bg-white/95 p-1 shadow-card backdrop-blur-md">
            {empire.modelVariants.map((v) => {
              const isActive = activeVariantId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => presentEmpire(empire, { variantId: v.id })}
                  className={`relative rounded-full px-4 py-1.5 text-[0.84rem] font-medium transition-colors ${
                    isActive ? "text-white" : "text-ink-soft hover:text-ink"
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-terracotta shadow-sm" />
                  )}
                  <span className="relative z-10">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Auto rotate floating pill button  -  bottom-left under reset ── */}
      {/* Hidden on small screens when hotspot card is active to prevent overlap */}
      <div className={`absolute bottom-4 left-2 z-30 md:left-3 transition-opacity duration-200 ${activeHs ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto" : ""}`}>
        <button
          type="button"
          onClick={onToggleAnimate}
          className="atlas-card group flex items-center gap-2 !rounded-full border border-line-strong bg-white/95 px-3 py-1.5 shadow-card backdrop-blur-md transition-all hover:bg-white hover:shadow-md active:scale-[0.98] sm:gap-2.5 sm:px-3.5"
          aria-label={t.autoRotate}
          aria-pressed={animating}
        >
          <RotateCcwIcon className="h-4 w-4 text-ink transition-transform duration-500 group-hover:-rotate-45" />
          <span className="font-serif text-[0.82rem] font-medium text-ink select-none sm:text-[0.88rem]">
            {t.autoRotate}
          </span>
          <div
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              animating ? "bg-[#5B9BD5]" : "bg-[#c5ced3]"
            }`}
          >
            <div
              className={`absolute top-[2.5px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                animating ? "translate-x-[18px]" : "translate-x-[2.5px]"
              }`}
            />
          </div>
        </button>
      </div>

      {/* ── active hotspot detail card ── */}
      {activeHs && (
        <div
          className="atlas-card absolute bottom-0 left-0 right-0 z-30 w-full !rounded-t-2xl !rounded-b-none p-4 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(430px,calc(100%-140px))] sm:-translate-x-1/2 sm:!rounded-2xl"
          role="dialog"
          aria-label={activeHs.title}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="kicker !text-[0.62rem] !text-terracotta">{catLabel[activeHs.category]}</div>
              <h3 className="font-display mt-0.5 text-[1.15rem] font-bold leading-tight text-ink sm:text-[1.25rem]">{activeHs.title}</h3>
            </div>
            <button className="rounded-md p-1 text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink" onClick={() => setActiveId(null)} aria-label={t.closeDetail}>
              <CloseIcon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </button>
          </div>
          <p className="font-serif mt-2 text-[0.95rem] leading-snug text-ink-muted sm:text-[0.98rem]">{activeHs.short}</p>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-soft sm:text-[0.86rem]">{activeHs.detail}</p>
        </div>
      )}

      {/* ── tip card ── */}
      {tipVisible && !activeHs && (
        <div className="absolute bottom-4 right-4 z-30 hidden w-[210px] rounded-2xl border border-line-strong bg-[#eef2f4] p-3.5 shadow-card md:block">
          <div className="flex items-center justify-between">
            <span className="font-display flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink">
              <BulbIcon className="h-4 w-4 text-ink-muted" />
              {t.tip}
            </span>
            <button className="rounded p-0.5 text-ink-muted transition-colors hover:text-ink" onClick={() => setTipVisible(false)} aria-label={t.tipDismiss}>
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="font-serif mt-1.5 text-[0.85rem] leading-snug text-ink-soft">
            {t.tipText}
          </p>
        </div>
      )}

      {/* ── loading experience ── */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper/85 backdrop-blur-[2px]" role="status" aria-live="polite">
          <div className="flex w-[240px] flex-col items-center text-center">
            <svg viewBox="0 0 120 120" className="loading-compass h-20 w-20 text-terracotta" aria-hidden>
              <g fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="60" cy="60" r="46" opacity="0.4" />
                <circle cx="60" cy="60" r="34" opacity="0.25" />
                <path d="M60 14v10M60 96v10M14 60h10M96 60h10" />
                <path d="M60 24l7 36-7 36-7-36 7-36z" fill="currentColor" stroke="none" opacity="0.8" />
                <path d="M24 60l36-7 36 7-36 7-36-7z" fill="currentColor" stroke="none" opacity="0.3" />
              </g>
            </svg>
            <svg viewBox="0 0 160 40" className="mt-3 w-[150px] text-ink-muted" aria-hidden>
              <path className="loading-line" d="M10 34 L50 34 L60 18 L70 30 L80 10 L92 30 L102 18 L112 34 L150 34" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <h3 className="font-display mt-3 text-[1.25rem] font-bold text-ink">{t.loadingPrefix} {loading.name}</h3>
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-line-warm">
              <div className="h-full rounded-full bg-terracotta transition-all duration-300" style={{ width: `${loading.pct}%` }} />
            </div>
            <p className="loading-fact font-serif mt-3 text-[0.85rem] text-ink-muted">{t.loadingFact}</p>
          </div>
        </div>
      )}

      {/* ── scroll-down cue for mobile (canvas traps touch, hint there's more below) ── */}
      {!loading && !activeHs && (
        <div className="scroll-cue absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center xl:hidden" aria-hidden="true">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm">
            <ChevronDownIcon className="h-4 w-4 text-ink-muted" />
          </div>
        </div>
      )}
    </div>
  );
});
