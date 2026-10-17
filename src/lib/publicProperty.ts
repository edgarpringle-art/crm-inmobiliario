// Helpers shared by the property forms and the public portal (panamainmo.com).

/** Textarea (one per line, or comma-separated) → JSON array string, or null if empty. */
export function parseFeatures(text: string): string | null {
  const items = text
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? JSON.stringify(items) : null;
}

/** YouTube watch/short/youtu.be URL → embed URL. Returns null if not recognized. */
export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/** Adds Cloudinary auto-format/quality + width so 30 photos load fast. Non-Cloudinary URLs pass through. */
export function optimizePhoto(url: string, width = 1600): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}
