import { Fragment } from "react";
import type { DescriptionLink, DescriptionLinkTarget } from "@/types/structure";
import { useLocale } from "@/i18n/locale";
import { findScriptureReferences } from "@/lib/scripture";

interface Props {
  text: string;
  links?: DescriptionLink[];
  onLinkClick: (target: DescriptionLinkTarget) => void;
}

type Span =
  | { start: number; end: number; kind: "internal"; link: DescriptionLink }
  | { start: number; end: number; kind: "scripture"; url: string };

/** Renders `text` as plain prose, except: each `links[].text` substring
 *  becomes a clickable internal term (jumps to a section/hotspot), and
 *  every Bible reference (e.g. "Genesis 2:15") becomes a link out to
 *  bible.com. Plain string split, no regex-driven DOM and no
 *  dangerouslySetInnerHTML  -  overlapping/duplicate matches are dropped
 *  defensively (first match wins, internal links take priority) rather
 *  than risking mangled output. */
export function DescriptionText({ text, links, onLinkClick }: Props) {
  const { locale } = useLocale();

  const spans: Span[] = [];
  for (const link of links ?? []) {
    const idx = text.indexOf(link.text);
    if (idx === -1) continue;
    spans.push({ start: idx, end: idx + link.text.length, kind: "internal", link });
  }
  for (const ref of findScriptureReferences(text, locale)) {
    spans.push({ start: ref.start, end: ref.end, kind: "scripture", url: ref.url });
  }
  spans.sort((a, b) => a.start - b.start);
  const clean = spans.filter((m, i) => i === 0 || m.start >= spans[i - 1].end);

  if (clean.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let pos = 0;
  clean.forEach((m, i) => {
    if (m.start > pos) nodes.push(<Fragment key={`t${i}`}>{text.slice(pos, m.start)}</Fragment>);
    if (m.kind === "internal") {
      nodes.push(
        <button key={`l${i}`} type="button" className="description-link" onClick={() => onLinkClick(m.link.target)}>
          {text.slice(m.start, m.end)}
        </button>,
      );
    } else {
      nodes.push(
        <a key={`l${i}`} href={m.url} target="_blank" rel="noopener noreferrer" className="description-link" onClick={(e) => e.stopPropagation()}>
          {text.slice(m.start, m.end)}
        </a>,
      );
    }
    pos = m.end;
  });
  if (pos < text.length) nodes.push(<Fragment key="tail">{text.slice(pos)}</Fragment>);
  return <>{nodes}</>;
}
