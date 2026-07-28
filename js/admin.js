// ============================================================
// Admin Portal
// ============================================================

function toast(msg) {
  const t = document.getElementById("adminToast");
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(() => (t.style.opacity = "0"), 1800);
}

// ---------- LOGIN ----------
// Two modes:
//  1. SUPABASE MODE (config.ADMIN_EMAIL set): the real one. The password is
//     checked by Supabase Auth, and RLS lets only this signed-in user write the
//     shared catalog, so the login can't be bypassed from the browser.
//  2. LOCAL MODE (no ADMIN_EMAIL): offline/preview gate. The password is checked
//     against a PBKDF2 hash in config.js; edits stay in this browser.
function supabaseAdminAuthConfigured() {
  return !!(window.SITE_CONFIG?.ADMIN_EMAIL && window.dataStore?.getClient?.());
}

function storedPasswordRecord() {
  const rec = window.SITE_CONFIG?.ADMIN_PASSWORD_PBKDF2;
  return rec && rec.salt && rec.hash ? rec : null;
}

function initLogin() {
  const form = document.getElementById("loginForm");
  const emailField = document.getElementById("adminEmailField");
  const emailInput = document.getElementById("adminEmailInput");
  const input = document.getElementById("adminPasswordInput");
  const err = document.getElementById("loginError");
  const setupBox = document.getElementById("passwordSetupBox");

  if (supabaseAdminAuthConfigured()) {
    if (emailField) emailField.style.display = "block";
    if (emailInput) emailInput.value = window.SITE_CONFIG.ADMIN_EMAIL;
    initSupabaseLogin(form, emailInput, input, err);
    return;
  }

  if (!storedPasswordRecord()) {
    // No password configured yet — refuse to open the dashboard and show the
    // one-time setup flow instead of falling back to a default password.
    form.style.display = "none";
    if (setupBox) setupBox.style.display = "block";
    err.textContent = "No admin password configured yet.";
    return;
  }

  initLocalLogin(form, input, err);
}

function initSupabaseLogin(form, emailInput, input, err) {
  const sb = window.dataStore.getClient();

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) showDashboard();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const email = (emailInput?.value || window.SITE_CONFIG.ADMIN_EMAIL || "").trim();
    const password = input.value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    input.value = "";
    if (error || !data?.session) {
      err.textContent = error?.message || "Incorrect email or password";
      return;
    }
    showDashboard();
  });
}

function initLocalLogin(form, input, err) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    try {
      if (!window.security?.cryptoAvailable()) {
        err.textContent = "This browser can't verify the password (WebCrypto unavailable over plain HTTP — use https:// or localhost).";
        return;
      }
      const ok = await window.security.verifyPassword(input.value, storedPasswordRecord());
      input.value = "";
      if (!ok) {
        err.textContent = "Incorrect password";
        return;
      }
      showDashboard();
    } catch (ex) {
      err.textContent = "Login error — " + ex.message;
      console.error("Admin login error:", ex);
    }
  });
}

// First-run helper: turns a password into the PBKDF2 block to paste into config.js.
function initPasswordSetup() {
  const btn = document.getElementById("passwordSetupBtn");
  const pass = document.getElementById("setupPasswordInput");
  const out = document.getElementById("setupHashOutput");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const value = pass.value;
    if (value.length < 10) {
      out.style.display = "block";
      out.value = "Use at least 10 characters.";
      return;
    }
    const record = await window.security.hashPassword(value);
    out.style.display = "block";
    out.value = `ADMIN_PASSWORD_PBKDF2: ${JSON.stringify(record)},`;
    pass.value = "";
  });
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  renderAllTabs();

  const badge = document.getElementById("cloudStatusBadge");
  if (window.dataStore.isCloudConnected?.()) {
    badge.textContent = "🟢 Cloud synced (Supabase) — visible to all visitors";
    badge.style.background = "rgba(16,185,129,0.12)";
    badge.style.color = "#0d8f5f";
  } else {
    badge.textContent = "🟡 This device only — set up Supabase in config.js to go live for everyone";
    badge.style.background = "rgba(230,160,20,0.12)";
    badge.style.color = "#a86a00";
  }
}

async function logout() {
  if (supabaseAdminAuthConfigured()) {
    try { await window.dataStore.getClient().auth.signOut(); } catch (e) { /* offline, ignore */ }
  }
  location.reload();
}

