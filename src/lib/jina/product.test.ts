import { describe, it, expect } from "vitest";
import { imageFromMarkdown, parseJinaProduct, pickJinaImage } from "./product";

describe("imageFromMarkdown", () => {
  it("skips logos and returns the first product image", () => {
    const md = "```markdown\n![Image 1: Logo](https://shop.dk/logo.svg)\n![Image 2: Vase](https://shop.dk/vase.jpg)\n```";
    expect(imageFromMarkdown(md)).toBe("https://shop.dk/vase.jpg");
  });
});

describe("pickJinaImage", () => {
  it("prefers the first product-looking image", () => {
    const images = {
      "Image 1: Elgiganten logo": "https://shop.dk/logo.svg",
      "Image 2: DJI backpack": "https://cdn.shop.dk/product/backpack.jpg?w=800",
      "Image 3: TV icon": "https://cdn.shop.dk/icons/tv.png?w=64",
    };
    expect(pickJinaImage(images, "https://shop.dk/p/1")).toBe("https://cdn.shop.dk/product/backpack.jpg?w=800");
  });
});

describe("parseJinaProduct", () => {
  it("parses structured JSON from ReaderLM-v2", () => {
    const content = JSON.stringify({
      title: "Royal Copenhagen Vase",
      image: "https://shop.dk/vase.jpg",
      storeName: "Royal Copenhagen",
      price: 1299,
      currency: "DKK",
    });
    expect(parseJinaProduct({ content }, "https://shop.dk/vase")).toEqual({
      title: "Royal Copenhagen Vase",
      image: "https://shop.dk/vase.jpg",
      storeName: "Royal Copenhagen",
      priceCents: 129900,
      currency: "DKK",
    });
  });

  it("falls back to markdown image and page title", () => {
    const data = {
      title: "DJI Avata 2 rygsæk",
      content: "![Image 1: DJI Avata 2](https://cdn.shop.dk/dji.jpg?w=256)",
    };
    const p = parseJinaProduct(data, "https://www.elgiganten.dk/p/1");
    expect(p.title).toBe("DJI Avata 2 rygsæk");
    expect(p.image).toBe("https://cdn.shop.dk/dji.jpg?w=256");
    expect(p.storeName).toBe("elgiganten.dk");
  });
});
