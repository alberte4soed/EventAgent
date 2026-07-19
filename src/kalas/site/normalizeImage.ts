/* Client-side photo normalization for site uploads. iPhones hand us HEIC and
   10MB+ originals; the API accepts jpeg/png/webp ≤ 8MB. Anything outside that
   is decoded in the browser (Safari decodes HEIC natively — the platform that
   produces HEIC can read it) and re-encoded as a downscaled JPEG. Returns null
   only when the browser truly can't decode the file. */

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 2400;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback path via <img> — covers browsers where createImageBitmap
    // rejects a container it can otherwise render.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('decode failed'));
        img.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function normalizeImage(file: File): Promise<File | null> {
  if (ALLOWED.has(file.type) && file.size <= MAX_BYTES) return file;
  try {
    const src = await decode(file);
    const w = 'width' in src ? src.width : 0;
    const h = 'height' in src ? src.height : 0;
    if (!w || !h) return null;
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    if ('close' in src) src.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob) return null;
    const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}
