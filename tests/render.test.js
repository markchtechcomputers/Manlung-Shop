import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installProductData,
  loadScript,
  setBody,
  stubCurrencyFunctions,
  stubPaystackFunctions
} from "./helpers/harness.js";

const RENDER_DOM = `
  <div id="digitalGrid"></div>
  <div id="cdGrid"></div>
  <div id="merchGrid"></div>
  <div id="testimonialsGrid"></div>
`;

let renderFunctions;
let cartFunctions;
let paystack;

beforeEach(async () => {
  setBody(RENDER_DOM);
  installProductData();
  stubCurrencyFunctions();
  paystack = stubPaystackFunctions();
  cartFunctions = { addToCart: vi.fn(), directCheckout: vi.fn(), showToast: vi.fn() };
  window.cartFunctions = cartFunctions;
  await loadScript("js/render.js");
  renderFunctions = window.renderFunctions;
});

describe("renderProducts", () => {
  it("renders a card per digital single and per CD", () => {
    renderFunctions.renderProducts();

    expect(document.querySelectorAll("#digitalGrid .product-card")).toHaveLength(2);
    expect(document.querySelectorAll("#cdGrid .product-card")).toHaveLength(1);
    expect(document.querySelector("#digitalGrid .product-title").textContent).toBe("My Gee");
    expect(document.querySelector("#cdGrid .product-type").textContent).toBe("PHYSICAL CD");
  });

  it("re-renders from scratch instead of appending duplicates", () => {
    renderFunctions.renderProducts();
    renderFunctions.renderProducts();

    expect(document.querySelectorAll("#digitalGrid .product-card")).toHaveLength(2);
  });

  it("marks a sold-out product, disables its buttons and hides the stepper", () => {
    window.productData.digitalProducts[0].soldOut = true;

    renderFunctions.renderProducts();

    const card = document.querySelector("#digitalGrid .product-card");
    expect(card.querySelector(".sold-out-ribbon")).not.toBeNull();
    expect(card.querySelector(".qty-stepper")).toBeNull();
    expect(card.querySelector(".btn-add").disabled).toBe(true);
    expect(card.querySelector(".btn-buy-now").textContent).toBe("SOLD OUT");
  });

  it("treats zero stock as sold out", () => {
    window.productData.digitalProducts[0].stock = 0;

    renderFunctions.renderProducts();

    expect(document.querySelector("#digitalGrid .sold-out-ribbon")).not.toBeNull();
  });

  it("badges a featured product and a low-stock CD", () => {
    window.productData.cdProducts[0].featured = true;

    renderFunctions.renderProducts();

    expect(document.querySelector("#digitalGrid .featured-badge").textContent).toContain("FEATURED");
    expect(document.querySelector("#cdGrid .stock-badge").textContent).toBe("Only 47 left");
    expect(document.querySelector("#cdGrid .featured-badge").textContent).toBe("BESTSELLER");
  });

  it("omits the low-stock badge once stock is comfortable", () => {
    window.productData.cdProducts[0].stock = 500;

    renderFunctions.renderProducts();

    expect(document.querySelector("#cdGrid .stock-badge")).toBeNull();
  });

  it("renders feature tags only when the product has features", () => {
    window.productData.digitalProducts[0].features = ["Instant download", "MP3 320kbps"];
    window.productData.digitalProducts[1].features = [];

    renderFunctions.renderProducts();

    const cards = document.querySelectorAll("#digitalGrid .product-card");
    expect(cards[0].querySelectorAll(".feature-tag")).toHaveLength(2);
    expect(cards[1].querySelector(".feature-tags")).toBeNull();
  });

  it("adds an audio preview only for a CD that has one", () => {
    window.productData.cdProducts[0].audioUrl = "https://cdn.test/preview.mp3";

    renderFunctions.renderProducts();

    expect(document.querySelector("#cdGrid audio").getAttribute("src")).toBe("https://cdn.test/preview.mp3");
  });

  it("steps the quantity up and down but never below one", () => {
    renderFunctions.renderProducts();
    const stepper = document.querySelector('.qty-stepper[data-id="1"]');
    const display = stepper.querySelector(".qty-display");

    stepper.querySelector(".qty-inc").click();
    stepper.querySelector(".qty-inc").click();
    expect(display.textContent).toBe("3");

    stepper.querySelector(".qty-dec").click();
    stepper.querySelector(".qty-dec").click();
    stepper.querySelector(".qty-dec").click();
    expect(display.textContent).toBe("1");
  });

  it("adds to cart with the quantity currently shown in the stepper", () => {
    renderFunctions.renderProducts();
    const card = document.querySelector('#digitalGrid .product-card');
    card.querySelector(".qty-inc").click();

    card.querySelector(".btn-add").click();

    expect(cartFunctions.addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2);
  });

  it("routes BUY NOW straight to a direct checkout", () => {
    renderFunctions.renderProducts();

    document.querySelector("#cdGrid .btn-buy-now").click();

    expect(cartFunctions.directCheckout).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }), 1);
  });

  it("formats every price through the currency module", () => {
    renderFunctions.renderProducts();

    expect(window.currencyFunctions.formatPrice).toHaveBeenCalledWith(199);
    expect(window.currencyFunctions.formatPrice).toHaveBeenCalledWith(1499);
  });

  it("does nothing when the product grids are not on the page", () => {
    setBody("");

    expect(() => renderFunctions.renderProducts()).not.toThrow();
  });
});

