import { memo, useEffect, useState } from "react";
import { TempleIcon } from "./icons";
import type { Locale } from "@/i18n/locale";
import { withBase } from "@/lib/utils";

interface Props {
  onDone: () => void;
  locale: Locale;
}

const COPY: Record<Locale, { kicker: string; title: string; subtitle: string }> = {
  nl: { kicker: "De 3D Bijbel", title: "De Voorhoven Worden Voorbereid", subtitle: "Het Huis des HEEREN wordt getekend…" },
  en: { kicker: "The 3D Bible", title: "Preparing the Temple Courts", subtitle: "Drawing the House of the LORD…" },
};

/** A once-per-visit intro screen: a hand-drawn temple elevation sketches
 *  itself in on a parchment card while the app mounts behind it, then
 *  fades away. Purely decorative gate, not a real asset-loading gate  -
 *  it runs for a fixed, short duration regardless of how fast the app
 *  behind it is actually ready. */
export const IntroScreen = memo(function IntroScreen({ onDone, locale }: Props) {
  const [leaving, setLeaving] = useState(false);
  const { kicker, title, subtitle } = COPY[locale];

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 2600);
    const doneTimer = setTimeout(onDone, 3100);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#eef1f2] px-5 transition-opacity duration-500 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
    >
      <div className="intro-sheet relative w-full max-w-[420px] rounded-[3px] bg-[#f4f6f7] px-8 pb-9 pt-11 text-center shadow-[0_2px_0_#d7dee1_inset,0_30px_60px_-20px_rgba(30,40,48,0.14),0_8px_20px_-10px_rgba(30,40,48,0.14)]">
        {[
          "left-2.5 top-2.5",
          "right-2.5 top-2.5 -scale-x-100",
          "left-2.5 bottom-2.5 -scale-y-100",
          "right-2.5 bottom-2.5 scale-[-1]",
        ].map((pos) => (
          <svg key={pos} viewBox="0 0 30 30" className={`absolute h-[26px] w-[26px] opacity-55 ${pos}`} aria-hidden>
            <path d="M2 2 Q2 16 16 16 M2 2 Q16 2 16 16" fill="none" stroke="#a97c3f" strokeWidth="1" />
          </svg>
        ))}

        <p className="intro-kicker flex items-center justify-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#a97c3f]">
          <TempleIcon className="h-4 w-4 flex-none text-terracotta" aria-hidden />
          {kicker}
        </p>

        <div className="intro-drawing mx-auto mt-5 w-full max-w-[280px]" style={{ aspectRatio: "300 / 200" }}>
          <svg viewBox="0 0 300 200" className="h-full w-full overflow-visible" role="img" aria-hidden>
            <g className="intro-sun">
              <circle cx="246" cy="42" r="14" fill="none" stroke="#a97c3f" strokeWidth="1" opacity="0.7" />
              <circle cx="246" cy="42" r="4" fill="#ebc83f" />
              <g stroke="#a97c3f" strokeWidth="1" opacity="0.6">
                <path d="M246 20v-7M246 71v-7M224 42h-7M275 42h-7M231 27l-5-5M266 57l-5-5M261 27l5-5M226 57l5-5" />
              </g>
            </g>

            <g className="intro-compass" transform="translate(258,150)">
              <circle r="16" fill="none" stroke="#a97c3f" strokeWidth="0.7" opacity="0.5" />
              <path d="M0 -16 L2.5 -2.5 L0 16 L-2.5 -2.5 Z" fill="#1d2b33" opacity="0.28" />
              <path d="M-16 0 L-2.5 2.5 L16 0 L-2.5 -2.5 Z" fill="#1d2b33" opacity="0.14" />
              <circle cx="-7" cy="7" r="2.2" fill="#ebc83f" />
              <circle cx="7" cy="7" r="2.2" fill="#93be2f" />
              <circle cx="0" cy="0" r="2.6" fill="#46a7e6" />
            </g>

            <path className="intro-wash" style={{ "--d": "2.0s" } as React.CSSProperties} d="M20 168 L280 168 L280 174 L20 174 Z" />

            <path className="intro-line" style={{ "--len": 264, "--d": "0s" } as React.CSSProperties} d="M18 168 L282 168" />
            <path className="intro-line" style={{ "--len": 120, "--d": "0.15s" } as React.CSSProperties} d="M96 168 L96 160 L204 160 L204 168" />
            <path className="intro-line" style={{ "--len": 104, "--d": "0.3s" } as React.CSSProperties} d="M104 160 L104 152 L196 152 L196 160" />
            <path className="intro-line" style={{ "--len": 200, "--d": "0.45s" } as React.CSSProperties} d="M108 152 L108 142 L192 142 L192 152" />

            <path className="intro-line" style={{ "--len": 60, "--d": "0.6s" } as React.CSSProperties} d="M116 142 L116 82" />
            <path className="intro-line" style={{ "--len": 60, "--d": "0.68s" } as React.CSSProperties} d="M132 142 L132 82" />
            <path className="intro-line" style={{ "--len": 60, "--d": "0.76s" } as React.CSSProperties} d="M148 142 L148 82" />
            <path className="intro-line" style={{ "--len": 60, "--d": "0.84s" } as React.CSSProperties} d="M164 142 L164 82" />
            <path className="intro-line" style={{ "--len": 60, "--d": "0.92s" } as React.CSSProperties} d="M180 142 L180 82" />

            <path className="intro-line" style={{ "--len": 180, "--d": "1.15s" } as React.CSSProperties} d="M108 82 L192 82" />
            <path className="intro-line" style={{ "--len": 12, "--d": "1.2s" } as React.CSSProperties} d="M116 82 L116 78" />
            <path className="intro-line" style={{ "--len": 12, "--d": "1.23s" } as React.CSSProperties} d="M132 82 L132 78" />
            <path className="intro-line" style={{ "--len": 12, "--d": "1.26s" } as React.CSSProperties} d="M148 82 L148 78" />
            <path className="intro-line" style={{ "--len": 12, "--d": "1.29s" } as React.CSSProperties} d="M164 82 L164 78" />
            <path className="intro-line" style={{ "--len": 12, "--d": "1.32s" } as React.CSSProperties} d="M180 82 L180 78" />

            <path className="intro-line" style={{ "--len": 200, "--d": "1.4s" } as React.CSSProperties} d="M104 78 L104 70 L196 70 L196 78" />

            <path className="intro-line" style={{ "--len": 190, "--d": "1.65s" } as React.CSSProperties} d="M96 70 L150 34 L204 70" />
            <path className="intro-fill" style={{ "--d": "2.1s" } as React.CSSProperties} d="M96 70 L150 34 L204 70 L196 70 L150 42 L104 70 Z" opacity="0.08" fill="#1d2b33" />

            <path className="intro-line" style={{ "--len": 20, "--d": "1.95s" } as React.CSSProperties} d="M150 34 L150 24" />
            <circle className="intro-fill" style={{ "--d": "2.2s" } as React.CSSProperties} cx="150" cy="20" r="3" opacity="0.5" fill="#3C5E70" />

            <path className="intro-line" style={{ "--len": 70, "--d": "1.5s" } as React.CSSProperties} d="M56 168 L56 140 M50 148 Q56 138 62 148 M48 156 Q56 144 64 156" opacity="0.65" />
            <path className="intro-line" style={{ "--len": 70, "--d": "1.6s" } as React.CSSProperties} d="M244 168 L244 140 M238 148 Q244 138 250 148 M236 156 Q244 144 252 156" opacity="0.65" />
          </svg>
        </div>

        <h2 className="font-display mt-1.5 text-[1.4rem] font-bold leading-tight text-ink text-balance">{title}</h2>
        <p className="font-serif mt-1.5 text-[0.88rem] italic text-ink-soft">{subtitle}</p>

        <img
          src={withBase("/img/brand/3d-bible-logo.webp")}
          alt="The 3D Bible / De Samenkomst"
          className="mx-auto mt-4 h-8 w-auto opacity-90"
        />
      </div>

      <style>{`
        .intro-sheet { animation: intro-settle 700ms cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes intro-settle {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .intro-line {
          fill: none; stroke: #1d2b33; stroke-width: 1.3;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: var(--len); stroke-dashoffset: var(--len);
          animation: intro-draw 1.8s cubic-bezier(0.65,0,0.35,1) forwards;
          animation-delay: var(--d, 0s);
        }
        .intro-fill { opacity: 0; animation: intro-fade 0.8s ease forwards; animation-delay: var(--d, 0s); }
        .intro-wash { fill: #1d2b33; opacity: 0; animation: intro-wash 1.2s ease forwards; animation-delay: var(--d, 0s); }
        @keyframes intro-draw { to { stroke-dashoffset: 0; } }
        @keyframes intro-fade { to { opacity: 1; } }
        @keyframes intro-wash { to { opacity: 0.06; } }
        .intro-sun { animation: intro-sun-glow 3.2s ease-in-out infinite; animation-delay: 1.6s; }
        @keyframes intro-sun-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.95; } }
        .intro-compass { transform-origin: 258px 150px; animation: intro-compass-spin 18s linear infinite; }
        @keyframes intro-compass-spin { to { transform: rotate(360deg) translate(0,0); } }
        @media (prefers-reduced-motion: reduce) {
          .intro-line, .intro-fill, .intro-wash, .intro-sun, .intro-compass, .intro-sheet { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  );
});
