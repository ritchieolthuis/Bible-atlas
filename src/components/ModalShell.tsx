import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CloseIcon } from "./icons";
import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";

interface ShellProps {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/** Shared parchment modal with backdrop blur, Esc-to-close and focus trap. */
export function ModalShell({ title, kicker, onClose, children, wide }: ShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const t = useStrings(locale).modals;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("button, [href], input, [tabindex]");
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay-backdrop flex items-center justify-center p-4" onClick={onClose} role="presentation">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-panel atlas-scroll relative max-h-[88vh] w-full overflow-y-auto ${wide ? "max-w-[860px]" : "max-w-[620px]"} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-line-warm pb-4">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            <h2 className="font-display mt-1 text-[1.7rem] font-bold leading-none text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-none rounded-lg border border-line-warm bg-surface p-2 text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            aria-label={t.close}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
