import { useCallback, useEffect, useRef, useState } from "react";
import { empiresFor, empireById, DEFAULT_EMPIRE_ID } from "@/data";
import type { Empire, DescriptionLinkTarget } from "@/types/empire";
import { useLocale, type Locale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { Banner } from "@/components/Banner";
import { Header } from "@/components/Header";
import { EmpireLibrary } from "@/components/EmpireLibrary";
import { Viewer } from "@/components/Viewer";
import { InfoPanel } from "@/components/InfoPanel";
import { BottomCards } from "@/components/BottomCards";
import { Footer } from "@/components/Footer";
import { LessonModal, QuizModal, ArtifactsModal, TimelineModal, SectionModal, SearchOverlay } from "@/components/modals";
import { CloseIcon } from "@/components/icons";

type ModalId = string | null;

const mq = (q: string) => (typeof window !== "undefined" ? window.matchMedia(q).matches : false);

export default function App() {
  const { locale, setLocale } = useLocale();
  const t = useStrings(locale);
  const EMPIRES = empiresFor(locale);

  /** mirrors the header's primary nav, for the drawer */
  const NAV_ITEMS = [
    { id: "explore", label: t.nav.explore },
    { id: "empires", label: t.nav.structures },
    { id: "lessons", label: t.nav.scripture },
    { id: "library", label: t.nav.library },
    { id: "notes", label: t.nav.timeline },
  ];

  const [viewerEmpire, setViewerEmpire] = useState<Empire>(() => empireById(locale, DEFAULT_EMPIRE_ID));
  const [panelEmpire, setPanelEmpire] = useState<Empire>(() => empireById(locale, DEFAULT_EMPIRE_ID));
  const [modal, setModal] = useState<ModalId>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(() => localStorage.getItem("atlas-credits") !== "dismissed");
  const [focusHotspot, setFocusHotspot] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("explore");
  const [reducedMotion, setReducedMotion] = useState(() => mq("(prefers-reduced-motion: reduce)"));
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("atlas-favs") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  /* Re-resolve the same dwelling's text in the new locale whenever the
     language switches, without dropping which structure is displayed. */
  useEffect(() => {
    setViewerEmpire((prev) => empireById(locale, prev.id));
    setPanelEmpire((prev) => empireById(locale, prev.id));
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
     place  -  fading or sliding them reads as the page shifting under you. */
  useEffect(() => {
    document.title = `${panelEmpire.dwelling}  -  ${t.docTitleSuffix}`;
  }, [panelEmpire, t.docTitleSuffix]);

  const selectEmpire = useCallback(
    (id: string) => {
      const e = empireById(locale, id);
      if (e.id === viewerEmpire.id) return;
      setAnimating(false);
      setViewerEmpire(e);
    },
    [viewerEmpire.id, locale],
  );

  const onSwap = useCallback((e: Empire) => setPanelEmpire(e), []);

  const dismissCredits = useCallback(() => {
    setCreditsOpen(false);
    localStorage.setItem("atlas-credits", "dismissed");
  }, []);

  /* hovering a library row starts its download, so the click that follows
     lands on a model that is already parsed rather than paying for it mid-swap */
  const prefetchRef = useRef<((e: Empire) => void) | null>(null);
  const prefetch = useCallback((id: string) => prefetchRef.current?.(empireById(locale, id)), [locale]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("atlas-favs", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const onNav = useCallback(
    (nav: string) => {
      setActiveNav(nav);
      if (nav === "lessons") setModal("lesson");
      else if (nav === "empires" || nav === "library") setSearchOpen(true);
      else if (nav === "notes") setModal("timeline");
    },
    [],
  );

  /* Shared in-app navigation: switch structure if needed, then optionally
     focus a hotspot and/or open a section modal. Used by search results and
     by clickable terms inside a structure's description alike. */
  const navigateTo = useCallback(
    (target: { empireId?: string; section?: string; hotspotId?: string }) => {
      setSearchOpen(false);
      const targetEmpireId = target.empireId ?? viewerEmpire.id;
      const switching = targetEmpireId !== viewerEmpire.id;
      if (switching) {
        selectEmpire(targetEmpireId);
        setPanelEmpire(empireById(locale, targetEmpireId));
      }

      const delay = switching ? 1600 : 50;
      if (target.hotspotId) window.setTimeout(() => setFocusHotspot(target.hotspotId!), delay);
      if (target.section) window.setTimeout(() => setModal(target.section!), switching ? 1600 : 0);
    },
    [selectEmpire, viewerEmpire.id, locale],
  );

  const onSearchPick = useCallback(
    (empireId: string, hotspotId?: string) => navigateTo({ empireId, hotspotId }),
    [navigateTo],
  );

  const onDescriptionLink = useCallback(
    (target: DescriptionLinkTarget) => {
      if (target.kind === "section") navigateTo({ section: target.section });
      else if (target.kind === "hotspot") navigateTo({ hotspotId: target.hotspotId });
      else navigateTo({ empireId: target.empireId, section: target.section, hotspotId: target.hotspotId });
    },
    [navigateTo],
  );

  return (
    <div
      className="flex min-h-screen flex-col bg-paper"
      style={{ "--banner-h": creditsOpen ? "40px" : "0px" } as React.CSSProperties}
    >
      {creditsOpen && <Banner onDismiss={dismissCredits} />}
      <Header onSearchOpen={() => setSearchOpen(true)} onMenuOpen={() => setMenuOpen(true)} onNav={onNav} activeNav={activeNav} />

      {/* main stage  -  sized so the exploration cards below stay in view, and
          the side panels scroll within it rather than stretching the page */}
      <div className="flex gap-4 px-3 pb-3 pt-3 sm:min-h-[520px] sm:px-4 xl:h-[calc(100vh-188px-var(--banner-h,0px))] xl:min-h-[600px] xl:px-5">
        <aside className="hidden w-[clamp(268px,20vw,380px)] flex-none xl:flex">
          <EmpireLibrary empires={EMPIRES} activeId={viewerEmpire.id} favorites={favorites} onSelect={selectEmpire} onToggleFav={toggleFav} onViewAll={() => setSearchOpen(true)} onPrefetch={prefetch} />
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
              empire={viewerEmpire}
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
            empire={panelEmpire}
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
          empire={panelEmpire}
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
        <BottomCards empire={panelEmpire} onOpen={(s) => setModal(s)} />
      </section>

      <Footer />

      {/* mobile drawer: the same empire library as the desktop rail, plus the
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
              <span className="font-display text-[1.15rem] font-bold text-ink">{t.menu.title}</span>
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
              <EmpireLibrary
                empires={EMPIRES}
                activeId={viewerEmpire.id}
                favorites={favorites}
                onSelect={(id) => { setMenuOpen(false); selectEmpire(id); }}
                onToggleFav={toggleFav}
                onViewAll={() => { setMenuOpen(false); setSearchOpen(true); }}
                onPrefetch={prefetch}
              />
            </div>
          </div>
        </div>
      )}

      {/* modals */}
      {modal === "lesson" && <LessonModal empire={panelEmpire} onClose={() => setModal(null)} onQuiz={() => setModal("quiz")} />}
      {modal === "quiz" && <QuizModal key={panelEmpire.id} empire={panelEmpire} onClose={() => setModal(null)} />}
      {modal === "artifacts" && <ArtifactsModal empire={panelEmpire} onClose={() => setModal(null)} />}
      {modal === "timeline" && <TimelineModal empire={panelEmpire} onClose={() => setModal(null)} />}
      {(modal === "interior" || modal === "floorPlan" || modal === "dailyLife" || modal === "geography" || panelEmpire.extras?.some((e) => e.id === modal)) && (
        <SectionModal empire={panelEmpire} section={modal!} onClose={() => setModal(null)} />
      )}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onPick={onSearchPick} />}
    </div>
  );
}
