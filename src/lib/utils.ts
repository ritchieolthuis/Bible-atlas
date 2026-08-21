import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Prefixes a root-relative asset path ("/models/x.glb") with the app's
 *  deploy base ("/" locally, "/the3d-bible/" on GitHub Pages), so static
 *  assets resolve correctly when the site isn't served from a domain root.
 *  Absolute URLs and already-based paths pass through unchanged. */
export function withBase(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return path;
  const base = import.meta.env.BASE_URL; // e.g. "/" or "/the3d-bible/"
  if (!path.startsWith("/")) return path;
  return base.replace(/\/$/, "") + path;
}

/** Rewrites a resolved model URL's ".glb" extension to ".model" right before
 *  it's actually fetched, and back to ".glb" when reading a response's URL.
 *  Some third-party upload pipelines (a shared-hosting PHP uploader used for
 *  one deploy target) silently drop any file ending in ".glb" - every other
 *  extension in the same build (.js, .wasm, .webp, even the same bytes as
 *  .obj) uploads fine, only .glb is refused, regardless of file size. The
 *  actual files on disk and in the build output are named ".model" so that
 *  upload path accepts them; every other identifier in the app (Structure
 *  data's modelPath, cache keys, the mobile-variant/isObj/noahs_ark string
 *  checks in engine.ts) keeps using ".glb" as its logical name and only
 *  calls this right at the point of an actual network fetch, so none of
 *  that matching logic needs to know the on-disk extension differs. */
export function toFetchPath(path: string): string {
  return path.endsWith(".glb") ? path.slice(0, -4) + ".model" : path;
}
