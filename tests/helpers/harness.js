// Test harness for the storefront's plain <script> modules.
//
// The site has no build step and no module system: each file in js/ runs as a
// classic script and publishes its API on `window` (window.cartFunctions,
// window.currencyFunctions, ...). Tests therefore import the file for its side
// effects and then drive it through those window.* objects, exactly like the
// browser does. Every module is re-imported per test so its top-level state
// (the cart array, the currency state, ...) starts fresh.

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { vi } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let loadCount = 0;

export async function loadScript(relPath) {
  vi.resetModules();
  // The cache-busting query guarantees a fresh execution even if the module
  // graph is still cached, so no test can inherit another test's closure state.
  const url = `${pathToFileURL(path.join(ROOT, relPath)).href}?load=${++loadCount}`;
  await import(/* @vite-ignore */ url);
}

export function resetStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

export function setBody(html) {
  document.body.innerHTML = html;
}

// A minimal SITE_CONFIG. Individual tests override the fields they care about
// (GATEWAY_URL, PAYSTACK_PUBLIC_KEY, ...) to select a code path.
export function siteConfig(overrides = {}) {
  window.SITE_CONFIG = {
    PAYSTACK_PUBLIC_KEY: "pk_test_abc123",
    GATEWAY_URL: "https://REPLACE_WITH_YOUR_GATEWAY_URL.onrender.com",
    CURRENCY: "KES",
    SUPPORT_EMAIL: "support@example.com",
    WHATSAPP_NUMBER: "254700000000",
    ADMIN_PASSWORD: "secret",
    SUPABASE_CONFIG: { url: "https://REPLACE_WITH_PROJECT.supabase.co", anonKey: "anon" },
    RATE_CARD_IMAGE_URL: "https://i.postimg.cc/REPLACE_WITH_DIRECT_LINK/rate-card.jpg",
    ...overrides
  };
  return window.SITE_CONFIG;
}

export function productData() {
  return {
    digitalProducts: [
      { id: 1, title: "My Gee", price: 199, stock: 999, soldOut: false, downloadUrl: "https://cdn.test/my-gee.mp3" },
      { id: 2, title: "Black Africa", price: 499, stock: 999, soldOut: false, featured: true, downloadUrl: "" }
    ],
    cdProducts: [
      {
        id: 7,
        title: "MANLUNG CD (Signed)",
        price: 1499,
        stock: 47,
        soldOut: false,
        tracks: [
          { title: "Track One", url: "https://cdn.test/one.mp3" },
          { title: "Track Two", url: "https://cdn.test/two.mp3" }
        ]
      }
    ],
    merchItems: [
      { id: 101, title: "Money Bag Hoodie", price: 4999, description: "Hoodie", sizes: ["S", "M"], colors: [{ name: "White", code: "#fff" }, { name: "Black", code: "#111" }] }
    ],
    testimonials: [{ name: "@fan", text: "Banger", stars: 4 }],
    get allProducts() {
      return [...this.digitalProducts, ...this.cdProducts];
    }
  };
}

// window.productData is what every module reads. Snapshot-style plain object so
// tests can mutate it freely.
export function installProductData(data = productData()) {
  window.productData = JSON.parse(JSON.stringify({
    digitalProducts: data.digitalProducts,
    cdProducts: data.cdProducts,
    merchItems: data.merchItems,
    testimonials: data.testimonials,
    allProducts: [...data.digitalProducts, ...data.cdProducts]
  }));
  return window.productData;
}

// Currency formatting is used by cart/render; stub it so their tests assert on
// their own behaviour rather than on currency conversion.
export function stubCurrencyFunctions() {
  window.currencyFunctions = {
    formatPrice: vi.fn(amount => `KSh ${amount}`),
    refreshDisplayedPrices: vi.fn()
  };
  return window.currencyFunctions;
}

export function stubPaystackFunctions() {
  window.paystackCheckoutFunctions = { checkout: vi.fn() };
  return window.paystackCheckoutFunctions;
}
