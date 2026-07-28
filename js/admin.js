// ============================================================
// Admin Portal
// ============================================================

function toast(msg) {
  const t = document.getElementById("adminToast");
  if (!t) {
    console.warn("[notice]", msg);
    return;
  }
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(() => (t.style.opacity = "0"), 1800);
}

// data-store.js reports failures through cartFunctions.showToast, which only
// exists on the storefront — point it at the admin toast so cloud/storage
// errors are visible here too instead of console-only.
window.cartFunctions = window.cartFunctions || { showToast: toast };

// Wires a listener and says which control is missing rather than throwing and
// silently leaving every later control unwired.
function on(id, event, handler) {
  const el = window.appErrors.requireElement(id, "admin:wiring");
  if (el) el.addEventListener(event, handler);
  return el;
}

// ---------- LOGIN ----------
function initLogin() {
  const form = window.appErrors.requireElement("loginForm", "admin:login");
  const input = window.appErrors.requireElement("adminPasswordInput", "admin:login");
  const err = window.appErrors.requireElement("loginError", "admin:login");
  if (!form || !input || !err) return;

  if (window.appErrors.session.get("manlungAdminLoggedIn") === "true") { showDashboard(); return; }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const entered = input.value.trim();
      const expected = (window.SITE_CONFIG && window.SITE_CONFIG.ADMIN_PASSWORD) || "manlung2026";
      if (entered === expected) {
        // A blocked session store only costs a re-login on refresh.
        window.appErrors.session.set("manlungAdminLoggedIn", "true");
        showDashboard();
      } else {
        err.textContent = "Incorrect password";
        input.value = "";
      }
    } catch (ex) {
      window.appErrors.report("admin:login", ex);
      err.textContent = "Login error — " + ex.message;
    }
  });
}

function showDashboard() {
  const loginScreen = window.appErrors.requireElement("loginScreen", "admin:dashboard");
  const dashboard = window.appErrors.requireElement("dashboard", "admin:dashboard");
  if (loginScreen) loginScreen.style.display = "none";
  if (dashboard) dashboard.style.display = "block";
  renderAllTabs();

  const badge = document.getElementById("cloudStatusBadge");
  if (!badge) return;
  const cloudOn = window.dataStore.isCloudConnected();

  if (cloudOn) {
    badge.textContent = "🟢 Cloud synced (Supabase) — visible to all visitors";
    badge.style.background = "rgba(16,185,129,0.12)";
    badge.style.color = "#0d8f5f";
  } else {
    badge.textContent = "🟡 This device only — set up Supabase in config.js to go live for everyone";
    badge.style.background = "rgba(230,160,20,0.12)";
    badge.style.color = "#a86a00";
  }
}

function logout() {
  window.appErrors.session.remove("manlungAdminLoggedIn");
  location.reload();
}

