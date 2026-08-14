import { Fragment } from "react";
import type { DescriptionLink, DescriptionLinkTarget } from "@/types/empire";

interface Props {
  text: string;
  links?: DescriptionLink[];
  onLinkClick: (target: DescriptionLinkTarget) => void;
}

/** Renders `text` as plain prose, except each `links[].text` substring
 *  becomes a clickable inline term. Plain string split, no regex and no
 *  dangerouslySetInnerHTML  -  overlapping/duplicate matches are dropped
 *  defensively (first match wins) rather than risking mangled output. */
export function DescriptionText({ text, links, onLinkClick }: Props) {
  if (!links || links.length === 0) return <>{text}</>;

  const matches: { start: number; end: number; link: DescriptionLink }[] = [];
  for (const link of links) {
    const idx = text.indexOf(link.text);
    if (idx === -1) continue;
    matches.push({ start: idx, end: idx + link.text.length, link });
  }
  matches.sort((a, b) => a.start - b.start);
  const clean = matches.filter((m, i) => i === 0 || m.start >= matches[i - 1].end);

  if (clean.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let pos = 0;
  clean.forEach((m, i) => {
    if (m.start > pos) nodes.push(<Fragment key={`t${i}`}>{text.slice(pos, m.start)}</Fragment>);
    nodes.push(
      <button key={`l${i}`} type="button" className="description-link" onClick={() => onLinkClick(m.link.target)}>
        {text.slice(m.start, m.end)}
      </button>,
    );
    pos = m.end;
  });
  if (pos < text.length) nodes.push(<Fragment key="tail">{text.slice(pos)}</Fragment>);
  return <>{nodes}</>;
}
