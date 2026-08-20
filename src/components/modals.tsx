import { memo, useState } from "react";
import type { Structure } from "@/types/structure";
import { structureImages } from "@/data";
import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { withBase } from "@/lib/utils";
import { ModalShell } from "./ModalShell";
import { ScriptureText } from "./ScriptureText";
import { CheckIcon, ArrowRightIcon, QuizIcon, VaseIcon, SearchIcon, CloseIcon, TimelineIcon } from "./icons";

/* ═══ Lesson ═══ */
export const LessonModal = memo(function LessonModal({ structure, onClose, onQuiz }: { structure: Structure; onClose: () => void; onQuiz: () => void }) {
  const { locale } = useLocale();
  const t = useStrings(locale).modals;
  return (
    <ModalShell title={structure.lesson.title} kicker={t.lessonKicker(structure.name)} onClose={onClose} wide>
      <div className="flex gap-5">
        <img src={structureImages(structure).hero} alt="" className="hidden h-28 w-40 flex-none rounded-xl border border-line-warm bg-paper-deep object-contain sm:block" />
        <p className="font-serif text-[1.08rem] italic leading-snug text-ink-soft">{structure.lesson.intro}</p>
      </div>
      <div className="mt-5 space-y-4">
        {structure.lesson.blocks.map((b, i) => (
          <section key={b.heading} className="flex gap-4">
            <span className="font-display flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line-strong bg-paper-deep text-[0.85rem] font-bold text-terracotta">
              {i + 1}
            </span>
            <div>
              <h3 className="font-display text-[1.1rem] font-bold text-ink">{b.heading}</h3>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-soft"><ScriptureText text={b.body} /></p>
            </div>
          </section>
        ))}
      </div>
      <button className="btn-primary mt-6 w-full" onClick={onQuiz}>
        <QuizIcon className="h-4 w-4" />
        {t.lessonCta}
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </ModalShell>
  );
});

