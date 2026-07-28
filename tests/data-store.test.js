import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installProductData, loadScript, resetStorage, setBody, siteConfig } from "./helpers/harness.js";

const STORAGE_KEY = "manlungAdminData";
const SUPABASE_URL = "https://project.supabase.co";

let renderFunctions;
let cartFunctions;

// Minimal stand-in for the supabase-js client, recording what the store asks of it.
function fakeSupabase({ selectResult = { data: null, error: null }, upsertResult = { error: null }, throwOnCreate = false } = {}) {
  const calls = { upserts: [], deletes: [], channels: [] };
  const pending = [];
  let changeHandler = null;

  function track(promise) {
    pending.push(promise);
    return promise;
  }

  const client = {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ single: () => track(Promise.resolve(selectResult)) }) }),
      upsert: row => {
        calls.upserts.push(row);
        return track(Promise.resolve(upsertResult));
      },
      delete: () => ({
        eq: (col, val) => {
          calls.deletes.push({ [col]: val });
          return track(Promise.resolve({ error: null }));
        }
      })
    })),
    channel: name => {
      calls.channels.push(name);
      return {
        on: (_event, _filter, handler) => {
          changeHandler = handler;
          return { subscribe: vi.fn() };
        }
      };
    }
  };

  window.supabase = {
    createClient: vi.fn(() => {
      if (throwOnCreate) throw new Error("bad credentials");
      return client;
    })
  };

  return {
    calls,
    emitChange: payload => changeHandler?.(payload),
    // Settles every request the store has made, so assertions never race the
    // store's own .then() handlers.
    settled: async () => {
      await Promise.allSettled(pending);
      await Promise.resolve();
    }
  };
}

beforeEach(async () => {
  resetStorage();
  setBody("");
  siteConfig();
  installProductData();
  renderFunctions = { renderProducts: vi.fn(), renderMerch: vi.fn(), renderTestimonials: vi.fn() };
  cartFunctions = { renderCartUI: vi.fn(), showToast: vi.fn() };
  window.renderFunctions = renderFunctions;
  window.cartFunctions = cartFunctions;
  window.currencyFunctions = { refreshDisplayedPrices: vi.fn() };
  window.onProductDataUpdated = vi.fn();
  delete window.supabase;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.supabase;
});

describe("local-storage mode (no Supabase configured)", () => {
  it("keeps the defaults when nothing has been saved", async () => {
    await loadScript("js/data-store.js");

    expect(window.dataStore.isCloudConnected()).toBe(false);
    expect(window.dataStore.getClient()).toBeNull();
    expect(window.productData.digitalProducts).toHaveLength(2);
    expect(window.DEFAULT_PRODUCT_DATA.digitalProducts).toHaveLength(2);
  });

  it("restores previously saved admin edits and rebuilds allProducts", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      digitalProducts: [{ id: 1, title: "Renamed Single", price: 250 }],
      cdProducts: [{ id: 7, title: "CD", price: 1499 }],
      merchItems: [],
      testimonials: []
    }));

    await loadScript("js/data-store.js");

    expect(window.productData.digitalProducts[0].title).toBe("Renamed Single");
    expect(window.productData.allProducts.map(p => p.id)).toEqual([1, 7]);
  });

  it("ignores corrupt saved data and warns instead of breaking the page", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{not json");

    await loadScript("js/data-store.js");

    expect(warn).toHaveBeenCalled();
    expect(window.productData.digitalProducts).toHaveLength(2);
  });

  it("tolerates saved data that is missing whole sections", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ merchItems: [], testimonials: [] }));

    await loadScript("js/data-store.js");

    expect(window.productData.allProducts).toEqual([]);
  });

  it("saveToStorage writes the catalog and refreshes allProducts", async () => {
    await loadScript("js/data-store.js");
    window.productData.digitalProducts.push({ id: 3, title: "New Single", price: 299 });

    window.dataStore.saveToStorage();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.allProducts.map(p => p.id)).toEqual([1, 2, 3, 7]);
    expect(window.productData.allProducts).toHaveLength(4);
  });

  it("resetToDefaults restores the shipped catalog and drops the saved copy", async () => {
    await loadScript("js/data-store.js");
    window.productData.digitalProducts = [];
    window.dataStore.saveToStorage();

    window.dataStore.resetToDefaults();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.productData.digitalProducts).toHaveLength(2);
  });

  it("resetToDefaults hands back a copy, so later edits do not corrupt the defaults", async () => {
    await loadScript("js/data-store.js");

    window.dataStore.resetToDefaults();
    window.productData.digitalProducts[0].title = "Mutated";

    expect(window.DEFAULT_PRODUCT_DATA.digitalProducts[0].title).toBe("My Gee");
  });
});

