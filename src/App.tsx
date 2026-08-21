import { useCallback, useEffect, useRef, useState } from "react";
import { structuresFor, structureById, DEFAULT_STRUCTURE_ID } from "@/data";
import type { Structure, DescriptionLinkTarget } from "@/types/structure";
import { useLocale, type Locale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { Banner } from "@/components/Banner";
import { Header } from "@/components/Header";
import { StructureLibrary } from "@/components/StructureLibrary";
import { Viewer } from "@/components/Viewer";
import { InfoPanel } from "@/components/InfoPanel";
import { BottomCards } from "@/components/BottomCards";
import { Footer } from "@/components/Footer";
import { LessonModal, QuizModal, ArtifactsModal, TimelineModal, GospelModal, SectionModal, SearchOverlay } from "@/components/modals";
import { CloseIcon } from "@/components/icons";
import { IntroScreen } from "@/components/IntroScreen";
import { withBase } from "@/lib/utils";

type ModalId = string | null;

const mq = (q: string) => (typeof window !== "undefined" ? window.matchMedia(q).matches : false);

const INTRO_SESSION_KEY = "bible-intro-shown";

export default function App() {
  const { locale, setLocale } = useLocale();
  const t = useStrings(locale);
  const STRUCTURES = structuresFor(locale);

  /* one intro per browser tab session, not on every internal navigation */
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  /** mirrors the header's primary nav, for the drawer */
  const NAV_ITEMS = [
    { id: "explore", label: t.nav.explore },
    { id: "structures", label: t.nav.structures },
    { id: "lessons", label: t.nav.scripture },
    { id: "library", label: t.nav.library },
    { id: "notes", label: t.nav.timeline },
    { id: "gospel", label: t.nav.gospel },
  ];

  const [viewerStructure, setViewerStructure] = useState<Structure>(() => structureById(locale, DEFAULT_STRUCTURE_ID));
  const [panelStructure, setPanelStructure] = useState<Structure>(() => structureById(locale, DEFAULT_STRUCTURE_ID));
  const [modal, setModal] = useState<ModalId>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(() => localStorage.getItem("bible-credits") !== "dismissed");
  const [focusHotspot, setFocusHotspot] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("explore");
  const [reducedMotion, setReducedMotion] = useState(() => mq("(prefers-reduced-motion: reduce)"));
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("bible-favs") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  /* Re-resolve the same dwelling's text in the new locale whenever the
     language switches, without dropping which structure is displayed. */
  useEffect(() => {
    setViewerStructure((prev) => structureById(locale, prev.id));
    setPanelStructure((prev) => structureById(locale, prev.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  /* Reduced motion now follows the operating system alone  -  there is no
     in-app switch  -  so track the media query rather than sampling it once. */
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(q.matches);
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("rm", reducedMotion);
  }, [reducedMotion]);

  /* ⌘K search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* preload the most likely next models once idle */
  useEffect(() => {
    const id = window.setTimeout(() => {
      /* adjacent models are warmed by the engine cache on demand */
    }, 4000);
    return () => window.clearTimeout(id);
  }, []);

  /* Only the dwelling animates on a swap. The panels rewrite their copy in
     place  -  fading or sliding them reads as the page shifting under you.
     Skipped until the user has actually swapped to a dwelling at least once
     (see onSwap below, which flips this ref): panelStructure starts out on
     DEFAULT_STRUCTURE_ID before any real navigation happens, and browser
     tabs / "add to home screen" pick up whatever title is current at that
     moment  -  without this guard they'd get e.g. "De Hof van Eden" as the
     app's name instead of the generic site title index.html already sets.
     Tracked via a ref rather than skipping the effect's first *run* because
     StrictMode's dev-mode double-invoke means "first run" and "first real
     swap" aren't the same thing - a ref flipped only by an actual onSwap
     call is unambiguous regardless of how many times the effect itself
     re-fires. */
  const hasSwapped = useRef(false);
  useEffect(() => {
    if (!hasSwapped.current) return;
    document.title = `${panelStructure.dwelling}  -  ${t.docTitleSuffix}`;
  }, [panelStructure, t.docTitleSuffix]);

  const selectStructure = useCallback(
    (id: string) => {
      const e = structureById(locale, id);
      if (e.id === viewerStructure.id) return;
      setAnimating(false);
      setViewerStructure(e);
    },
    [viewerStructure.id, locale],
  );

  const onSwap = useCallback((e: Structure) => {
    hasSwapped.current = true;
    setPanelStructure(e);
  }, []);

  const dismissCredits = useCallback(() => {
    setCreditsOpen(false);
    localStorage.setItem("bible-credits", "dismissed");
  }, []);

  /* hovering a library row starts its download, so the click that follows
     lands on a model that is already parsed rather than paying for it mid-swap */
  const prefetchRef = useRef<((e: Structure) => void) | null>(null);
  const prefetch = useCallback((id: string) => prefetchRef.current?.(structureById(locale, id)), [locale]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("bible-favs", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const onNav = useCallback(
    (nav: string) => {
      setActiveNav(nav);
      if (nav === "lessons") setModal("lesson");
      else if (nav === "structures" || nav === "library") setSearchOpen(true);
      else if (nav === "notes") setModal("timeline");
      else if (nav === "gospel") setModal("gospel");
    },
    [],
  );

  /* Shared in-app navigation: switch structure if needed, then optionally
     focus a hotspot and/or open a section modal. Used by search results and
     by clickable terms inside a structure's description alike. */
  const navigateTo = useCallback(
    (target: { structureId?: string; section?: string; hotspotId?: string }) => {
      setSearchOpen(false);
      const targetStructureId = target.structureId ?? viewerStructure.id;
      const switching = targetStructureId !== viewerStructure.id;
      if (switching) {
        selectStructure(targetStructureId);
        setPanelStructure(structureById(locale, targetStructureId));
      }

      const delay = switching ? 1600 : 50;
      if (target.hotspotId) window.setTimeout(() => setFocusHotspot(target.hotspotId!), delay);
      if (target.section) window.setTimeout(() => setModal(target.section!), switching ? 1600 : 0);
    },
    [selectStructure, viewerStructure.id, locale],
  );

  const onSearchPick = useCallback(
    (structureId: string, hotspotId?: string) => navigateTo({ structureId, hotspotId }),
    [navigateTo],
  );

  const onDescriptionLink = useCallback(
    (target: DescriptionLinkTarget) => {
      if (target.kind === "section") navigateTo({ section: target.section });
      else if (target.kind === "hotspot") navigateTo({ hotspotId: target.hotspotId });
      else navigateTo({ structureId: target.structureId, section: target.section, hotspotId: target.hotspotId });
    },
    [navigateTo],
  );

  return (
    <div
      className="flex min-h-screen flex-col bg-paper"
      style={{ "--banner-h": creditsOpen ? "40px" : "0px" } as React.CSSProperties}
    >
      {showIntro && <IntroScreen onDone={dismissIntro} locale={locale} />}
      {creditsOpen && <Banner onDismiss={dismissCredits} />}
      <Header onSearchOpen={() => setSearchOpen(true)} onMenuOpen={() => setMenuOpen(true)} onNav={onNav} activeNav={activeNav} />

      {/* main stage  -  sized so the exploration cards below stay in view, and
          the side panels scroll within it rather than stretching the page */}
      <div className="flex gap-4 px-3 pb-3 pt-3 sm:min-h-[520px] sm:px-4 xl:h-[calc(100vh-188px-var(--banner-h,0px))] xl:min-h-[600px] xl:px-5">
        <aside className="hidden w-[clamp(300px,22vw,380px)] flex-none xl:flex">
          <StructureLibrary structures={STRUCTURES} activeId={viewerStructure.id} favorites={favorites} onSelect={selectStructure} onToggleFav={toggleFav} onViewAll={() => setSearchOpen(true)} onPrefetch={prefetch} />
        </aside>

        {/* the stage reads as a near-square plate rather than a wide band. The
            side panels widen first (their clamps), and the stage keeps whatever
            is left  -  capped so it never stretches back into a letterbox. Below
            xl, where there's no side rail to size against, the stage sets its
            own square-ish footprint from the viewport width instead of a small
            vh sliver, so the dwelling reads as large on a phone as on desktop */}
        <main className="flex min-w-0 flex-1 justify-center">
          <div className="aspect-square w-full max-w-[min(100%,80vh)] xl:aspect-auto xl:h-full xl:max-w-[min(100%,calc((100vh-188px-var(--banner-h,0px))*1.3))]">
            <Viewer
              structure={viewerStructure}
              onSwap={onSwap}
              reducedMotion={reducedMotion}
              animating={animating}
              onToggleAnimate={() => setAnimating((v) => !v)}
              focusHotspot={focusHotspot}
              onFocusHandled={() => setFocusHotspot(null)}
              onArtifacts={() => setModal("artifacts")}
              onTimeline={() => setModal("timeline")}
              onPrefetchReady={(fn) => { prefetchRef.current = fn; }}
            />
          </div>
        </main>

        <aside className="hidden w-[clamp(330px,25vw,480px)] flex-none xl:flex">
          <InfoPanel
            structure={panelStructure}
            animating={animating}
            onLesson={() => setModal("lesson")}
            onToggleAnimate={() => setAnimating((v) => !v)}
            onArtifacts={() => setModal("artifacts")}
            onQuiz={() => setModal("quiz")}
            onDescriptionLink={onDescriptionLink}
          />
        </aside>
      </div>

      {/* below xl the dwelling detail reads in the page flow, under the model
          and above the cards, rather than hiding behind a floating button */}
      <section className="px-3 pb-3 pt-1 sm:px-4 xl:hidden" aria-label="Selected dwelling">
        <InfoPanel
          structure={panelStructure}
          flow
          animating={animating}
          onLesson={() => setModal("lesson")}
          onToggleAnimate={() => setAnimating((v) => !v)}
          onArtifacts={() => setModal("artifacts")}
          onQuiz={() => setModal("quiz")}
          onDescriptionLink={onDescriptionLink}
        />
      </section>

      {/* exploration cards  -  a grid at every size rather than a sideways
          scroller, which hid four of the five on a phone */}
      <section className="px-3 pb-6 pt-1 sm:px-4 xl:px-5" aria-label="Explore the dwelling">
        <BottomCards structure={panelStructure} onOpen={(s) => setModal(s)} />
      </section>

      <Footer />

      {/* mobile drawer: the same structure library as the desktop rail, plus the
          primary nav that the header hides below lg */}
      {menuOpen && (
        <div className="overlay-backdrop xl:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="safe-bottom flex h-full w-[min(320px,86vw)] flex-col bg-paper shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t.menu.label}
          >
            <div className="flex flex-none items-center justify-between border-b border-line-warm px-4 py-3">
              <img src={withBase("/img/brand/3d-bible-logo.webp")} alt={t.brand.name} className="h-7 w-auto" />
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-line-warm p-1.5 text-ink-muted transition-colors hover:text-ink"
                aria-label={t.menu.close}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-none items-center gap-2 border-b border-line-warm px-4 py-3">
              <span className="text-[0.78rem] font-medium text-ink-muted">{t.languageSwitcher.label}</span>
              <div className="flex items-center gap-0.5 rounded-full border border-line-warm bg-surface p-0.5">
                {(["en", "nl"] as Locale[]).map((l) => (
                  <button
                    key={l}
                    className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors ${locale === l ? "bg-terracotta text-white" : "text-ink-muted hover:text-ink"}`}
                    onClick={() => setLocale(l)}
                    aria-pressed={locale === l}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <nav className="flex flex-none flex-wrap gap-1.5 border-b border-line-warm px-3 py-3" aria-label="Primary">
              {NAV_ITEMS.map((n) => (
                <button
                  key={n.id}
                  className={`nav-item !py-2 !text-[0.82rem] ${activeNav === n.id ? "is-active" : ""}`}
                  onClick={() => { setMenuOpen(false); onNav(n.id); }}
                >
                  {n.label}
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 px-3 py-3">
              <StructureLibrary
                structures={STRUCTURES}
                activeId={viewerStructure.id}
                favorites={favorites}
                onSelect={(id) => { setMenuOpen(false); selectStructure(id); }}
                onToggleFav={toggleFav}
                onViewAll={() => { setMenuOpen(false); setSearchOpen(true); }}
                onPrefetch={prefetch}
              />
            </div>
          </div>
        </div>
      )}

      {/* modals */}
      {modal === "lesson" && <LessonModal structure={panelStructure} onClose={() => setModal(null)} onQuiz={() => setModal("quiz")} />}
      {modal === "quiz" && <QuizModal key={panelStructure.id} structure={panelStructure} onClose={() => setModal(null)} />}
      {modal === "artifacts" && <ArtifactsModal structure={panelStructure} onClose={() => setModal(null)} />}
      {modal === "timeline" && <TimelineModal structure={panelStructure} onClose={() => setModal(null)} />}
      {modal === "gospel" && <GospelModal onClose={() => setModal(null)} />}
      {(modal === "interior" || modal === "floorPlan" || modal === "dailyLife" || modal === "geography" || panelStructure.extras?.some((e) => e.id === modal)) && (
        <SectionModal structure={panelStructure} section={modal!} onClose={() => setModal(null)} />
      )}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onPick={onSearchPick} />}
    </div>
  );
}
