import { memo } from "react";
import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { CloseIcon } from "./icons";

interface Props {
  onDismiss: () => void;
}

/** A single line of credit above the header, dismissible for good. */
export const Banner = memo(function Banner({ onDismiss }: Props) {
  const { locale } = useLocale();
  const t = useStrings(locale).banner;

  return (
    <div
      className="relative z-50 flex flex-none items-center justify-center gap-x-3 gap-y-1 border-b border-line-strong bg-cream px-11 py-2 text-center xl:h-10 xl:py-0"
      role="region"
      aria-label="Credits"
    >
      <p className="text-[0.78rem] leading-snug text-ink-soft sm:text-[0.82rem]">
        {t.lead}{" "}
        <span className="font-medium text-ink">{t.bibleName}</span>.
        <span className="ml-1.5 font-medium text-terracotta">{t.verse}</span>
      </p>

      <button
        onClick={onDismiss}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink"
        aria-label={t.dismiss}
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
