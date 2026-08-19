import { memo } from "react";
import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { withBase } from "@/lib/utils";
import {
  TempleIcon,
  CompassIcon,
  StructuresIcon,
  LessonsIcon,
  LibraryIcon,
  NotesIcon,
  HeartIcon,
  SearchIcon,
  MenuIcon,
} from "./icons";

interface HeaderProps {
  onSearchOpen: () => void;
  /** opens the drawer that carries the nav and the structure library on small screens */
  onMenuOpen: () => void;
  onNav: (id: string) => void;
  activeNav: string;
}

export const Header = memo(function Header({ onSearchOpen, onMenuOpen, onNav, activeNav }: HeaderProps) {
  const { locale, setLocale } = useLocale();
  const t = useStrings(locale);

  const NAV = [
    { id: "explore", label: t.nav.explore, icon: CompassIcon },
    { id: "structures", label: t.nav.structures, icon: StructuresIcon },
    { id: "lessons", label: t.nav.scripture, icon: LessonsIcon },
    { id: "library", label: t.nav.library, icon: LibraryIcon },
    { id: "notes", label: t.nav.timeline, icon: NotesIcon },
    { id: "gospel", label: t.nav.gospel, icon: HeartIcon },
  ];

  return (
    <header className="relative z-40 flex h-[68px] flex-none items-center gap-2.5 border-b border-line-warm bg-paper px-3 sm:gap-4 sm:px-5">
      {/* the nav and the structure library live in a drawer below lg */}
      <button
        onClick={onMenuOpen}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-line-warm bg-surface text-slateblue transition-colors hover:border-line-strong xl:hidden"
        aria-label={t.header.openMenu}
        aria-haspopup="dialog"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="flex min-w-0 flex-none items-center gap-4">
        <TempleIcon className="h-9 w-9 flex-none text-terracotta sm:h-10 sm:w-10" aria-hidden />
        <img
          src={withBase("/img/brand/3d-bible-logo.webp")}
          alt={t.brand.name}
          className="h-10 w-auto flex-none -translate-y-1 sm:h-11"
        />
      </div>

      {/* Nav */}
      <nav className="ml-12 hidden items-center gap-1 xl:flex" aria-label="Primary">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${activeNav === n.id ? "is-active" : ""}`}
            onClick={() => onNav(n.id)}
            aria-current={activeNav === n.id ? "page" : undefined}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Language switcher */}
      <div
        className="hidden items-center gap-0.5 rounded-full border border-line-warm bg-surface p-0.5 sm:flex"
        role="group"
        aria-label={t.languageSwitcher.label}
      >
        <button
          className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors ${locale === "en" ? "bg-terracotta text-white" : "text-ink-muted hover:text-ink"}`}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
        <button
          className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors ${locale === "nl" ? "bg-terracotta text-white" : "text-ink-muted hover:text-ink"}`}
          onClick={() => setLocale("nl")}
          aria-pressed={locale === "nl"}
        >
          NL
        </button>
      </div>

      {/* Search */}
      <button
        onClick={onSearchOpen}
        className="group hidden h-10 w-[min(300px,26vw)] items-center gap-2.5 rounded-full border border-line-warm bg-surface px-4 text-left transition-colors hover:border-line-strong md:flex"
        aria-label={t.header.searchAria}
      >
        <SearchIcon className="h-4 w-4 flex-none text-ink-muted" />
        <span className="flex-1 truncate text-[0.84rem] italic text-ink-muted">{t.header.searchPlaceholder}</span>
        <kbd className="hidden rounded border border-line-warm bg-paper px-1.5 py-0.5 text-[0.62rem] font-medium text-ink-muted xl:block">⌘K</kbd>
      </button>
      {/* compact search (mobile) */}
      <button
        onClick={onSearchOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line-warm bg-surface text-ink-muted transition-colors hover:border-line-strong md:hidden"
        aria-label={t.header.searchAria}
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </header>
  );
});
