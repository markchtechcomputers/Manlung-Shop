import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installProductData, loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

const APP_DOM = `
  <nav class="nav-links">
    <a href="#" data-nav="home">Home</a>
    <a href="#" data-nav="music">Music</a>
    <a href="#" data-nav="contact">Contact</a>
  </nav>
  <button id="shopNowBtn"></button>
  <button id="backToHomeBtn"></button>
  <section id="home-section"></section>
  <section id="music-section"></section>
  <section id="cds-section"></section>
  <section id="merch-section"></section>
  <section id="tour-section"></section>
  <section id="contact-section"></section>
  <button id="scrollTopBtn"></button>
  <input id="captureEmail">
  <button id="subscribeEmailBtn"></button>
  <input id="tourNotifyEmail">
  <button id="tourNotifyBtn"></button>
  <div id="cartSidebar"></div>
  <button id="cartIconBtn"></button>
  <button id="closeCartBtn"></button>
  <button id="checkoutBtn"></button>
`;

let cartFunctions;
let stubs;

const el = id => document.getElementById(id);

// app.js has no exports: importing it runs initApp, which is what these tests exercise.
async function bootApp() {
  await loadScript("js/app.js");
}

beforeEach(() => {
  vi.useFakeTimers();
  resetStorage();
  setBody(APP_DOM);
  siteConfig();
  installProductData();
  window.scrollTo = vi.fn();
  vi.spyOn(console, "log").mockImplementation(() => {});

  cartFunctions = {
    loadCart: vi.fn(),
    showToast: vi.fn(),
    processCheckout: vi.fn(),
    renderCartUI: vi.fn()
  };
  stubs = {
    cartFunctions,
    renderFunctions: { renderProducts: vi.fn(), renderMerch: vi.fn(), renderTestimonials: vi.fn() },
    tourSystem: {
      setupTourEvents: vi.fn(),
      initTourSlideshow: vi.fn(),
      initRateCardDownload: vi.fn(),
      checkPaymentReturn: vi.fn()
    },
    paystackCheckoutFunctions: { checkGatewayReturn: vi.fn() },
    brandsCarouselFunctions: { initBrandsCarousel: vi.fn() },
    currencyFunctions: {
      populateCurrencyDropdowns: vi.fn(),
      initCurrencyModal: vi.fn(),
      initCountrySearch: vi.fn(),
      initCurrencySelector: vi.fn(),
      detectAndApplyCurrency: vi.fn()
    },
    menuFunctions: { initMenuPanel: vi.fn(), initAccountSystem: vi.fn() }
  };
  Object.assign(window, stubs);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("initApp", () => {
  it("boots every module once", async () => {
    await bootApp();

    expect(cartFunctions.loadCart).toHaveBeenCalledTimes(1);
    expect(stubs.renderFunctions.renderProducts).toHaveBeenCalledTimes(1);
    expect(stubs.renderFunctions.renderMerch).toHaveBeenCalledTimes(1);
    expect(stubs.renderFunctions.renderTestimonials).toHaveBeenCalledTimes(1);
    expect(stubs.tourSystem.setupTourEvents).toHaveBeenCalledTimes(1);
    expect(stubs.tourSystem.checkPaymentReturn).toHaveBeenCalledTimes(1);
    expect(stubs.paystackCheckoutFunctions.checkGatewayReturn).toHaveBeenCalledTimes(1);
    expect(stubs.brandsCarouselFunctions.initBrandsCarousel).toHaveBeenCalledTimes(1);
    expect(stubs.currencyFunctions.detectAndApplyCurrency).toHaveBeenCalledTimes(1);
    expect(stubs.menuFunctions.initMenuPanel).toHaveBeenCalledTimes(1);
    expect(stubs.menuFunctions.initAccountSystem).toHaveBeenCalledTimes(1);
  });

  it("shows the home section only, with the back button hidden", async () => {
    await bootApp();

    expect(el("home-section").style.display).toBe("block");
    expect(el("music-section").style.display).toBe("none");
    expect(el("backToHomeBtn").style.display).toBe("none");
  });
});

describe("navigation", () => {
  beforeEach(async () => {
    await bootApp();
  });

  it("switches sections from the nav links and reveals the back button", () => {
    document.querySelector('[data-nav="music"]').click();

    expect(el("music-section").style.display).toBe("block");
    expect(el("home-section").style.display).toBe("none");
    expect(el("backToHomeBtn").style.display).toBe("flex");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("sends SHOP NOW to the music section and the back button home", () => {
    el("shopNowBtn").click();
    expect(el("music-section").style.display).toBe("block");

    el("backToHomeBtn").click();
    expect(el("home-section").style.display).toBe("block");
    expect(el("backToHomeBtn").style.display).toBe("none");
  });
});

describe("welcome toast", () => {
  it("greets a first-time visitor once per session", async () => {
    await bootApp();
    vi.advanceTimersByTime(600);

    expect(cartFunctions.showToast).toHaveBeenCalledWith("👋 Welcome to Manlung Shop!");
    expect(sessionStorage.getItem("manlungWelcomeShown")).toBe("true");
  });

  it("stays quiet on a later page view in the same session", async () => {
    sessionStorage.setItem("manlungWelcomeShown", "true");

    await bootApp();
    vi.advanceTimersByTime(600);

    expect(cartFunctions.showToast).not.toHaveBeenCalled();
  });
});

describe("scroll-to-top button", () => {
  it("appears only once the visitor has scrolled down", async () => {
    await bootApp();

    window.scrollY = 100;
    window.dispatchEvent(new window.Event("scroll"));
    expect(el("scrollTopBtn").style.display).toBe("none");

    window.scrollY = 500;
    window.dispatchEvent(new window.Event("scroll"));
    expect(el("scrollTopBtn").style.display).toBe("flex");
  });

  it("scrolls back to the top when clicked", async () => {
    await bootApp();

    el("scrollTopBtn").click();

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("email capture", () => {
  beforeEach(async () => {
    await bootApp();
  });

  it("accepts a valid newsletter email and clears the input", () => {
    el("captureEmail").value = "fan@example.com";

    el("subscribeEmailBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Subscribed!");
    expect(el("captureEmail").value).toBe("");
  });

  it("rejects an invalid newsletter email", () => {
    el("captureEmail").value = "nope";

    el("subscribeEmailBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Enter valid email");
    expect(el("captureEmail").value).toBe("nope");
  });

  it("accepts a valid tour notification email and clears the input", () => {
    el("tourNotifyEmail").value = "fan@example.com";

    el("tourNotifyBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("You'll be notified when a show is announced!");
    expect(el("tourNotifyEmail").value).toBe("");
  });

  it("rejects an invalid tour notification email", () => {
    el("tourNotifyEmail").value = "nope@nope";

    el("tourNotifyBtn").click();

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Enter a valid email");
  });
});

describe("cart sidebar", () => {
  it("opens, closes and checks out", async () => {
    await bootApp();

    el("cartIconBtn").click();
    expect(el("cartSidebar").classList.contains("open")).toBe(true);

    el("closeCartBtn").click();
    expect(el("cartSidebar").classList.contains("open")).toBe(false);

    el("checkoutBtn").click();
    expect(cartFunctions.processCheckout).toHaveBeenCalled();
  });
});

describe("pages without the storefront markup", () => {
  it("boots without throwing", async () => {
    setBody("");

    await expect(bootApp()).resolves.not.toThrow();
  });
});