// ---------- TAB SWITCHING ----------
function showTab(tab) {
  const panel = window.appErrors.requireElement(`tab-${tab}`, "admin:tabs");
  const btn = document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`);
  if (!panel || !btn) {
    window.appErrors.report("admin:tabs", new Error(`Tab "${tab}" has no matching panel or button`), "That tab is unavailable");
    return;
  }
  document.querySelectorAll(".admin-tab-content").forEach(el => (el.style.display = "none"));
  document.querySelectorAll(".admin-tab-btn").forEach(el => el.classList.remove("active"));
  panel.style.display = "block";
  btn.classList.add("active");
}

// ---------- RENDERING ----------
function renderAllTabs() {
  renderCategory("digitalProducts", "digital", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "downloadUrl"]);
  renderCategory("cdProducts", "cds", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "audioUrl", "tracks"]);
  renderCategory("merchItems", "merch", ["title", "price", "unit", "description", "features", "category", "stock", "colors", "sizes", "comingSoon", "soldOut", "imgUrl", "images"]);
}

function fieldLabel(f) {
  const labels = {
    title: "Title", price: "Price (KSh)", unit: "Unit", description: "Description",
    features: "Features (comma separated)", stock: "Stock", featured: "Featured",
    soldOut: "Sold Out", imgUrl: "Image URL", audioUrl: "Audio Preview URL (mp3 link)",
    downloadUrl: "Download File URL (mp3/zip link, plays automatically after payment)",
    comingSoon: "Coming Soon"
  };
  return labels[f] || f;
}

function renderCategory(dataKey, tabId, fields) {
  const container = document.getElementById(`list-${tabId}`);
  if (!container) return;
  const items = window.productData?.[dataKey];
  if (!Array.isArray(items)) {
    window.appErrors.report(
      "admin:render",
      new Error(`productData.${dataKey} is not an array — nothing to edit`),
      "Couldn't load this category — try Reset to defaults if it persists"
    );
    container.innerHTML = `<p class="admin-empty">Couldn't load this category — see the browser console for details.</p>`;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="admin-card" data-key="${dataKey}" data-idx="${idx}">
      <div class="admin-card-header">
        <strong>#${item.id} — ${item.title || "New Item"}</strong>
        <button class="admin-delete-btn" data-key="${dataKey}" data-idx="${idx}">🗑 Delete</button>
      </div>
      <div class="admin-fields">
        ${fields.map(f => renderField(dataKey, idx, f, item[f])).join("")}
      </div>
    </div>
  `).join("") || `<p class="admin-empty">No items yet — add one below.</p>`;

  // wire delete buttons
  container.querySelectorAll(".admin-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const idx = parseInt(btn.dataset.idx);
      if (confirm(`Delete "${window.productData[key][idx].title}"? This can't be undone once saved.`)) {
        window.productData[key].splice(idx, 1);
        renderAllTabs();
        toast("Item removed (click Save to make it permanent)");
      }
    });
  });
}

