/* Gift-registry product lookup via Jina Reader + ReaderLM-v2 structured extraction.
   Falls back to the lightweight OG scraper when Jina is unavailable. */

import { lookupProduct as lookupProductOg, type ProductInfo } from "@/lib/og";
import { readUrl, type JinaReaderData } from "./reader";

export const productJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Product name or title" },
    image: { type: "string", description: "Absolute URL of the main product hero image (og:image if present)" },
    storeName: { type: "string", description: "Name of the online store or brand" },
    price: { type: "number", description: "Numeric price, e.g. 1299.00" },
    currency: { type: "string", description: "ISO 4217 currency code (DKK, EUR, USD, etc.)" },
  },
  required: ["title", "image"],
} as const;

const PRODUCT_INSTRUCTION =
  "Extract the main product being sold on this page. " +
  "The image must be the primary product photo (prefer og:image or the hero product image, not logos, flags, or icons).";

interface JinaProductFields {
  title?: string;
  image?: string;
  storeName?: string;
  price?: number | string;
  currency?: string;
}

const SKIP_IMAGE_RE = /(?:logo|icon|favicon|flag|sprite|badge|avatar|placeholder|pixel|tracking|1x1|spacer)/i;
const PRODUCT_IMAGE_RE = /(?:product|media|image|cdn|assets|upload|photo|gallery|thumb)/i;

function hostnameStore(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function toPriceCents(price: unknown): number | null {
  if (price == null) return null;
  const n = typeof price === "number" ? price : Number(String(price).replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

function unwrapContent(content: string): string {
  const fenced = content.trim().match(/^```(?:markdown|json)?\s*([\s\S]*?)```$/i);
  return (fenced?.[1] ?? content).trim();
}

/** First markdown image in Jina content that looks like a product photo. */
export function imageFromMarkdown(content: string): string | null {
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const url = match[1]?.trim();
    if (url && !SKIP_IMAGE_RE.test(url) && !url.endsWith(".svg")) return url;
  }
  return null;
}

/** Pick the best product-looking image from Jina's images summary. */
export function pickJinaImage(images: Record<string, string> | undefined, pageUrl: string): string | null {
  if (!images) return null;
  const host = hostnameStore(pageUrl) ?? "";
  let best: { url: string; score: number } | null = null;

  for (const [label, rawUrl] of Object.entries(images)) {
    const url = rawUrl.trim();
    if (!url || url.endsWith(".svg") || SKIP_IMAGE_RE.test(url) || SKIP_IMAGE_RE.test(label)) continue;

    let score = 0;
    if (/^Image 1\b/i.test(label)) score += 4;
    if (PRODUCT_IMAGE_RE.test(url)) score += 3;
    if (host && url.includes(host)) score += 1;
    if (/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url)) score += 2;
    if (/[?&]w=(?:16|24|32|48|64)(?:&|$)/i.test(url)) score -= 3;
    if (label.length > 12 && !/flag|logo|icon/i.test(label)) score += 1;

    if (!best || score > best.score) best = { url, score };
  }

  return best?.score && best.score > 0 ? best.url : null;
}

function fieldsFromContent(content: string): JinaProductFields | null {
  const trimmed = unwrapContent(content);
  if (!trimmed.startsWith("{")) return null;
  try { return JSON.parse(trimmed) as JinaProductFields; } catch { return null; }
}

/** Parse ReaderLM-v2 output plus Jina metadata into registry product fields. Pure. */
export function parseJinaProduct(data: JinaReaderData, url: string): ProductInfo {
  const content = data.content ?? "";
  const fields = fieldsFromContent(content);
  const title = fields?.title?.trim()
    || data.title?.trim()
    || unwrapContent(content).split("\n").find((l) => l.trim() && !l.startsWith("!["))?.trim()
    || null;

  const image = fields?.image?.trim()
    || imageFromMarkdown(content)
    || pickJinaImage(data.images, url);

  return {
    title: title || null,
    image: image || null,
    storeName: fields?.storeName?.trim() || hostnameStore(url),
    priceCents: toPriceCents(fields?.price),
    currency: fields?.currency?.trim() || null,
  };
}

function mergeProduct(primary: ProductInfo, fallback: ProductInfo): ProductInfo {
  return {
    title: primary.title ?? fallback.title,
    image: primary.image ?? fallback.image,
    storeName: primary.storeName ?? fallback.storeName,
    priceCents: primary.priceCents ?? fallback.priceCents,
    currency: primary.currency ?? fallback.currency,
  };
}

/** Fetch product metadata for a pasted registry URL. Best-effort; never throws. */
export async function lookupProduct(url: string): Promise<ProductInfo> {
  const empty: ProductInfo = { title: null, image: null, storeName: null, priceCents: null, currency: null };
  let target: URL;
  try { target = new URL(url); } catch { return empty; }
  if (target.protocol !== "http:" && target.protocol !== "https:") return empty;

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) return lookupProductOg(url);

  const data = await readUrl({
    url: target.toString(),
    apiKey,
    respondWith: "readerlm-v2",
    jsonSchema: productJsonSchema,
    instruction: PRODUCT_INSTRUCTION,
    engine: "browser",
    timeout: 30,
    withImagesSummary: true,
  });

  if (!data?.content && !data?.title) return lookupProductOg(url);

  const parsed = parseJinaProduct(data, target.toString());
  if (!parsed.title && !parsed.image) return lookupProductOg(url);

  // OG tags are a reliable link-preview fallback for the hero image (and price).
  const needsOg = !parsed.image || parsed.priceCents == null;
  const og = needsOg ? await lookupProductOg(target.toString()) : empty;
  return mergeProduct(parsed, og);
}
