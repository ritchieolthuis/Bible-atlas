import { useEffect, useRef, useState } from "react";
import type { Structure, Vec3 } from "@/types/structure";
import type { ViewerEngine } from "@/three/engine";

/** Temporary, dev-only coordinate inspector. Enabled with `?dev=1` in the
 *  URL. Click anywhere on the model to read off its normalised anchor
 *  coordinate - the same triple the structure's `hotspots[].anchor` field
 *  takes - so a position can be pointed at and described instead of guessed
 *  or dragged by hand. Existing hotspots are shown as small labelled dots so
 *  it's obvious what's already placed and where. Read-only: nothing here
 *  writes to disk. Meant to be deleted (this file and its one line of wiring
 *  in Viewer.tsx) once every structure's hotspots are placed. */

interface Props {
  engine: ViewerEngine | null;
  structure: Structure;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface Pick {
  anchor: Vec3;
  x: number;
  y: number;
  nearest: { id: string; title: string; dist: number } | null;
}

function dist3(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function DevHotspotEditor({ engine, structure, containerRef }: Props) {
  const [pick, setPick] = useState<Pick | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !engine) return;
    const onClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const anchor = engine.pointerToAnchor(nx, ny);
      if (!anchor) {
        setPick(null);
        return;
      }
      let nearest: Pick["nearest"] = null;
      for (const hs of structure.hotspots) {
        const d = dist3(anchor, hs.anchor);
        if (!nearest || d < nearest.dist) nearest = { id: hs.id, title: hs.title, dist: d };
      }
      setCopied(false);
      setPick({ anchor, x: e.clientX - rect.left, y: e.clientY - rect.top, nearest });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [engine, structure, containerRef]);

  const snippet = pick ? `anchor: [${pick.anchor.join(", ")}],` : "";

  return (
    <>
      {/* existing hotspots, shown read-only so it's clear what's already placed */}
      <DevMarkers engine={engine} structure={structure} containerRef={containerRef} />

      {/* crosshair at the last click */}
      {pick && (
        <div
          style={{
            position: "absolute",
            left: pick.x - 9,
            top: pick.y - 9,
            width: 18,
            height: 18,
            zIndex: 95,
            pointerEvents: "none",
            border: "2px solid #e6a020",
            borderRadius: "50%",
            boxShadow: "0 0 0 2px rgba(0,0,0,.5)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 100,
          width: 300,
          background: "rgba(20,22,26,0.94)",
          color: "#f1f1f1",
          borderRadius: 12,
          padding: 14,
          font: "12px/1.5 ui-monospace, Menlo, monospace",
          boxShadow: "0 8px 30px rgba(0,0,0,.4)",
        }}
      >
        <strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
          Dev: Coördinaten ({structure.hotspots.length} hotspots)
        </strong>
        <div style={{ opacity: 0.7, marginBottom: 10 }}>Klik op het model om de anchor van dat punt af te lezen.</div>

        {pick ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                background: "#1c1e22",
                border: "1px solid #3a3f47",
                borderRadius: 6,
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <code style={{ fontSize: 12 }}>[{pick.anchor.map((n) => n.toFixed(3)).join(", ")}]</code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(snippet).catch(() => {});
                  setCopied(true);
                }}
                style={{
                  background: copied ? "#3a6ea5" : "#2b6cb0",
                  border: "none",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Gekopieerd" : "Kopieer"}
              </button>
            </div>

            {pick.nearest && (
              <div style={{ opacity: 0.75 }}>
                Dichtstbijzijnde hotspot: <strong>{pick.nearest.title || pick.nearest.id}</strong>
                <br />
                afstand: {pick.nearest.dist.toFixed(3)}
              </div>
            )}
          </div>
        ) : (
          <div style={{ opacity: 0.5 }}>Nog niet geklikt.</div>
        )}

        <div style={{ borderTop: "1px solid #3a3f47", marginTop: 12, paddingTop: 10, opacity: 0.7 }}>
          Bestaande hotspots:
          <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
            {structure.hotspots.map((h) => (
              <li key={h.id}>
                {h.title || h.id} — [{h.anchor.map((n) => n.toFixed(2)).join(", ")}]
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/** Small read-only labelled dots over every existing hotspot, so it's clear
 *  what's already placed while picking new coordinates. */
function DevMarkers({
  engine,
  structure,
  containerRef,
}: {
  engine: ViewerEngine | null;
  structure: Structure;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const refs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (!engine) return;
    const off = engine.onFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      for (const hs of structure.hotspots) {
        const dot = refs.current.get(hs.id);
        if (!dot) continue;
        const world = engine.anchorToWorld(hs.anchor);
        const p = engine.project(world, w, h);
        dot.style.transform = `translate3d(${p.x - 5}px, ${p.y - 5}px, 0)`;
        dot.style.display = p.behindCamera ? "none" : "block";
      }
    });
    return off;
  }, [engine, structure, containerRef]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, pointerEvents: "none" }}>
      {structure.hotspots.map((hs) => (
        <div
          key={hs.id}
          ref={(el) => {
            if (el) refs.current.set(hs.id, el);
            else refs.current.delete(hs.id);
          }}
          title={hs.title}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#2c4757",
            border: "2px solid #ffffff",
            boxShadow: "0 2px 6px rgba(0,0,0,.5)",
          }}
        />
      ))}
    </div>
  );
}
