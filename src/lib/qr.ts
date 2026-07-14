/* QR helpers on top of `uqr` (zero-dependency, synchronous). Used by the
   builder's "Del med gæsterne" cards: inline SVG preview + downloadable
   SVG/PNG for the printed invitation. */

import { renderSVG } from "uqr";

/** SVG markup for a QR code pointing at `url` (medium error correction). */
export function qrSvg(url: string): string {
  return renderSVG(url, { ecc: "M", border: 2 });
}

/**
 * Rasterize a QR SVG to a PNG data-URL at the given pixel size.
 * Browser-only (uses canvas + Image); call from client components.
 */
export function qrPngDataUrl(url: string, size = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([qrSvg(url)], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas 2d context unavailable"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("failed to render QR SVG"));
    };
    img.src = objectUrl;
  });
}
