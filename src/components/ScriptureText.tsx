import { Fragment } from "react";
import { useLocale } from "@/i18n/locale";
import { findScriptureReferences } from "@/lib/scripture";

interface Props {
  text: string;
}

/** Renders `text` as plain prose, except every Bible reference it contains
 *  (e.g. "Genesis 2:15", "Gen. 3:14-19") becomes a link that opens that
 *  verse on bible.com, in the translation this app quotes for the current
 *  locale (Statenvertaling for nl, KJV for en). */
export function ScriptureText({ text }: Props) {
  const { locale } = useLocale();
  const matches = findScriptureReferences(text, locale);
  if (matches.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.start > pos) nodes.push(<Fragment key={`t${i}`}>{text.slice(pos, m.start)}</Fragment>);
    nodes.push(
      <a
        key={`l${i}`}
        href={m.url}
        target="_blank"
        rel="noopener noreferrer"
        className="description-link"
        onClick={(e) => e.stopPropagation()}
      >
        {text.slice(m.start, m.end)}
      </a>,
    );
    pos = m.end;
  });
  if (pos < text.length) nodes.push(<Fragment key="tail">{text.slice(pos)}</Fragment>);
  return <>{nodes}</>;
}
