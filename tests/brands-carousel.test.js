import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, setBody } from "./helpers/harness.js";

const CAROUSEL_DOM = `
  <div id="brandsCarousel">
    <img class="brands-carousel-img active">
    <img class="brands-carousel-img">
  </div>
`;

let initBrandsCarousel;

function imgs() {
  return document.querySelectorAll(".brands-carousel-img");
}

beforeEach(async () => {
  vi.useFakeTimers();
  setBody(CAROUSEL_DOM);
  await loadScript("js/brands-carousel.js");
  initBrandsCarousel = window.brandsCarouselFunctions.initBrandsCarousel;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("initBrandsCarousel", () => {
  it("preloads the first two images", () => {
    window.BRANDS_CAROUSEL_IMAGES = ["https://cdn.test/a.png", "https://cdn.test/b.png", "https://cdn.test/c.png"];

    initBrandsCarousel();

    expect(imgs()[0].src).toBe("https://cdn.test/a.png");
    expect(imgs()[1].src).toBe("https://cdn.test/b.png");
  });

  it("reuses the only image when there is just one", () => {
    window.BRANDS_CAROUSEL_IMAGES = ["https://cdn.test/a.png"];

    initBrandsCarousel();

    expect(imgs()[0].src).toBe("https://cdn.test/a.png");
    expect(imgs()[1].src).toBe("https://cdn.test/a.png");
  });

  it("cross-fades to the next image every 3s and wraps around", () => {
    window.BRANDS_CAROUSEL_IMAGES = ["https://cdn.test/a.png", "https://cdn.test/b.png"];
    initBrandsCarousel();

    vi.advanceTimersByTime(3000);
    expect(imgs()[1].src).toBe("https://cdn.test/b.png");
    expect(imgs()[1].classList.contains("active")).toBe(true);
    expect(imgs()[0].classList.contains("active")).toBe(false);

    vi.advanceTimersByTime(3000);
    expect(imgs()[0].src).toBe("https://cdn.test/a.png");
    expect(imgs()[0].classList.contains("active")).toBe(true);
    expect(imgs()[1].classList.contains("active")).toBe(false);
  });

  it("ships a default set of direct image links", () => {
    expect(window.BRANDS_CAROUSEL_IMAGES.length).toBeGreaterThan(0);
    window.BRANDS_CAROUSEL_IMAGES.forEach(url => {
      expect(url).toMatch(/^https:\/\/i\.postimg\.cc\/.+\.(png|jpe?g|webp|gif)$/i);
    });
  });

  it("does nothing when the carousel is not on the page", () => {
    setBody("");
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    initBrandsCarousel();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it("does nothing when there are no images configured", () => {
    window.BRANDS_CAROUSEL_IMAGES = [];
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    initBrandsCarousel();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
