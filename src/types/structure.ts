/** Structure Atlas  -  core data contracts.
 *  The entire application is driven by these types; adding a new structure
 *  means adding data + assets, never touching the viewer or UI. */

export type Vec3 = [number, number, number];

/** Hotspot anchor, expressed in *normalised model space*:
 *  x/z are fractions across the model footprint (0..1, min→max),
 *  y is a fraction of model height (0..1). Converted to world
 *  coordinates after the model is normalised. */
export interface Hotspot {
  id: string;
  title: string;
  /** one-line italic summary shown on the floating label */
  short: string;
  /** longer educational description shown when activated */
  detail: string;
  category: "structure" | "roof" | "court" | "entrance" | "interior" | "artifact-zone" | "facade";
  /** Placed against the model's bounding box; the viewer snaps it onto the
   *  nearest real surface so the pin sits on the building, not in the air. */
  anchor: Vec3;
  /** Which kind of surface the pin belongs on. The viewer resolves this
   *  against the model's own geometry, so a pin lands on the feature it
   *  names whatever the dwelling's shape:
   *  - "roof"  the highest built mass nearest the anchor
   *  - "court" the open low ground enclosed by that mass
   *  - "wall"  the outer skin, met by coming in horizontally from outside
   *  - "none"  the anchor *is* the spot; nothing is searched for
   *  The anchor then only steers *which* roof, court or wall.
   *
   *  Use "none" for a free-standing object inside an open court (a basin,
   *  an altar): "roof"/"court" would run a height-field search that lands
   *  on whatever mass is tallest nearby  -  a flame, a tent ridge  -  and
   *  "wall" would slide the pin sideways onto the perimeter fence. */
  snap?: "roof" | "court" | "wall" | "none";
  /** @deprecated Annotations now appear on hover at the pin, so labels no
   *  longer float at a fixed offset. Retained so existing data still type-checks. */
  labelOffset?: [number, number];
  /** how strongly the camera pushes in when activated (1 = default) */
  focus?: number;
}

export interface KeyFact {
  label: string;
  value: string;
  icon: "period" | "region" | "materials" | "feature" | "occupants";
}

export interface Artifact {
  name: string;
  purpose: string;
  material: string;
  context: string;
}

export interface QuizQuestion {
  q: string;
  choices: string[];
  answer: number;
  explanation: string;
  level?: "easy" | "medium" | "hard";
}

export interface TimelineEntry {
  era: string;
  year: string;
  text: string;
}

export interface CameraPreset {
  /** azimuth in degrees (0 = +Z front, positive orbits right) */
  azimuth: number;
  /** elevation in degrees above horizon */
  elevation: number;
  /** distance multiplier relative to auto-framing */
  dist: number;
  /** vertical framing bias: fraction of model height for look-at */
  targetY: number;
}

export interface StructureSection {
  title: string;
  kicker: string;
  cta: string;
  text: string;
  /** image path under /img */
  image?: string;
}

export interface FloorPlanRoom {
  name: string;
  note?: string;
  /** exact scripture citation for this room/measurement, e.g. \`"...five cubits was the length thereof" - Exodus 38:1 (KJV)\` */
  verse?: string;
  /** small illustrative image for this room/feature, shown alongside the card (path under /img) */
  image?: string;
}

export interface LessonBlock {
  heading: string;
  body: string;
}

/** A target for an inline description link. Reuses the app's existing
 *  navigation primitives (section modal / hotspot focus) so authors only
 *  ever point at things the app already knows how to open. */
export type DescriptionLinkTarget =
  | { kind: "section"; section: "interior" | "floorPlan" | "artifacts" | "dailyLife" | "geography" | (string & {}) }
  | { kind: "hotspot"; hotspotId: string }
  | { kind: "structure"; structureId: string; section?: string; hotspotId?: string };

/** One clickable span inside `description`. `text` must appear verbatim
 *  (exact substring, case-sensitive) in this locale's `description` -
 *  authored once per locale since wording differs (e.g. "Sinear" vs
 *  "Shinar"), each pointing at the same logical target. */
export interface DescriptionLink {
  text: string;
  target: DescriptionLinkTarget;
}

export interface Structure {
  id: string;
  name: string;
  dwelling: string;
  subtitle: string;
  description: string;
  /** Manually curated clickable spans within `description` only  -  never
   *  auto-scanned, so only concepts the page actually explains get linked. */
  descriptionLinks?: DescriptionLink[];
  modelPath: string;
  /** If present, presents a toggle in the UI to switch the 3D model variant */
  /** Alternate models of the same dwelling (an exterior and a cutaway, say).
   *  Each is its own export with its own bounds and orientation, so an anchor
   *  authored against one does not land in the same place in another. A
   *  variant that is not simply a re-render of the default therefore carries
   *  `anchors`: hotspot id → the anchor to use while that model is shown.
   *  Hotspots absent from the map keep their default anchor; hotspots mapped
   *  to null name something this model does not contain, and are hidden. */
  modelVariants?: {
    id: string;
    label: string;
    path: string;
    anchors?: Record<string, Vec3 | null>;
  }[];
  /** per-structure warm accent used for subtle scene tinting */
  tint: string;
  camera: CameraPreset;
  facts: KeyFact[];
  hotspots: Hotspot[];
  interior: StructureSection;
  floorPlan: StructureSection & {
    rooms: FloorPlanRoom[];
    /** Optional annotated reference diagram, rendered between the lead
     *  paragraph and the room cards. Distinct from `image` (the hero shot
     *  at the top of the modal); this is a supplementary labelled plan. */
    diagramImage?: string;
  };
  artifacts: StructureSection & { items: Artifact[] };
  dailyLife: StructureSection;
  geography: StructureSection & { regionLabel: string };
  /** Extra structure-specific cards beyond the fixed five  -  for iconic
   *  features unique to one dwelling (e.g. Solomon's twin pillars) that
   *  don't belong under Sacred Objects or any other shared section. */
  extras?: (StructureSection & { id: string })[];
  lesson: { title: string; intro: string; blocks: LessonBlock[] };
  quiz: QuizQuestion[];
  timeline: TimelineEntry[];
  keywords: string[];
}
