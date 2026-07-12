import { describe, it, expect } from "vitest";
import { parseProduct } from "./og";

describe("parseProduct", () => {
  it("reads OpenGraph title/image/site + product price", () => {
    const html = `
      <meta property="og:title" content="Royal Copenhagen Vase" />
      <meta property="og:image" content="https://shop.dk/vase.jpg" />
      <meta property="og:site_name" content="Royal Copenhagen" />
      <meta property="product:price:amount" content="1299.00" />
      <meta property="product:price:currency" content="DKK" />`;
    expect(parseProduct(html, "https://shop.dk/vase")).toEqual({
      title: "Royal Copenhagen Vase",
      image: "https://shop.dk/vase.jpg",
      storeName: "Royal Copenhagen",
      priceCents: 129900,
      currency: "DKK",
    });
  });

  it("falls back to JSON-LD offers and hostname store name", () => {
    const html = `
      <title>Nice Lamp — MyShop</title>
      <script type="application/ld+json">
        {"@type":"Product","name":"Nice Lamp","offers":{"@type":"Offer","price":"499.5","priceCurrency":"EUR"}}
      </script>`;
    const p = parseProduct(html, "https://www.myshop.com/lamp");
    expect(p.title).toBe("Nice Lamp — MyShop");
    expect(p.storeName).toBe("myshop.com");
    expect(p.priceCents).toBe(49950);
    expect(p.currency).toBe("EUR");
  });

  it("decodes entities and tolerates a missing price", () => {
    const html = `<meta property="og:title" content="Salt &amp; Pepper" />`;
    const p = parseProduct(html, "https://x.dk/y");
    expect(p.title).toBe("Salt & Pepper");
    expect(p.priceCents).toBeNull();
  });
});
