import { beforeEach, describe, expect, it } from "vitest";
import { loadScript } from "./helpers/harness.js";

// data/products.js is the catalog the site falls back to before any admin edit,
// so its shape is a contract the rest of the modules rely on.
beforeEach(async () => {
  await loadScript("data/products.js");
});

describe("default product data", () => {
  it("publishes every catalog section", () => {
    expect(Object.keys(window.productData).sort()).toEqual([
      "allProducts",
      "cdProducts",
      "digitalProducts",
      "merchItems",
      "testimonials"
    ]);
  });

  it("keeps allProducts in sync with the purchasable items", () => {
    const expected = [...window.productData.digitalProducts, ...window.productData.cdProducts];

    expect(window.productData.allProducts).toEqual(expected);
  });

  it("gives every item a unique id and a whole-shilling price", () => {
    const all = [
      ...window.productData.digitalProducts,
      ...window.productData.cdProducts,
      ...window.productData.merchItems
    ];
    const ids = all.map(item => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    all.forEach(item => {
      expect(item.title).toBeTruthy();
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThan(0);
      expect(item.imgUrl).toMatch(/^https?:\/\//);
    });
  });

  it("gives each CD a tracklist array, which is what auto-downloads after purchase", () => {
    window.productData.cdProducts.forEach(cd => {
      expect(Array.isArray(cd.tracks)).toBe(true);
    });
  });

  it("rates every testimonial from 1 to 5 stars", () => {
    window.productData.testimonials.forEach(t => {
      expect(t.stars).toBeGreaterThanOrEqual(1);
      expect(t.stars).toBeLessThanOrEqual(5);
      expect(t.name).toBeTruthy();
      expect(t.text).toBeTruthy();
    });
  });
});

describe("country/currency list", () => {
  beforeEach(async () => {
    await loadScript("data/countries.js");
  });

  it("starts with Kenya, the currency everything is priced and charged in", () => {
    expect(window.COUNTRY_CURRENCY_LIST[0]).toMatchObject({ country: "Kenya", code: "KES" });
  });

  it("uses a three letter ISO code and a flag for every entry", () => {
    window.COUNTRY_CURRENCY_LIST.forEach(entry => {
      expect(entry.code).toMatch(/^[A-Z]{3}$/);
      expect(entry.country).toBeTruthy();
      expect(entry.flag).toBeTruthy();
    });
  });
});