describe("renderMerch", () => {
  it("renders colour swatches with the first pre-selected, plus size buttons", () => {
    renderFunctions.renderMerch();

    expect(document.querySelectorAll("#colors-101 .color-option")).toHaveLength(2);
    expect(document.querySelector("#colors-101 .color-option").classList.contains("selected")).toBe(true);
    expect(document.querySelectorAll("#sizes-101 .size-btn")).toHaveLength(2);
  });

  it("moves the selection when another colour or size is clicked", () => {
    renderFunctions.renderMerch();

    const [white, black] = document.querySelectorAll("#colors-101 .color-option");
    black.click();
    expect(white.classList.contains("selected")).toBe(false);
    expect(black.classList.contains("selected")).toBe(true);
    expect(cartFunctions.showToast).toHaveBeenCalledWith("Color: Black selected");

    const [small, medium] = document.querySelectorAll("#sizes-101 .size-btn");
    small.click();
    medium.click();
    expect(small.classList.contains("selected")).toBe(false);
    expect(medium.classList.contains("selected")).toBe(true);
  });

  it("checks out merch as a shippable item with the chosen colour and size", () => {
    renderFunctions.renderMerch();
    document.querySelectorAll("#sizes-101 .size-btn")[1].click();

    document.querySelector(".merch-pay-btn").click();

    const order = paystack.checkout.mock.calls[0][0];
    expect(order).toMatchObject({
      amount: 4999,
      items: [{ id: 101, quantity: 1 }],
      needsShipping: true,
      isPhysical: true,
      downloadItems: []
    });
    expect(order.metadata.custom_fields).toEqual([
      { display_name: "Product", variable_name: "product", value: "Money Bag Hoodie" },
      { display_name: "Color", variable_name: "color", value: "White" },
      { display_name: "Size", variable_name: "size", value: "M" }
    ]);
  });

  it("reports Default/Not selected for merch without colour or size options", () => {
    window.productData.merchItems = [{ id: 105, title: "Sticker Pack", price: 500, description: "Stickers" }];

    renderFunctions.renderMerch();
    document.querySelector(".merch-pay-btn").click();

    const fields = paystack.checkout.mock.calls[0][0].metadata.custom_fields;
    expect(fields[1].value).toBe("Default");
    expect(fields[2].value).toBe("Not selected");
  });

  it("shows a coming-soon overlay with a disabled NOTIFY ME button", () => {
    window.productData.merchItems[0].comingSoon = true;

    renderFunctions.renderMerch();

    expect(document.querySelector(".coming-soon-text").textContent).toBe("COMING SOON");
    expect(document.querySelector(".merch-btn").disabled).toBe(true);
    expect(document.querySelector(".merch-pay-btn")).toBeNull();
  });

  it("shows a sold-out overlay with no buy button", () => {
    window.productData.merchItems[0].soldOut = true;

    renderFunctions.renderMerch();

    expect(document.querySelector(".coming-soon-text").textContent).toBe("SOLD OUT");
    expect(document.querySelector(".merch-pay-btn")).toBeNull();
  });

  it("does nothing when the merch grid is not on the page", () => {
    setBody("");

    expect(() => renderFunctions.renderMerch()).not.toThrow();
  });
});

describe("renderTestimonials", () => {
  it("renders filled and empty stars out of five", () => {
    renderFunctions.renderTestimonials();

    expect(document.querySelectorAll(".testimonial-card")).toHaveLength(1);
    expect(document.querySelector(".stars").textContent).toBe("★★★★☆");
    expect(document.querySelector(".testimonial-author").textContent).toContain("@fan");
  });

  it("does nothing when the testimonials grid is not on the page", () => {
    setBody("");

    expect(() => renderFunctions.renderTestimonials()).not.toThrow();
  });
});
