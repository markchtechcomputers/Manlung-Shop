// ============================================================
// Central Data Store
// ============================================================
// data/products.js sets window.productData to the DEFAULTS.
// This file then either:
//   (a) syncs with Supabase, if configured in config.js
//       -> admin edits become visible to EVERY visitor, live
//   (b) falls back to this browser's localStorage only
//       -> admin edits are only visible on this device (fine for preview/testing)

(function () {
  const STORAGE_KEY = "manlungAdminData";
  const TABLE = "manlung_products";
  const ROW_ID = 1; // single shared row holding the whole catalog as JSON

  window.DEFAULT_PRODUCT_DATA = JSON.parse(JSON.stringify(window.productData));

  function supabaseConfigured() {
    const cfg = window.SITE_CONFIG?.SUPABASE_CONFIG;
    return !!(cfg && cfg.url && !cfg.url.includes("REPLACE_WITH") && typeof supabase !== "undefined");
  }

  let sb = null;
  let cloudReady = false;

  function initSupabase() {
    if (!supabaseConfigured()) return;
    try {
      sb = supabase.createClient(window.SITE_CONFIG.SUPABASE_CONFIG.url, window.SITE_CONFIG.SUPABASE_CONFIG.anonKey);
      cloudReady = true;
    } catch (e) {
      console.warn("Supabase init failed, falling back to local storage.", e);
      cloudReady = false;
    }
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      parsed.allProducts = [...(parsed.digitalProducts || []), ...(parsed.cdProducts || [])];
      window.productData = parsed;
    } catch (e) {
      console.warn("Could not parse saved local data, using defaults.", e);
    }
  }

  function saveToLocalStorage() {
    window.productData.allProducts = [
      ...window.productData.digitalProducts,
      ...window.productData.cdProducts
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.productData));
  }

  function rerenderEverything() {
    window.renderFunctions?.renderProducts();
    window.renderFunctions?.renderMerch();
    window.renderFunctions?.renderTestimonials();
    window.cartFunctions?.renderCartUI();
    window.currencyFunctions?.refreshDisplayedPrices();
    window.onProductDataUpdated?.(); // admin.js hooks into this to re-render its own tables
  }

  // Called once on page load
  function loadData() {
    loadFromLocalStorage(); // instant, so the page has something to show right away
    initSupabase();

    if (cloudReady) {
      sb.from(TABLE).select("data").eq("id", ROW_ID).single()
        .then(({ data, error }) => {
          if (!error && data && data.data) {
            const parsed = data.data;
            parsed.allProducts = [...(parsed.digitalProducts || []), ...(parsed.cdProducts || [])];
            window.productData = parsed;
          }
          rerenderEverything();
        })
        .catch(e => console.warn("Supabase read failed, using local data.", e));

      // Live updates — if the admin (or anyone) changes data, every open tab updates automatically
      sb.channel("manlung_products_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` }, payload => {
          const newData = payload.new?.data;
          if (!newData) return;
          newData.allProducts = [...(newData.digitalProducts || []), ...(newData.cdProducts || [])];
          window.productData = newData;
          rerenderEverything();
        })
        .subscribe();
    }
  }

  // Called whenever the admin saves changes
  function saveToStorage() {
    window.productData.allProducts = [
      ...window.productData.digitalProducts,
      ...window.productData.cdProducts
    ];
    saveToLocalStorage();

    if (cloudReady) {
      sb.from(TABLE).upsert({ id: ROW_ID, data: window.productData }).then(({ error }) => {
        if (error) {
          console.warn("Supabase write failed — saved locally only.", error);
          window.cartFunctions?.showToast?.("⚠️ Couldn't sync to cloud — saved on this device only");
        }
      });
    }
  }

  function resetToDefaults() {
    window.productData = JSON.parse(JSON.stringify(window.DEFAULT_PRODUCT_DATA));
    localStorage.removeItem(STORAGE_KEY);
    if (cloudReady) sb.from(TABLE).delete().eq("id", ROW_ID);
  }

  function nextId() {
    const all = [
      ...window.productData.digitalProducts,
      ...window.productData.cdProducts,
      ...window.productData.merchItems
    ];
    return all.length ? Math.max(...all.map(p => p.id)) + 1 : 1;
  }

  loadData();

  window.dataStore = {
    STORAGE_KEY,
    saveToStorage,
    resetToDefaults,
    nextId,
    isCloudConnected: () => cloudReady,
    getClient: () => sb
  };
})();
