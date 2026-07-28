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
  const E = window.appErrors;
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
      E.report("data-store:supabase-init", e);
      cloudReady = false;
    }
  }

  // A catalog is only usable if the three product arrays really are arrays —
  // anything else (a half-written cloud row, hand-edited storage) would throw
  // deep inside the renderers instead of here.
  function isUsableCatalog(candidate) {
    return !!candidate
      && Array.isArray(candidate.digitalProducts)
      && Array.isArray(candidate.cdProducts)
      && Array.isArray(candidate.merchItems);
  }

  function adopt(candidate, context) {
    if (!isUsableCatalog(candidate)) {
      E.report(context, new Error("Product data is missing its digitalProducts/cdProducts/merchItems arrays — keeping the previous catalog"));
      return false;
    }
    candidate.testimonials = Array.isArray(candidate.testimonials) ? candidate.testimonials : [];
    candidate.allProducts = [...candidate.digitalProducts, ...candidate.cdProducts];
    window.productData = candidate;
    return true;
  }

  function loadFromLocalStorage() {
    const parsed = E.local.getJson(STORAGE_KEY, null);
    if (!parsed) return;
    if (!adopt(parsed, "data-store:local-catalog")) E.local.remove(STORAGE_KEY);
  }

  function saveToLocalStorage() {
    window.productData.allProducts = [
      ...window.productData.digitalProducts,
      ...window.productData.cdProducts
    ];
    return E.local.setJson(STORAGE_KEY, window.productData);
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
          // PGRST116 = no row yet, the normal state of a fresh install.
          if (error && error.code !== "PGRST116") {
            E.report("data-store:cloud-read", error);
          } else if (data && data.data) {
            adopt(data.data, "data-store:cloud-catalog");
          }
          rerenderEverything();
        })
        .catch(e => {
          E.report("data-store:cloud-read", e);
          rerenderEverything();
        });

      // Live updates — if the admin (or anyone) changes data, every open tab updates automatically
      sb.channel("manlung_products_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` }, payload => {
          const newData = payload.new?.data;
          if (!newData) return;
          if (adopt(newData, "data-store:cloud-catalog")) rerenderEverything();
        })
        .subscribe(status => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            E.report("data-store:cloud-subscribe", new Error(`Live product updates are not active (${status}) — this tab needs a reload to see admin changes`));
          }
        });
    }
  }

  // Called whenever the admin saves changes. Resolves with the outcome of both
  // writes so the caller can report what actually persisted instead of always
  // claiming success.
  function saveToStorage() {
    const localSaved = saveToLocalStorage();
    if (!localSaved) {
      E.notify("⚠️ Couldn't save on this device — storage is blocked or full");
    }

    if (!cloudReady) return Promise.resolve({ localSaved, cloudSaved: false, cloudConfigured: false });

    return sb.from(TABLE).upsert({ id: ROW_ID, data: window.productData })
      .then(({ error }) => {
        if (error) {
          E.report("data-store:cloud-write", error, "⚠️ Couldn't sync to cloud — saved on this device only");
          return { localSaved, cloudSaved: false, cloudConfigured: true };
        }
        return { localSaved, cloudSaved: true, cloudConfigured: true };
      })
      .catch(e => {
        E.report("data-store:cloud-write", e, "⚠️ Couldn't reach the cloud — saved on this device only");
        return { localSaved, cloudSaved: false, cloudConfigured: true };
      });
  }

  function resetToDefaults() {
    window.productData = JSON.parse(JSON.stringify(window.DEFAULT_PRODUCT_DATA));
    E.local.remove(STORAGE_KEY);
    if (!cloudReady) return Promise.resolve(true);

    return sb.from(TABLE).delete().eq("id", ROW_ID)
      .then(({ error }) => {
        if (error) {
          E.report("data-store:cloud-reset", error, "⚠️ Reset this device, but the cloud copy is still there — try again");
          return false;
        }
        return true;
      })
      .catch(e => {
        E.report("data-store:cloud-reset", e, "⚠️ Reset this device, but couldn't reach the cloud copy — try again");
        return false;
      });
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
    isSupabaseConnected: () => cloudReady,
    getClient: () => sb
  };
})();
