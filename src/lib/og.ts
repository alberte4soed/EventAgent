/* Lightweight OpenGraph / product scraper for the gift registry. Given a
   product URL we fetch the page server-side and pull title, image, store name
   and price from meta tags (with a JSON-LD fallback) — no API keys, works on
   most shops. parseProduct() is pure so it can be unit-tested with fixtures. */

export interface ProductInfo {
  title: string | null;
  image: string | null;
  storeName: string | null;
  priceCents: number | null;
  currency: string | null;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();

/** Extract <meta property|name="..." content="..."> into a lookup map. */
function metaTags(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const metaRe = /<meta\b[^>]*>/gi;
  for (const tag of html.match(metaRe) ?? []) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (key && content != null) out[key.toLowerCase()] = decode(content);
  }
  return out;
}

function priceFromJsonLd(html: string): { price: number | null; currency: string | null } {
  for (const block of html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? []) {
    const json = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
    try {
      const found = findOffer(JSON.parse(json));
      if (found) return found;
    } catch { /* ignore malformed JSON-LD */ }
  }
  return { price: null, currency: null };
}

function findOffer(node: unknown): { price: number; currency: string | null } | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const offers = obj.offers ?? (obj["@type"] === "Offer" ? obj : null);
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (offer && typeof offer === "object") {
    const price = Number((offer as Record<string, unknown>).price);
    if (Number.isFinite(price)) {
      const currency = (offer as Record<string, unknown>).priceCurrency;
      return { price, currency: typeof currency === "string" ? currency : null };
    }
  }
  for (const v of Object.values(obj)) {
    const nested = findOffer(v);
    if (nested) return nested;
  }
  return null;
}

/** Parse a fetched HTML document into structured product info. Pure. */
export function parseProduct(html: string, url: string): ProductInfo {
  const m = metaTags(html);
  const title = m["og:title"] || m["twitter:title"]
    || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "") || null;
  const image = m["og:image"] || m["og:image:url"] || m["twitter:image"] || null;
  let storeName = m["og:site_name"] || null;
  if (!storeName) { try { storeName = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep null */ } }

  const metaPrice = m["og:price:amount"] || m["product:price:amount"] || m["twitter:data1"];
  let priceCents: number | null = null;
  let currency = m["og:price:currency"] || m["product:price:currency"] || null;
  const parsed = metaPrice != null ? Number(String(metaPrice).replace(/[^\d.]/g, "")) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    priceCents = Math.round(parsed * 100);
  } else {
    const ld = priceFromJsonLd(html);
    if (ld.price != null) { priceCents = Math.round(ld.price * 100); currency = currency ?? ld.currency; }
  }

  return { title: title || null, image, storeName, priceCents, currency };
}

/** Fetch a product page and parse it. Best-effort; never throws. */
export async function lookupProduct(url: string): Promise<ProductInfo> {
  const empty: ProductInfo = { title: null, image: null, storeName: null, priceCents: null, currency: null };
  let target: URL;
  try { target = new URL(url); } catch { return empty; }
  if (target.protocol !== "http:" && target.protocol !== "https:") return empty;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KalasBot/1.0; +https://kalas.dk)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return empty;
    const html = (await res.text()).slice(0, 500_000);
    return parseProduct(html, target.toString());
  } catch {
    return empty;
  }
}
