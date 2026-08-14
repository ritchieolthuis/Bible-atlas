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