// ---------- TAB SWITCHING ----------
function showTab(tab) {
  document.querySelectorAll(".admin-tab-content").forEach(el => (el.style.display = "none"));
  document.querySelectorAll(".admin-tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${tab}`).style.display = "block";
  document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`).classList.add("active");
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
  const items = window.productData[dataKey];

  const esc = window.security.escapeHtml;

  container.innerHTML = items.map((item, idx) => `
    <div class="admin-card" data-key="${esc(dataKey)}" data-idx="${idx}">
      <div class="admin-card-header">
        <strong>#${esc(item.id)} — ${esc(item.title || "New Item")}</strong>
        <button class="admin-delete-btn" data-key="${esc(dataKey)}" data-idx="${idx}">🗑 Delete</button>
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
  const esc = window.security.escapeHtml;
  const inputId = esc(`${dataKey}-${idx}-${field}`);

  if (field === "images") {
    const val = Array.isArray(value) ? value.join("\n") : "";
    return `<label class="admin-field-full">Product Images (one image URL per line — first one is the main image; add more for a scrollable gallery)
      <textarea id="${inputId}" rows="3" placeholder="https://...\nhttps://...">${esc(val)}</textarea></label>`;
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
      <textarea id="${inputId}" rows="6" placeholder="Track 1 | https://...\nTrack 2 | https://...">${esc(val)}</textarea></label>`;
  }
  if (field === "colors") {
    const val = Array.isArray(value) ? value.map(c => `${c.name} | ${c.code}`).join("\n") : "";
    return `<label class="admin-field-full">Colours (one per line: <code>Name | #hexcode</code> — add as many as you like, e.g. Gold, Silver, Rose Gold for jewelry)
      <textarea id="${inputId}" rows="4" placeholder="White | #FFFFFF\nGold | #D4AF37">${esc(val)}</textarea></label>`;
  }
  if (field === "sizes") {
    const val = Array.isArray(value) ? value.join(", ") : "";
    return `<label class="admin-field-full">Sizes (comma separated — e.g. <code>S, M, L, XL</code> or <code>6, 7, 8, 9</code> for rings, or <code>One Size</code>)
      <input type="text" id="${inputId}" value="${esc(val)}" placeholder="S, M, L, XL, XXL"></label>`;
  }
  if (field === "features") {
    const val = Array.isArray(value) ? value.join(", ") : "";
    return `<label>${fieldLabel(field)}<input type="text" id="${inputId}" value="${esc(val)}"></label>`;
  }
  if (field === "featured" || field === "soldOut" || field === "comingSoon") {
    return `<label class="admin-checkbox-label"><input type="checkbox" id="${inputId}" ${value ? "checked" : ""}> ${fieldLabel(field)}</label>`;
  }
  if (field === "description") {
    return `<label>${fieldLabel(field)}<textarea id="${inputId}" rows="2">${esc(value || "")}</textarea></label>`;
  }
  if (field === "price" || field === "stock") {
    return `<label>${fieldLabel(field)}<input type="number" id="${inputId}" value="${esc(value ?? 0)}"></label>`;
  }
  return `<label>${fieldLabel(field)}<input type="text" id="${inputId}" value="${esc(value || "")}"></label>`;
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

  window.dataStore.saveToStorage();
  renderAllTabs();
  toast("✅ Saved — live on this device now. Click Export to publish site-wide.");
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

  const blob = new Blob([code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.js";
  a.click();
  URL.revokeObjectURL(url);
  toast("⬇ products.js downloaded");
}

function resetAllData() {
  if (confirm("Reset all products/CDs/merch back to the original defaults? This discards all admin edits.")) {
    window.dataStore.resetToDefaults();
    renderAllTabs();
    toast("Reset to defaults");
  }
}

// ---------- CHANGE PASSWORD ----------
function initChangePassword() {
  const form = document.getElementById("changePasswordForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("newPasswordInput");
    const newPass = input.value;
    if (newPass.length < 10) {
      toast("Password should be at least 10 characters");
      return;
    }
    if (supabaseAdminAuthConfigured()) {
      const { error } = await window.dataStore.getClient().auth.updateUser({ password: newPass });
      input.value = "";
      toast(error ? `Couldn't change password — ${error.message}` : "✅ Password changed in Supabase");
      return;
    }
    const record = await window.security.hashPassword(newPass);
    document.getElementById("newHashOutput").value = `ADMIN_PASSWORD_PBKDF2: ${JSON.stringify(record)},`;
    document.getElementById("newHashBox").style.display = "block";
    input.value = "";
  });

  document.getElementById("copyHashBtn").addEventListener("click", async () => {
    const output = document.getElementById("newHashOutput");
    try {
      await navigator.clipboard.writeText(output.value);
    } catch (e) {
      output.select();
      document.execCommand("copy");
    }
    toast("Copied — paste into js/config.js");
  });
}

// ---------- INIT ----------
window.onProductDataUpdated = () => {
  if (document.getElementById("dashboard").style.display === "block") renderAllTabs();
};

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initChangePassword();
  initPasswordSetup();

  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  document.getElementById("saveDigitalBtn").addEventListener("click", () =>
    saveCategory("digitalProducts", "digital", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "downloadUrl"]));
  document.getElementById("saveCdsBtn").addEventListener("click", () =>
    saveCategory("cdProducts", "cds", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "images", "audioUrl", "tracks"]));
  document.getElementById("saveMerchBtn").addEventListener("click", () =>
    saveCategory("merchItems", "merch", ["title", "price", "unit", "description", "features", "category", "stock", "colors", "sizes", "comingSoon", "soldOut", "imgUrl", "images"]));

  document.getElementById("addDigitalBtn").addEventListener("click", () =>
    addItem("digitalProducts", { title: "New Track", price: 199, unit: "per track", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW"], featured: false, stock: 999, soldOut: false, downloadUrl: "" }));
  document.getElementById("addCdBtn").addEventListener("click", () =>
    addItem("cdProducts", { title: "New CD", price: 1499, unit: "per CD", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW+CD", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW+CD"], audioUrl: "", tracks: [], featured: false, stock: 50, soldOut: false }));
  document.getElementById("addMerchBtn").addEventListener("click", () =>
    addItem("merchItems", { title: "New Merch Item", price: 2999, unit: "per item", description: "", features: [], category: "unisex", stock: 20, imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", images: ["https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW"], comingSoon: false, soldOut: false, colors: [], sizes: [] }));

  document.getElementById("exportBtn").addEventListener("click", exportProductsFile);
  document.getElementById("resetBtn").addEventListener("click", resetAllData);
  document.getElementById("logoutBtn").addEventListener("click", logout);
});
