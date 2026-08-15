import { memo } from "react";
import type { Structure, StructureSection } from "@/types/structure";
import { withBase } from "@/lib/utils";
import { ArrowRightIcon } from "./icons";

interface Props {
  structure: Structure;
  onOpen: (section: string) => void;
}

const CompassRose = () => (
  <svg viewBox="0 0 48 48" className="pointer-events-none absolute right-2.5 top-2.5 h-9 w-9 text-ink-soft/70" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="24" cy="24" r="17" opacity="0.5" />
      <path d="M24 6v6M24 36v6M6 24h6M36 24h6" />
      <path d="M24 11l3 13-3 13-3-13 3-13z" fill="currentColor" stroke="none" opacity="0.75" />
      <path d="M11 24l13-3 13 3-13 3-13-3z" fill="currentColor" stroke="none" opacity="0.35" />
    </g>
  </svg>
);

export const BottomCards = memo(function BottomCards({ structure, onOpen }: Props) {
  const cards: { key: string; data: StructureSection; compass?: boolean }[] = [
    { key: "interior", data: structure.interior },
    { key: "floorPlan", data: structure.floorPlan },
    { key: "artifacts", data: structure.artifacts },
    { key: "dailyLife", data: structure.dailyLife },
    { key: "geography", data: structure.geography, compass: true },
    ...(structure.extras ?? []).map((e) => ({ key: e.id, data: e })),
  ];

  return (
    /* One per row on a phone, two on a tablet, and the full five-across row
       once the desktop stage is in play. Rows size to their content rather
       than to a fixed height, so the artwork keeps its own proportions at
       every width instead of being letterboxed into a short, wide box. */
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" data-panel="bottom">
      {cards.map(({ key, data, compass }) => (
        <article key={key} className="bottom-card atlas-card flex min-w-0 flex-col p-3">
          <div className="flex-none">
            <span className="kicker !text-[0.66rem]">{data.kicker}</span>
            <h3 className="font-display mt-0.5 truncate text-[1.02rem] font-bold leading-tight text-ink">{data.title}</h3>
          </div>
          {/* the artwork is 3:2 and so is its frame, so it fills the card's
              full width at its true proportions  -  nothing cropped, nothing
              stretched, and no empty margins down either side */}
          <div className="relative mt-2 aspect-[3/2] w-full overflow-hidden rounded-lg border border-line-warm bg-paper-deep">
            <img
              src={data.image && withBase(data.image)}
              alt={data.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
            {compass && <CompassRose />}
          </div>
          <button
            className="btn-outline w-full flex-none !mt-2.5 !justify-between !rounded-lg !border-line-warm !py-2 px-3 !text-[0.78rem]"
            onClick={() => onOpen(key)}
          >
            {data.cta}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </article>
      ))}
    </div>
  );
});
