// ============================================================
// Central Data Store — dual-backend with automatic failover
// ============================================================
// data/products.js sets window.productData to the DEFAULTS.
// This file then syncs with up to TWO cloud backends (Supabase primary,
// Firebase backup) so that if one goes down, the site keeps working off
// the other. Saves write to BOTH when both are configured. Reads try
// Supabase first, then Firebase, then fall back to localStorage.

(function () {
  const STORAGE_KEY = "manlungAdminData";
  const SB_TABLE = "manlung_products";
  const FB_PATH = "manlungProducts";
  const ROW_ID = 1;

  window.DEFAULT_PRODUCT_DATA = JSON.parse(JSON.stringify(window.productData));

  // ---------- Supabase ----------
  function supabaseConfigured() {
    const cfg = window.SITE_CONFIG?.SUPABASE_CONFIG;
    return !!(cfg && cfg.url && !cfg.url.includes("REPLACE_WITH") && typeof supabase !== "undefined");
  }
  let sb = null;
  let sbReady = false;

  function initSupabase() {
    if (!supabaseConfigured()) return;
    try {
      sb = supabase.createClient(window.SITE_CONFIG.SUPABASE_CONFIG.url, window.SITE_CONFIG.SUPABASE_CONFIG.anonKey);
      sbReady = true;
    } catch (e) {
      console.warn("Supabase init failed.", e);
      sbReady = false;
    }
  }

  // ---------- Firebase (backup) ----------
  function firebaseConfigured() {
    const cfg = window.SITE_CONFIG?.FIREBASE_CONFIG;
    return !!(cfg && cfg.databaseURL && !cfg.databaseURL.includes("REPLACE_WITH") && typeof firebase !== "undefined");
  }
  let fbDb = null;
  let fbReady = false;

  function initFirebase() {
    if (!firebaseConfigured()) return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.SITE_CONFIG.FIREBASE_CONFIG);
      fbDb = firebase.database();
      fbReady = true;
    } catch (e) {
      console.warn("Firebase (backup) init failed.", e);
      fbReady = false;
    }
  }

  // ---------- localStorage (final fallback) ----------
  function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      parsed.allProducts = window.utils.combineProducts(parsed.digitalProducts, parsed.cdProducts);
      window.productData = parsed;
    } catch (e) {
      console.warn("Could not parse saved local data, using defaults.", e);
    }
  }
  function saveToLocalStorage() {
    window.productData.allProducts = window.utils.combineProducts(
      window.productData.digitalProducts,
      window.productData.cdProducts
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.productData));
  }

  function rerenderEverything() {
    window.renderFunctions?.renderProducts();
    window.renderFunctions?.renderMerch();
    window.renderFunctions?.renderTestimonials();
    window.cartFunctions?.renderCartUI();
    window.currencyFunctions?.refreshDisplayedPrices();
    window.onProductDataUpdated?.();
  }

  function applyIncoming(parsed) {
    if (!parsed) return;
    parsed.allProducts = window.utils.combineProducts(parsed.digitalProducts, parsed.cdProducts);
    window.productData = parsed;
    rerenderEverything();
  }

  // ---------- Load (Supabase -> Firebase -> localStorage) ----------
  function loadData() {
    loadFromLocalStorage(); // instant, so the page has something to show right away
    initSupabase();
    initFirebase();

    if (sbReady) {
      sb.from(SB_TABLE).select("data").eq("id", ROW_ID).single()
        .then(({ data, error }) => {
          if (!error && data && data.data) {
            applyIncoming(data.data);
          } else if (fbReady) {
            loadFromFirebaseOnce();
          } else {
            rerenderEverything();
          }
        })
        .catch(() => {
          console.warn("Supabase read failed, trying Firebase backup...");
          if (fbReady) loadFromFirebaseOnce(); else rerenderEverything();
        });

      sb.channel("manlung_products_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: SB_TABLE, filter: `id=eq.${ROW_ID}` }, payload => {
          if (payload.new?.data) applyIncoming(payload.new.data);
        })
        .subscribe();
    } else if (fbReady) {
      loadFromFirebaseOnce();
    } else {
      rerenderEverything();
    }

    // Firebase live listener runs regardless (backup stays in sync live too)
    if (fbReady) {
      fbDb.ref(FB_PATH).on("value", snap => {
        if (!snap.exists()) return;
        // Only apply Firebase's live updates if Supabase isn't the active source
        if (!sbReady) applyIncoming(snap.val());
      });
    }
  }

  function loadFromFirebaseOnce() {
    fbDb.ref(FB_PATH).once("value").then(snap => {
      if (snap.exists()) applyIncoming(snap.val());
      else rerenderEverything();
    }).catch(() => rerenderEverything());
  }

  // ---------- Save (writes to BOTH backends when available) ----------
  function saveToStorage() {
    window.productData.allProducts = window.utils.combineProducts(
      window.productData.digitalProducts,
      window.productData.cdProducts
    );
    saveToLocalStorage();

    let anyCloudSaveFailed = false;

    if (sbReady) {
      sb.from(SB_TABLE).upsert({ id: ROW_ID, data: window.productData }).then(({ error }) => {
        if (error) {
          anyCloudSaveFailed = true;
          console.warn("Supabase write failed.", error);
        }
      });
    }
    if (fbReady) {
      fbDb.ref(FB_PATH).set(window.productData).catch(e => {
        anyCloudSaveFailed = true;
        console.warn("Firebase (backup) write failed.", e);
      });
    }
    if (!sbReady && !fbReady) {
      window.cartFunctions?.showToast?.("⚠️ No cloud database connected — saved on this device only");
    }
  }

  function resetToDefaults() {
    window.productData = JSON.parse(JSON.stringify(window.DEFAULT_PRODUCT_DATA));
    localStorage.removeItem(STORAGE_KEY);
    if (sbReady) sb.from(SB_TABLE).delete().eq("id", ROW_ID);
    if (fbReady) fbDb.ref(FB_PATH).remove();
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
    isCloudConnected: () => sbReady || fbReady,
    isSupabaseConnected: () => sbReady,
    isFirebaseConnected: () => fbReady,
    getClient: () => sb // used by menu.js for Supabase Auth
  };
})();