function renderField(dataKey, idx, field, value) {
  const inputId = `${dataKey}-${idx}-${field}`;

  if (field === "images") {
    const val = Array.isArray(value) ? value.join("\n") : "";
    return `<label class="admin-field-full">Product Images (one image URL per line — first one is the main image; add more for a scrollable gallery)
      <textarea id="${inputId}" rows="3" placeholder="https://...\nhttps://...">${val}</textarea></label>`;
  }
  if (field === "category") {
    const options = ["men", "women", "unisex", "jewelry"];
    return `<label>Category
      <select id="${inputId}">
        ${options.map(o => `<option value="${o}" ${value === o ? "selected" : ""}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`).join("")}
      </select>
    </label>`;
  }
  if (field === "tracks") {
    const val = Array.isArray(value) ? value.map(t => `${t.title} | ${t.url}`).join("\n") : "";
    return `<label class="admin-field-full">Album Tracklist (one per line: <code>Track Title | https://audio-url.mp3</code> — add as many as the album has)
      <textarea id="${inputId}" rows="6" placeholder="Track 1 | https://...\nTrack 2 | https://...">${val}</textarea></label>`;
  }
  if (field === "colors") {
    const val = Array.isArray(value) ? value.map(c => `${c.name} | ${c.code}`).join("\n") : "";
    return `<label class="admin-field-full">Colours (one per line: <code>Name | #hexcode</code> — add as many as you like, e.g. Gold, Silver, Rose Gold for jewelry)
      <textarea id="${inputId}" rows="4" placeholder="White | #FFFFFF\nGold | #D4AF37">${val}</textarea></label>`;
  }
  if (field === "sizes") {
    const val = Array.isArray(value) ? value.join(", ") : "";
    return `<label class="admin-field-full">Sizes (comma separated — e.g. <code>S, M, L, XL</code> or <code>6, 7, 8, 9</code> for rings, or <code>One Size</code>)
      <input type="text" id="${inputId}" value="${escapeAttr(val)}" placeholder="S, M, L, XL, XXL"></label>`;
  }
  if (field === "features") {
    const val = Array.isArray(value) ? value.join(", ") : "";
    return `<label>${fieldLabel(field)}<input type="text" id="${inputId}" value="${escapeAttr(val)}"></label>`;
  }
  if (field === "featured" || field === "soldOut" || field === "comingSoon") {
    return `<label class="admin-checkbox-label"><input type="checkbox" id="${inputId}" ${value ? "checked" : ""}> ${fieldLabel(field)}</label>`;
  }
  if (field === "description") {
    return `<label>${fieldLabel(field)}<textarea id="${inputId}" rows="2">${value || ""}</textarea></label>`;
  }
  if (field === "price" || field === "stock") {
    return `<label>${fieldLabel(field)}<input type="number" id="${inputId}" value="${value ?? 0}"></label>`;
  }
  return `<label>${fieldLabel(field)}<input type="text" id="${inputId}" value="${escapeAttr(value || "")}"></label>`;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

// ---------- SAVE (reads DOM back into data) ----------
function saveCategory(dataKey, tabId, fields) {
  const container = document.getElementById(`list-${tabId}`);
  const items = window.productData[dataKey];

  items.forEach((item, idx) => {
    fields.forEach(f => {
      const el = document.getElementById(`${dataKey}-${idx}-${f}`);
      if (!el) return;
      if (f === "features") {
        item[f] = el.value.split(",").map(s => s.trim()).filter(Boolean);
      } else if (f === "sizes") {
        item[f] = el.value.split(",").map(s => s.trim()).filter(Boolean);
      } else if (f === "colors") {
        item[f] = el.value.split("\n").map(line => {
          const [name, code] = line.split("|").map(s => s.trim());
          return name && code ? { name, code, border: code.toLowerCase() === "#ffffff" ? "1px solid #ccc" : "none" } : null;
        }).filter(Boolean);
      } else if (f === "images") {
        item[f] = el.value.split("\n").map(s => s.trim()).filter(Boolean);
        if (item[f].length && !item.imgUrl) item.imgUrl = item[f][0];
      } else if (f === "tracks") {
        item[f] = el.value.split("\n").map(line => {
          const [title, url] = line.split("|").map(s => s.trim());
          return title && url ? { title, url } : null;
        }).filter(Boolean);
      } else if (f === "featured" || f === "soldOut" || f === "comingSoon") {
        item[f] = el.checked;
      } else if (f === "price" || f === "stock") {
        item[f] = parseFloat(el.value) || 0;
      } else {
        item[f] = el.value;
      }
    });
  });

  // Only report success once the write actually succeeded; saveToStorage
  // already explains any local/cloud failure.
  Promise.resolve(window.dataStore.saveToStorage())
    .then(result => {
      renderAllTabs();
      if (!result || result.localSaved === false) return;
      if (result.cloudConfigured && !result.cloudSaved) return;
      toast(result.cloudSaved
        ? "✅ Saved and synced to the cloud — live for every visitor."
        : "✅ Saved — live on this device now. Click Export to publish site-wide.");
    })
    .catch(e => window.appErrors.report("admin:save", e, "⚠️ Couldn't save your changes — see the browser console"));
}

// ---------- ADD NEW ITEM ----------
function addItem(dataKey, template) {
  const newItem = { id: window.dataStore.nextId(), ...template };
  window.productData[dataKey].unshift(newItem);
  renderAllTabs();
  toast("New item added — fill it in, then Save. It'll show first on the site.");
}

// ---------- EXPORT ----------
function exportProductsFile() {
  const d = window.productData;
  const code = `// Product Data — exported from Admin Portal
// Replace your existing data/products.js with this file, then re-upload/redeploy the site.

const digitalProducts = ${JSON.stringify(d.digitalProducts, null, 2)};

const cdProducts = ${JSON.stringify(d.cdProducts, null, 2)};

const merchItems = ${JSON.stringify(d.merchItems, null, 2)};

const testimonials = ${JSON.stringify(d.testimonials, null, 2)};

const allProducts = [...digitalProducts, ...cdProducts];

window.productData = {
  digitalProducts,
  cdProducts,
  merchItems,
  testimonials,
  allProducts
};
`;

  try {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.js";
    a.click();
    URL.revokeObjectURL(url);
    toast("⬇ products.js downloaded");
  } catch (e) {
    window.appErrors.report("admin:export", e, "⚠️ Couldn't build the export file — see the browser console");
  }
}

function resetAllData() {
  if (!confirm("Reset all products/CDs/merch back to the original defaults? This discards all admin edits.")) return;

  Promise.resolve(window.dataStore.resetToDefaults())
    .then(cloudCleared => {
      renderAllTabs();
      if (cloudCleared) toast("Reset to defaults");
    })
    .catch(e => window.appErrors.report("admin:reset", e, "⚠️ Reset didn't finish — see the browser console"));
}

// ---------- CHANGE PASSWORD ----------
function initChangePassword() {
  const output = window.appErrors.requireElement("newHashOutput", "admin:change-password");
  const box = window.appErrors.requireElement("newHashBox", "admin:change-password");
  const input = window.appErrors.requireElement("newPasswordInput", "admin:change-password");
  if (!output || !box || !input) return;

  on("changePasswordForm", "submit", (e) => {
    e.preventDefault();
    const newPass = input.value.trim();
    if (newPass.length < 6) {
      toast("Password should be at least 6 characters");
      return;
    }
    output.value = newPass;
    box.style.display = "block";
  });

  on("copyHashBtn", "click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      toast("Copied — paste into js/config.js");
      return;
    } catch (e) {
      window.appErrors.report("admin:clipboard", e);
    }
    // Legacy fallback: execCommand reports failure by returning false, so the
    // "Copied" toast must depend on it.
    output.select();
    const copied = document.execCommand("copy");
    toast(copied
      ? "Copied — paste into js/config.js"
      : "Couldn't copy automatically — select the text above and copy it manually");
  });
}