/* ═══ Quiz ═══ */
export const QuizModal = memo(function QuizModal({ structure, onClose }: { structure: Structure; onClose: () => void }) {
  const { locale } = useLocale();
  const t = useStrings(locale).modals;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = structure.quiz[step];
  const done = step >= structure.quiz.length;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  return (
    <ModalShell title={done ? t.quizComplete : t.quizQuestionOf(step + 1, structure.quiz.length)} kicker={t.quizKicker(structure.dwelling)} onClose={onClose}>
      {!done ? (
        <>
          <div className="tl-track mb-5"><div className="tl-fill" style={{ width: `${(step / structure.quiz.length) * 100}%` }} /></div>
          <span
            className={`kicker !text-[0.66rem] ${q.level === "easy" ? "!text-[#28a745]" : q.level === "hard" ? "!text-terracotta-deep" : "!text-[#eab308]"}`}
          >
            {q.level === "easy" ? t.levelEasy : q.level === "hard" ? t.levelHard : t.levelMedium}
          </span>
          <h3 className="font-display mt-1 text-[1.3rem] font-bold leading-snug text-ink">{q.q}</h3>
          <div className="mt-4 space-y-2">
            {q.choices.map((c, i) => (
              <button
                key={i}
                disabled={picked !== null}
                onClick={() => pick(i)}
                className={`quiz-choice w-full text-[0.9rem] text-ink-soft ${
                  picked === null ? "" : i === q.answer ? "is-correct" : i === picked ? "is-wrong" : "opacity-60"
                }`}
              >
                <span className="font-display mr-2 font-bold text-terracotta">{String.fromCharCode(65 + i)}.</span>
                {c}
                {picked !== null && i === q.answer && <CheckIcon className="ml-2 inline h-4 w-4 text-[#28a745]" />}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="mt-4 rounded-xl border border-line-warm bg-paper-deep p-4">
              <p className="text-[0.86rem] leading-relaxed text-ink-soft"><ScriptureText text={q.explanation} /></p>
              <button className="btn-primary mt-3 w-full" onClick={() => { setStep(step + 1); setPicked(null); }}>
                {step + 1 === structure.quiz.length ? t.seeResults : t.nextQuestion}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-4 text-center">
          <div className="font-display text-[3.4rem] font-bold leading-none text-terracotta">
            {score}<span className="text-[1.8rem] text-ink-muted">/{structure.quiz.length}</span>
          </div>
          <p className="font-serif mt-2 text-[1.05rem] italic text-ink-soft">
            {score === structure.quiz.length ? t.scorePerfect : score >= 3 ? t.scoreGood : t.scoreLow}
          </p>
          <button className="btn-outline mt-5" onClick={() => { setStep(0); setScore(0); setPicked(null); }}>{t.retakeQuiz}</button>
        </div>
      )}
    </ModalShell>
  );
});

/* ═══ Artifacts ═══ */
export const ArtifactsModal = memo(function ArtifactsModal({ structure, onClose }: { structure: Structure; onClose: () => void }) {
  return (
    <ModalShell title={structure.artifacts.title} kicker={`${structure.artifacts.kicker} · ${structure.name}`} onClose={onClose} wide>
      <div className="relative overflow-hidden rounded-xl border border-line-warm">
        <img src={structureImages(structure).artifacts} alt={structure.artifacts.title} className="block h-auto w-full object-contain" />
      </div>
      <p className="font-serif mt-3 text-[1rem] italic leading-snug text-ink-soft">{structure.artifacts.text}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {structure.artifacts.items.map((a) => (
          <div key={a.name} className="artifact-card group p-4" tabIndex={0}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[1.05rem] font-bold text-ink">{a.name}</h3>
              <VaseIcon className="h-4 w-4 text-terracotta-soft transition-transform group-hover:scale-110" />
            </div>
            <p className="mt-1 text-[0.82rem] font-medium text-terracotta-deep">{a.purpose}</p>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-muted">
              <span className="font-medium text-ink-soft">{a.material}.</span> {a.context}
            </p>
          </div>
        ))}
      </div>
    </ModalShell>
  );
});

/* ═══ Gospel ═══ */
export const GospelModal = memo(function GospelModal({ onClose }: { onClose: () => void }) {
  const { locale } = useLocale();
  const g = useStrings(locale).modals.gospel;
  return (
    <ModalShell title={g.title} kicker={g.kicker} onClose={onClose} wide>
      <p className="font-serif text-[1.05rem] italic leading-snug text-ink-soft">{g.subtitle}</p>
      <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-soft">{g.intro}</p>
      <div className="mt-5 space-y-5">
        {g.steps.map((s, i) => (
          <section key={s.heading} className="flex gap-4">
            <span className="font-display flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line-strong bg-paper-deep text-[0.85rem] font-bold text-terracotta">
              {i + 1}
            </span>
            <div>
              <h3 className="font-display text-[1.1rem] font-bold text-ink">{s.heading}</h3>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-soft"><ScriptureText text={s.body} /></p>
              <div className="mt-3 space-y-2">
                {s.verses.map((v) => (
                  <blockquote key={v.ref} className="border-l-2 border-terracotta/50 pl-3">
                    <p className="font-serif text-[0.88rem] italic leading-snug text-ink-soft">"{v.text}"</p>
                    <cite className="mt-0.5 block text-[0.75rem] not-italic text-ink-muted"><ScriptureText text={v.ref} /></cite>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-line-warm bg-paper-deep p-6">
        <div className="kicker !text-terracotta">{g.prayerKicker}</div>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">{g.prayerIntro}</p>
        <p className="font-serif mt-4 text-[1.05rem] italic leading-relaxed text-ink">{g.prayerText}</p>
      </div>
      <p className="mt-5 text-[0.9rem] leading-relaxed text-ink-soft">{g.afterword}</p>
    </ModalShell>
  );
});

/* ═══ Timeline ═══ */
export const TimelineModal = memo(function TimelineModal({ structure, onClose }: { structure: Structure; onClose: () => void }) {
  const { locale } = useLocale();
  const t = useStrings(locale).modals;
  const [idx, setIdx] = useState(0);
  const tl = structure.timeline[idx];
  return (
    <ModalShell title={t.timelineTitle(structure.name)} kicker={t.timelineKicker} onClose={onClose} wide>
      <div className="px-1 pt-2">
        <input
          type="range"
          min={0}
          max={structure.timeline.length - 1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="w-full accent-[#3C5E70]"
          aria-label={t.timelineKicker}
        />
        <div className="tl-years mt-2 text-[0.68rem] font-medium uppercase tracking-wide text-ink-muted">
          {structure.timeline.map((t2, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`max-w-[90px] text-center leading-tight transition-colors ${i === idx ? "text-terracotta" : ""}`}>
              {t2.year}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-line-warm bg-paper-deep p-6 text-center">
        <div className="kicker !text-terracotta">{tl.era}</div>
        <div className="font-display mt-1 text-[1.9rem] font-bold text-ink">{tl.year}</div>
        <p className="font-serif mx-auto mt-2 max-w-[46ch] text-[1.05rem] leading-snug text-ink-soft">{tl.text}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {structure.timeline.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-terracotta" : "w-1.5 bg-line-strong"}`} />
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[0.8rem] text-ink-muted">
        <TimelineIcon className="h-4 w-4" />
        {t.timelineHint}
      </div>
    </ModalShell>
  );
});

/* ═══ Image detail (interior / floor plan / daily life / map) ═══ */
export const SectionModal = memo(function SectionModal({
  structure,
  section,
  onClose,
}: {
  structure: Structure;
  section: string;
  onClose: () => void;
}) {
  const fixed = section === "interior" || section === "floorPlan" || section === "dailyLife" || section === "geography";
  const data = fixed ? structure[section as "interior" | "floorPlan" | "dailyLife" | "geography"] : structure.extras?.find((e) => e.id === section);
  if (!data) return null;
  const rooms = section === "floorPlan" ? structure.floorPlan.rooms : null;
  return (
    <ModalShell title={data.title} kicker={`${data.kicker} · ${structure.dwelling}`} onClose={onClose} wide>
      <div className="overflow-hidden rounded-xl border border-line-warm bg-paper-deep">
        <img src={data.image && withBase(data.image)} alt={data.title} className="w-full object-contain" />
      </div>
      {section === "geography" && (
        <div className="kicker mt-3 !text-terracotta">{structure.geography.regionLabel}</div>
      )}
      <p className="font-serif mt-3 text-[1.05rem] leading-snug text-ink-soft"><ScriptureText text={data.text} /></p>
      {section === "floorPlan" && structure.floorPlan.diagramImage && (
        <div className="mt-4 overflow-hidden rounded-xl border border-line-warm bg-paper-deep">
          <img src={withBase(structure.floorPlan.diagramImage)} alt={`${data.title} diagram`} className="w-full object-contain" />
        </div>
      )}
      {rooms && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rooms.map((r) => (
            <div key={r.name} className="artifact-card overflow-hidden p-0">
              {r.image && (
                <img src={withBase(r.image)} alt={r.name} className="h-32 w-full object-cover" loading="lazy" />
              )}
              <div className="p-4">
                <h3 className="font-display text-[1.05rem] font-bold text-ink">{r.name}</h3>
                {r.note && <p className="mt-1 text-[0.82rem] font-medium text-terracotta-deep">{r.note}</p>}
                {r.verse && <p className="font-serif mt-1.5 text-[0.8rem] italic leading-relaxed text-ink-muted"><ScriptureText text={r.verse} /></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
});

/* ═══ Search overlay ═══ */
import { buildSearchIndex } from "@/data";

export const SearchOverlay = memo(function SearchOverlay({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (structureId: string, hotspotId?: string) => void;
}) {
  const { locale } = useLocale();
  const t = useStrings(locale).search;
  const [q, setQ] = useState("");
  const index = buildSearchIndex(locale);
  const results = q.trim()
    ? index.filter((e) => `${e.title} ${e.subtitle}`.toLowerCase().includes(q.toLowerCase())).slice(0, 14)
    : index.filter((e) => e.kind === "structure");

  return (
    <div className="overlay-backdrop flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
      <div className="modal-panel w-full max-w-[560px] overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t.aria}>
        <div className="flex items-center gap-3 border-b border-line-warm px-5 py-4">
          <SearchIcon className="h-5 w-5 flex-none text-ink-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.placeholder}
            className="font-serif w-full bg-transparent text-[1.1rem] italic text-ink outline-none placeholder:text-ink-muted"
            aria-label={t.aria}
          />
          <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:text-ink" aria-label={t.aria}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="bible-scroll max-h-[46vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <p className="font-serif px-3 py-6 text-center italic text-ink-muted">{t.noResults}</p>}
          {results.map((r, i) => (
            <button
              key={`${r.structureId}-${r.title}-${i}`}
              role="option"
              aria-selected={false}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-paper-deep"
              onClick={() => onPick(r.structureId, r.hotspotId)}
            >
              <span className="flex-none rounded-md border border-line-warm bg-surface px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-terracotta">
                {t.kind[r.kind]}
              </span>
              <span className="min-w-0">
                <span className="font-display block truncate text-[0.98rem] font-bold text-ink">{r.title}</span>
                <span className="block truncate text-[0.76rem] text-ink-muted">{r.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
