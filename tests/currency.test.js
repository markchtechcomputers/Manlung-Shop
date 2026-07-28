import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

const CURRENCY_DOM = `
  <select id="currencySelector"></select>
  <select id="currencyModalSelect"></select>
  <div id="currencyModal" style="display:flex"><button id="currencyModalContinue"></button></div>
  <input id="countrySearchInput">
  <div id="countrySearchResults"></div>
`;

let currencyFunctions;
let renderFunctions;
let cartFunctions;

function mockFetchJson(responses) {
  // responses: array of objects returned in call order
  let call = 0;
  window.fetch = vi.fn(() => {
    const body = responses[Math.min(call++, responses.length - 1)];
    if (body instanceof Error) return Promise.reject(body);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
  return window.fetch;
}

beforeEach(async () => {
  resetStorage();
  setBody(CURRENCY_DOM);
  siteConfig();
  renderFunctions = { renderProducts: vi.fn(), renderMerch: vi.fn(), renderTestimonials: vi.fn() };
  cartFunctions = { renderCartUI: vi.fn(), showToast: vi.fn() };
  window.renderFunctions = renderFunctions;
  window.cartFunctions = cartFunctions;
  await loadScript("data/countries.js");
  await loadScript("js/currency.js");
  currencyFunctions = window.currencyFunctions;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatPrice", () => {
  it("shows KES untouched by default", () => {
    expect(currencyFunctions.formatPrice(1499)).toBe("KSh 1,499");
  });

  it("converts and rounds amounts of 100+ to whole units", () => {
    currencyFunctions.setCurrency("USD", 0.0078);

    // 199 KES -> 1.55 USD (under 100, so 2 decimals kept)
    expect(currencyFunctions.formatPrice(199)).toBe("$ 1.55");
    // 100000 KES -> 780 USD
    expect(currencyFunctions.formatPrice(100000)).toBe("$ 780");
  });

  it("keeps two decimals for small converted amounts", () => {
    currencyFunctions.setCurrency("GBP", 0.0061);

    expect(currencyFunctions.formatPrice(1000)).toBe("£ 6.1");
  });

  it("falls back to the currency code when there is no known symbol", () => {
    currencyFunctions.setCurrency("XOF", 4.6);

    expect(currencyFunctions.formatPrice(100)).toBe("XOF 460");
  });
});

describe("setCurrency", () => {
  it("caches the choice for the session and re-renders every price on screen", () => {
    currencyFunctions.populateCurrencyDropdowns();

    currencyFunctions.setCurrency("NGN", 12.5);

    expect(JSON.parse(sessionStorage.getItem("manlungCurrency"))).toEqual({
      code: "NGN",
      symbol: "₦",
      rate: 12.5,
      ready: true
    });
    expect(renderFunctions.renderProducts).toHaveBeenCalled();
    expect(renderFunctions.renderMerch).toHaveBeenCalled();
    expect(cartFunctions.renderCartUI).toHaveBeenCalled();
    expect(document.getElementById("currencySelector").value).toBe("NGN");
  });
});

describe("detectAndApplyCurrency", () => {
  it("reuses the currency cached earlier in the session without any network call", async () => {
    sessionStorage.setItem("manlungCurrency", JSON.stringify({ code: "EUR", symbol: "€", rate: 0.0072, ready: true }));
    const fetchMock = mockFetchJson([{}]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(currencyFunctions.formatPrice(100000)).toBe("€ 720");
  });

  it("re-detects when the cached value is corrupt", async () => {
    sessionStorage.setItem("manlungCurrency", "{not json");
    mockFetchJson([{ currency: "KES" }]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(window.currencyState.code).toBe("KES");
  });

  it("skips the exchange rate lookup for Kenyan visitors", async () => {
    const fetchMock = mockFetchJson([{ currency: "KES" }]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });

  it("applies the detected currency and its KES conversion rate", async () => {
    mockFetchJson([{ currency: "ZAR" }, { rates: { ZAR: 0.14 } }]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(window.currencyState).toMatchObject({ code: "ZAR", symbol: "R", rate: 0.14 });
  });

  it("stays on KES when the rate for the detected currency is unavailable", async () => {
    mockFetchJson([{ currency: "ZMW" }, { rates: {} }]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });

  it("stays on KES when the geo lookup fails entirely", async () => {
    mockFetchJson([new Error("offline")]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });

  it("defaults to KES when the geo response has no currency field", async () => {
    mockFetchJson([{}]);

    await currencyFunctions.detectAndApplyCurrency();

    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });
});

describe("populateCurrencyDropdowns", () => {
  it("fills both the navbar and modal selects from the country list", () => {
    currencyFunctions.populateCurrencyDropdowns();

    const navOptions = document.querySelectorAll("#currencySelector option");
    expect(navOptions).toHaveLength(window.COUNTRY_CURRENCY_LIST.length);
    expect(navOptions[0].textContent).toContain("Kenya");
    expect(document.querySelectorAll("#currencyModalSelect option")).toHaveLength(window.COUNTRY_CURRENCY_LIST.length);
  });
});

describe("initCurrencySelector", () => {
  it("fetches a rate when a non-KES currency is picked", async () => {
    currencyFunctions.populateCurrencyDropdowns();
    currencyFunctions.initCurrencySelector();
    mockFetchJson([{ rates: { GBP: 0.0061 } }]);

    const select = document.getElementById("currencySelector");
    select.value = "GBP";
    select.dispatchEvent(new window.Event("change"));
    await vi.waitFor(() => expect(window.currencyState.code).toBe("GBP"));

    expect(window.currencyState.rate).toBe(0.0061);
  });

  it("skips the rate lookup for KES", () => {
    currencyFunctions.populateCurrencyDropdowns();
    currencyFunctions.initCurrencySelector();
    const fetchMock = mockFetchJson([{}]);

    const select = document.getElementById("currencySelector");
    select.value = "KES";
    select.dispatchEvent(new window.Event("change"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });

  it("warns and falls back to KES when the rate lookup fails", async () => {
    currencyFunctions.populateCurrencyDropdowns();
    currencyFunctions.initCurrencySelector();
    mockFetchJson([new Error("rate service down")]);

    const select = document.getElementById("currencySelector");
    select.value = "USD";
    select.dispatchEvent(new window.Event("change"));
    await vi.waitFor(() => expect(cartFunctions.showToast).toHaveBeenCalled());

    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });
});

describe("initCountrySearch", () => {
  it("lists at most 8 countries before any search", () => {
    currencyFunctions.initCountrySearch();

    expect(document.querySelectorAll(".country-result")).toHaveLength(8);
  });

  it("filters by country name and by currency code", () => {
    currencyFunctions.initCountrySearch();
    const input = document.getElementById("countrySearchInput");

    input.value = "ugan";
    input.dispatchEvent(new window.Event("input"));
    expect([...document.querySelectorAll(".country-result")].map(el => el.dataset.code)).toEqual(["UGX"]);

    input.value = "zar";
    input.dispatchEvent(new window.Event("input"));
    expect([...document.querySelectorAll(".country-result")].map(el => el.dataset.code)).toEqual(["ZAR"]);
  });

  it("shows an empty state when nothing matches", () => {
    currencyFunctions.initCountrySearch();
    const input = document.getElementById("countrySearchInput");

    input.value = "atlantis";
    input.dispatchEvent(new window.Event("input"));

    expect(document.getElementById("countrySearchResults").textContent).toContain("No matches");
  });

  it("switches currency when a result is clicked", async () => {
    currencyFunctions.initCountrySearch();
    mockFetchJson([{ rates: { USD: 0.0078 } }]);

    document.querySelector('.country-result[data-code="USD"]').click();
    await vi.waitFor(() => expect(window.currencyState.code).toBe("USD"));

    expect(cartFunctions.showToast).toHaveBeenCalledWith("Currency set to USD");
  });

  it("does nothing when the search elements are absent", () => {
    setBody("");

    expect(() => currencyFunctions.initCountrySearch()).not.toThrow();
  });
});

describe("initCurrencyModal", () => {
  it("hides itself when a currency was already chosen this session", () => {
    sessionStorage.setItem("manlungCurrency", JSON.stringify({ code: "KES", symbol: "KSh", rate: 1, ready: true }));

    currencyFunctions.initCurrencyModal();

    expect(document.getElementById("currencyModal").style.display).toBe("none");
  });

  it("applies the visitor's pick and closes on continue", async () => {
    currencyFunctions.populateCurrencyDropdowns();
    currencyFunctions.initCurrencyModal();
    mockFetchJson([{ rates: { TZS: 20.1 } }]);

    document.getElementById("currencyModalSelect").value = "TZS";
    document.getElementById("currencyModalContinue").click();
    await vi.waitFor(() => expect(window.currencyState.code).toBe("TZS"));

    expect(window.currencyState.rate).toBe(20.1);
    expect(document.getElementById("currencyModal").style.display).toBe("none");
  });

  it("falls back to KES when the rate lookup fails on continue", async () => {
    currencyFunctions.populateCurrencyDropdowns();
    currencyFunctions.initCurrencyModal();
    mockFetchJson([new Error("offline")]);

    document.getElementById("currencyModalSelect").value = "EUR";
    document.getElementById("currencyModalContinue").click();
    await vi.waitFor(() => expect(document.getElementById("currencyModal").style.display).toBe("none"));

    expect(window.currencyState).toMatchObject({ code: "KES", rate: 1 });
  });
});
