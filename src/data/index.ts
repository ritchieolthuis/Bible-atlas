import type { Structure } from "@/types/structure";
import type { Locale } from "@/i18n/locale";
import { STRINGS } from "@/i18n/strings";
import { withBase } from "@/lib/utils";
import { STRUCTURES_EN } from "./structures/en";
import { STRUCTURES_NL } from "./structures/nl";

const DATA_BY_LOCALE: Record<Locale, Structure[]> = {
  en: STRUCTURES_EN,
  nl: STRUCTURES_NL,
};

/** Dev-time only: catches authoring mistakes in `descriptionLinks`  -  a
 *  `text` that isn't an exact substring of `description` (retyped instead
 *  of copied, wrong quote characters, ...), or a target that doesn't exist
 *  on this structure. Logs to the console rather than throwing, since a typo
 *  here should never break the page for a real visitor. */
function validateDescriptionLinks(e: Structure) {
  const sectionKeys = ["interior", "floorPlan", "artifacts", "dailyLife", "geography"];
  for (const link of e.descriptionLinks ?? []) {
    if (!e.description.includes(link.text)) {
      console.error(`[descriptionLinks] "${link.text}" not found in ${e.id}.description`);
      continue;
    }
    const t = link.target;
    if (t.kind === "section" && !sectionKeys.includes(t.section) && !e.extras?.some((x) => x.id === t.section)) {
      console.error(`[descriptionLinks] ${e.id}: unknown section "${t.section}" for "${link.text}"`);
    } else if (t.kind === "hotspot" && !e.hotspots.some((h) => h.id === t.hotspotId)) {
      console.error(`[descriptionLinks] ${e.id}: unknown hotspot "${t.hotspotId}" for "${link.text}"`);
    }
  }
}

if (import.meta.env.DEV) {
  for (const list of Object.values(DATA_BY_LOCALE)) for (const e of list) validateDescriptionLinks(e);
}

export const structuresFor = (locale: Locale): Structure[] => DATA_BY_LOCALE[locale];

export const structureById = (locale: Locale, id: string): Structure => {
  const list = DATA_BY_LOCALE[locale];
  return list.find((e) => e.id === id) ?? list[0];
};

export const DEFAULT_EMPIRE_ID = "eden_fall";

/** Resolve per-structure image paths (thumbnail derived from hero set).
 *  Image assets are shared across locales  -  only the text differs. */
export const structureImages = (e: Structure) => ({
  thumbnail: withBase(`/img/${e.id}/thumbnail.webp`),
  hero: withBase(`/img/${e.id}/hero.webp`),
  interior: e.interior.image && withBase(e.interior.image),
  floorPlan: e.floorPlan.image && withBase(e.floorPlan.image),
  artifacts: e.artifacts.image && withBase(e.artifacts.image),
  dailyLife: e.dailyLife.image && withBase(e.dailyLife.image),
  map: e.geography.image && withBase(e.geography.image),
});

/** Global search index built from the dataset */
export interface SearchEntry {
  kind: "structure" | "location" | "feature" | "room" | "artifact" | "material";
  title: string;
  subtitle: string;
  structureId: string;
  hotspotId?: string;
}

export function buildSearchIndex(locale: Locale): SearchEntry[] {
  const t = STRINGS[locale].search;
  const out: SearchEntry[] = [];
  for (const e of DATA_BY_LOCALE[locale]) {
    out.push({ kind: "structure", title: e.name, subtitle: `${e.dwelling}  -  ${e.subtitle}`, structureId: e.id });
    out.push({ kind: "location", title: e.dwelling, subtitle: t.locationOf(e.name), structureId: e.id });
    for (const h of e.hotspots)
      out.push({ kind: "feature", title: h.title, subtitle: `${e.dwelling} · ${h.short}`, structureId: e.id, hotspotId: h.id });
    for (const r of e.floorPlan.rooms)
      out.push({ kind: "room", title: r.name, subtitle: t.layoutOf(e.dwelling), structureId: e.id });
    for (const a of e.artifacts.items)
      out.push({ kind: "artifact", title: a.name, subtitle: `${e.dwelling} · ${a.purpose}`, structureId: e.id });
    for (const k of e.keywords)
      out.push({ kind: "material", title: k, subtitle: t.relatedTo(e.name), structureId: e.id });
  }
  return out;
}
