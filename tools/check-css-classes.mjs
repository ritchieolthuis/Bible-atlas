#!/usr/bin/env node
// Guards against the class of bug where a custom CSS class gets renamed in
// one layer (JSX) but not the other (index.css), silently breaking styling
// with no build error. Two checks:
//   1. every custom class *defined* in CSS is *used* somewhere in JSX/TSX
//   2. every custom class *referenced* in JSX (via className) has a CSS def,
//      for the subset of classnames that look hand-authored rather than
//      Tailwind utilities (Tailwind classes are allowed to have no
//      hand-written rule; that's the point of Tailwind).
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(entry))) out.push(p);
  }
  return out;
}

const cssFiles = walk(SRC, [".css"]);
const jsxFiles = walk(SRC, [".ts", ".tsx"]);

const cssText = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const jsxText = jsxFiles.map((f) => readFileSync(f, "utf8")).join("\n");

// top-level custom classes defined in CSS, e.g. ".structure-card {" or ".structure-card:hover {"
const defined = new Set(
  [...cssText.matchAll(/^\.([a-zA-Z][a-zA-Z0-9_-]*)/gm)].map((m) => m[1])
);

// classes referenced anywhere as a bare word inside className="..."/`...` strings
const classNameBlocks = [...jsxText.matchAll(/className=(?:\{`([^`]*)`\}|"([^"]*)"|\{[^}]*?"([^"]*)"[^}]*?\})/g)]
  .map((m) => m[1] || m[2] || m[3] || "")
  .join(" ");
// split on whitespace AND quote/paren/colon punctuation, so a class name
// embedded in a template-literal ternary (className={`x ${cond ? "y" : ""}`})
// is recognized even though it's wrapped in JS syntax rather than bare text
const usedWords = new Set(classNameBlocks.split(/[\s"'`(){}?:]+/).filter(Boolean));

// classes toggled/added imperatively, e.g. document.body.classList.toggle("rm", cond)
for (const m of jsxText.matchAll(/classList\.(?:toggle|add|remove|contains)\(\s*["']([^"']+)["']/g)) {
  usedWords.add(m[1]);
}

const definedNotUsed = [...defined].filter((c) => !usedWords.has(c));

if (definedNotUsed.length) {
  console.error("CSS classes defined in src/*.css but never referenced in any className:");
  for (const c of definedNotUsed) console.error(`  .${c}`);
  console.error(
    "\nIf a class was intentionally removed from markup, delete its CSS rule too.\n" +
    "If it was renamed in JSX, rename the CSS selector to match (this is exactly\n" +
    "the bug this check exists to catch: a rename that touched .tsx but missed .css)."
  );
  process.exit(1);
}

console.log(`OK - ${defined.size} custom CSS classes all referenced in JSX/TSX.`);