describe("nextId", () => {
  it("is one past the highest id across products, CDs and merch", async () => {
    await loadScript("js/data-store.js");

    expect(window.dataStore.nextId()).toBe(102);
  });

  it("starts at 1 for an empty catalog", async () => {
    await loadScript("js/data-store.js");
    window.productData.digitalProducts = [];
    window.productData.cdProducts = [];
    window.productData.merchItems = [];

    expect(window.dataStore.nextId()).toBe(1);
  });
});

describe("cloud mode (Supabase configured)", () => {
  beforeEach(async () => {
    siteConfig({ SUPABASE_CONFIG: { url: SUPABASE_URL, anonKey: "anon-key" } });
  });

  it("connects, adopts the shared catalog and re-renders the page", async () => {
    const sb = fakeSupabase({
      selectResult: {
        data: {
          data: {
            digitalProducts: [{ id: 11, title: "Cloud Single", price: 300 }],
            cdProducts: [{ id: 12, title: "Cloud CD", price: 1500 }],
            merchItems: [],
            testimonials: []
          }
        },
        error: null
      }
    });

    await loadScript("js/data-store.js");

    expect(window.dataStore.isCloudConnected()).toBe(true);
    await sb.settled();
    expect(renderFunctions.renderProducts).toHaveBeenCalled();
    expect(window.productData.digitalProducts[0].title).toBe("Cloud Single");
    expect(window.productData.allProducts.map(p => p.id)).toEqual([11, 12]);
    expect(window.onProductDataUpdated).toHaveBeenCalled();
  });

  it("keeps local data when the cloud read errors", async () => {
    const sb = fakeSupabase({ selectResult: { data: null, error: { message: "no row" } } });
    await loadScript("js/data-store.js");
    await sb.settled();

    expect(renderFunctions.renderProducts).toHaveBeenCalled();
    expect(window.productData.digitalProducts[0].title).toBe("My Gee");
  });

  it("applies live catalog changes pushed from other sessions", async () => {
    const sb = fakeSupabase();
    await loadScript("js/data-store.js");
    await sb.settled();

    sb.emitChange({
      new: {
        data: {
          digitalProducts: [{ id: 21, title: "Pushed Single", price: 199 }],
          cdProducts: [],
          merchItems: [],
          testimonials: []
        }
      }
    });

    expect(window.productData.digitalProducts[0].title).toBe("Pushed Single");
    expect(window.productData.allProducts.map(p => p.id)).toEqual([21]);
  });

  it("ignores a realtime payload with no data", async () => {
    const sb = fakeSupabase();
    await loadScript("js/data-store.js");

    sb.emitChange({ new: {} });

    expect(window.productData.digitalProducts[0].title).toBe("My Gee");
  });

  it("upserts the whole catalog into the shared row on save", async () => {
    const sb = fakeSupabase();
    await loadScript("js/data-store.js");

    window.dataStore.saveToStorage();
    await sb.settled();

    expect(sb.calls.upserts).toHaveLength(1);
    expect(sb.calls.upserts[0].id).toBe(1);
    expect(sb.calls.upserts[0].data.allProducts).toHaveLength(3);
    // Always saved locally too, so a failed sync never loses the edit
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).allProducts).toHaveLength(3);
  });

  it("warns the admin when the cloud write fails but the local save succeeded", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sb = fakeSupabase({ upsertResult: { error: { message: "row level security" } } });
    await loadScript("js/data-store.js");

    window.dataStore.saveToStorage();
    await sb.settled();

    expect(warn).toHaveBeenCalled();
    expect(cartFunctions.showToast).toHaveBeenCalledWith(expect.stringContaining("Couldn't sync to cloud"));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("deletes the shared row on reset", async () => {
    const sb = fakeSupabase();
    await loadScript("js/data-store.js");

    window.dataStore.resetToDefaults();

    expect(sb.calls.deletes).toEqual([{ id: 1 }]);
  });

  it("falls back to local-only when the client cannot be created", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fakeSupabase({ throwOnCreate: true });

    await loadScript("js/data-store.js");

    expect(window.dataStore.isCloudConnected()).toBe(false);
  });

  it("stays local-only while the config still holds the placeholder url", async () => {
    siteConfig({ SUPABASE_CONFIG: { url: "https://REPLACE_WITH_PROJECT.supabase.co", anonKey: "anon" } });
    fakeSupabase();

    await loadScript("js/data-store.js");

    expect(window.dataStore.isCloudConnected()).toBe(false);
  });
});