// ---------- INIT ----------
window.onProductDataUpdated = () => {
  const dashboard = document.getElementById("dashboard");
  if (dashboard && dashboard.style.display === "block") renderAllTabs();
};

document.addEventListener("DOMContentLoaded", () => {
  const E = window.appErrors;
  E.safeRun("admin:init-login", initLogin, "⚠️ The login form didn't load correctly — see the browser console");
  E.safeRun("admin:init-change-password", initChangePassword);

  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  on("saveDigitalBtn", "click", () =>
    saveCategory("digitalProducts", "digital", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "downloadUrl"]));
  on("saveCdsBtn", "click", () =>
    saveCategory("cdProducts", "cds", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "audioUrl", "tracks"]));
  on("saveMerchBtn", "click", () =>
    saveCategory("merchItems", "merch", ["title", "price", "unit", "description", "features", "category", "stock", "colors", "sizes", "comingSoon", "soldOut", "imgUrl", "images"]));

  on("addDigitalBtn", "click", () =>
    addItem("digitalProducts", { title: "New Track", price: 199, unit: "per track", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW"], featured: false, stock: 999, soldOut: false, downloadUrl: "" }));
  on("addCdBtn", "click", () =>
    addItem("cdProducts", { title: "New CD", price: 1499, unit: "per CD", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW+CD", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW+CD"], audioUrl: "", tracks: [], featured: false, stock: 50, soldOut: false }));
  on("addMerchBtn", "click", () =>
    addItem("merchItems", { title: "New Merch Item", price: 2999, unit: "per item", description: "", features: [], category: "unisex", stock: 20, imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW"], comingSoon: false, soldOut: false, colors: [], sizes: [] }));

  on("exportBtn", "click", exportProductsFile);
  on("resetBtn", "click", resetAllData);
  on("logoutBtn", "click", logout);
});
