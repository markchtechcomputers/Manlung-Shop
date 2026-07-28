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
function initLogin() {
  const form = document.getElementById("loginForm");
  const input = document.getElementById("adminPasswordInput");
  const err = document.getElementById("loginError");

  let alreadyIn = false;
  try { alreadyIn = sessionStorage.getItem("manlungAdminLoggedIn") === "true"; } catch (e) { /* storage blocked, ignore */ }
  if (alreadyIn) { showDashboard(); return; }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const entered = input.value.trim();
      const expected = (window.SITE_CONFIG && window.SITE_CONFIG.ADMIN_PASSWORD) || "@Adictmanlung15073221";
      if (entered === expected) {
        try { sessionStorage.setItem("manlungAdminLoggedIn", "true"); } catch (e) { /* storage blocked, ignore */ }
        showDashboard();
      } else {
        err.textContent = "Incorrect password";
        input.value = "";
      }
    } catch (ex) {
      err.textContent = "Login error — " + ex.message;
      console.error("Admin login error:", ex);
    }
  });
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  renderAllTabs();

  const badge = document.getElementById("cloudStatusBadge");
  if (window.dataStore.isCloudConnected()) {
    badge.textContent = "🟢 Cloud synced — visible to all visitors";
    badge.style.background = "rgba(16,185,129,0.12)";
    badge.style.color = "#0d8f5f";
  } else {
    badge.textContent = "🟡 This device only — set up Firebase in config.js to go live for everyone";
    badge.style.background = "rgba(230,160,20,0.12)";
    badge.style.color = "#a86a00";
  }
}

function logout() {
  sessionStorage.removeItem("manlungAdminLoggedIn");
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
  renderCategory("digitalProducts", "digital", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "downloadUrl"]);
  renderCategory("cdProducts", "cds", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "audioUrl", "tracks"]);
  renderCategory("merchItems", "merch", ["title", "price", "unit", "description", "features", "colors", "sizes", "comingSoon", "soldOut", "imgUrl"]);
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
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newPass = document.getElementById("newPasswordInput").value.trim();
    if (newPass.length < 6) {
      toast("Password should be at least 6 characters");
      return;
    }
    document.getElementById("newHashOutput").value = newPass;
    document.getElementById("newHashBox").style.display = "block";
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

  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  document.getElementById("saveDigitalBtn").addEventListener("click", () =>
    saveCategory("digitalProducts", "digital", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "downloadUrl"]));
  document.getElementById("saveCdsBtn").addEventListener("click", () =>
    saveCategory("cdProducts", "cds", ["title", "price", "unit", "description", "features", "stock", "featured", "soldOut", "imgUrl", "audioUrl", "tracks"]));
  document.getElementById("saveMerchBtn").addEventListener("click", () =>
    saveCategory("merchItems", "merch", ["title", "price", "unit", "description", "features", "colors", "sizes", "comingSoon", "soldOut", "imgUrl"]));

  document.getElementById("addDigitalBtn").addEventListener("click", () =>
    addItem("digitalProducts", { title: "New Track", price: 199, unit: "per track", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", featured: false, stock: 999, soldOut: false, downloadUrl: "" }));
  document.getElementById("addCdBtn").addEventListener("click", () =>
    addItem("cdProducts", { title: "New CD", price: 1499, unit: "per CD", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW+CD", audioUrl: "", tracks: [], featured: false, stock: 50, soldOut: false }));
  document.getElementById("addMerchBtn").addEventListener("click", () =>
    addItem("merchItems", { title: "New Merch Item", price: 2999, unit: "per item", description: "", features: [], imgUrl: "https://placehold.co/600x600/eef1f8/0b2a6b?text=NEW", comingSoon: false, soldOut: false, colors: [], sizes: [] }));

  document.getElementById("exportBtn").addEventListener("click", exportProductsFile);
  document.getElementById("resetBtn").addEventListener("click", resetAllData);
  document.getElementById("logoutBtn").addEventListener("click", logout);
});
