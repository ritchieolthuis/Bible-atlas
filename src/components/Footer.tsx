import { useLocale } from "@/i18n/locale";
import { useStrings } from "@/i18n/strings";
import { withBase } from "@/lib/utils";
import { ChatIcon, HeartIcon, TelegramIcon, InstagramIcon, TikTokIcon } from "./icons";

export function Footer() {
  const { locale } = useLocale();
  const t = useStrings(locale);

  return (
    <footer className="mt-auto border-t border-line-warm px-3 py-6 sm:px-4 xl:px-5">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <img src={withBase("/img/brand/de-samenkomst-logo.png")} alt="De Samenkomst" className="h-8 w-auto" />
          <div className="mt-2 text-[0.8rem] text-ink-muted">{t.footer.copyright}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[0.86rem] font-medium text-ink-soft">
          <a href="https://desamenkomst.nl/forum/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 transition-colors hover:text-terracotta">
            <ChatIcon className="h-4 w-4" />
            {t.footer.forum}
          </a>
          <a href="https://donorbox.org/the-assembling" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 transition-colors hover:text-terracotta">
            <HeartIcon className="h-4 w-4" />
            {t.footer.donate}
          </a>
          <a href="https://t.me/theassembling" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 transition-colors hover:text-terracotta">
            <TelegramIcon className="h-4 w-4" />
            Telegram
          </a>
          <a href="https://www.instagram.com/assemblingonline/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 transition-colors hover:text-terracotta">
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
          <a href="https://www.tiktok.com/@assembling.online?_r=1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-paper-deep px-3 py-1.5 transition-colors hover:text-terracotta">
            <TikTokIcon className="h-4 w-4" />
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
