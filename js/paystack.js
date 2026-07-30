// ============================================================
// Paystack Checkout Integration
// ============================================================
// Two modes:
//  1. GATEWAY MODE (recommended): if SITE_CONFIG.GATEWAY_URL is set to a
//     real deployed Manlung Gateway, checkout redirects there. The gateway
//     server calculates the real price from its own trusted product
//     catalog, opens Paystack's hosted checkout, verifies the payment
//     server-side, then sends the customer back here.
//  2. POPUP MODE (fallback): if no gateway is configured, checkout opens
//     Paystack's in-page popup directly using the public key. Works, but
//     the browser is trusted to report its own total.

function gatewayConfigured() {
  const url = window.SITE_CONFIG?.GATEWAY_URL;
  return !!(url && !url.includes("REPLACE_WITH"));
}

function paystackCheckout({ amount, email, label, metadata, onSuccess, onClose }) {
  const key = window.SITE_CONFIG?.PAYSTACK_PUBLIC_KEY;

  if (!key || key.includes("REPLACE_WITH_YOUR")) {
    window.cartFunctions?.showToast("Payments aren't set up yet — add your Paystack key in js/config.js");
    return;
  }

  if (typeof PaystackPop === "undefined") {
    window.cartFunctions?.showToast("Payment system failed to load. Check your connection.");
    return;
  }

  const handler = PaystackPop.setup({
    key: key,
    email: email,
    amount: Math.round(amount * 100), // Paystack expects the amount in the smallest currency unit
    currency: window.SITE_CONFIG?.CURRENCY || "KES",
    label: label || "Adict Manlung Store",
    channels: ["card", "mobile_money", "bank_transfer"],
    metadata: metadata || {},
    callback: function (response) {
      if (typeof onSuccess === "function") onSuccess(response);
    },
    onClose: function () {
      if (typeof onClose === "function") onClose();
    }
  });

  handler.openIframe();
}

// -------- Customer details modal (email + shipping) ---------
// Replaces the old window.prompt() flow with a single well-styled,
// centered modal. Values are persisted to localStorage so returning
// visitors don't have to re-type everything.

const CUSTOMER_STORAGE_KEY = "manlungCustomerDetails";

function getStoredDetails() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || "null")
        || JSON.parse(sessionStorage.getItem(CUSTOMER_STORAGE_KEY) || "null")
        || {};
  } catch (e) { return {}; }
}
function saveStoredDetails(d) {
  try {
    const merged = { ...getStoredDetails(), ...d };
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(merged));
    sessionStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(merged));
    // Also keep the old email key for backwards compatibility.
    if (d.email) sessionStorage.setItem("manlungCustomerEmail", d.email);
  } catch (e) { /* ignore */ }
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ""); }
function isValidPhone(phone) {
  const cleaned = (phone || "").replace(/[\s\-()]/g, "");
  return /^\+?\d{9,15}$/.test(cleaned);
}

function collectCustomerDetails({ needsShipping }) {
  return new Promise((resolve) => {
    const modal = document.getElementById("checkoutDetailsModal");
    if (!modal) {
      // Fallback if markup is missing — keep the old prompt path so payments still work.
      const email = window.prompt("Enter your email to receive your receipt:", "");
      if (!email || !isValidEmail(email)) { resolve(null); return; }
      if (!needsShipping) { resolve({ email }); return; }
      const name = window.prompt("Full name for delivery:", "");
      const phone = window.prompt("Phone number:", "");
      const address = window.prompt("Delivery address:", "");
      if (!name || !phone || !address || !isValidPhone(phone)) { resolve(null); return; }
      resolve({ email, shipping: { name, phone, address } });
      return;
    }

    const form = document.getElementById("checkoutDetailsForm");
    const emailInput = document.getElementById("cdEmail");
    const nameInput = document.getElementById("cdName");
    const phoneInput = document.getElementById("cdPhone");
    const locationInput = document.getElementById("cdLocation");
    const shippingWrap = document.getElementById("cdShippingFields");
    const errEl = document.getElementById("cdError");
    const subtitle = document.getElementById("checkoutModalSubtitle");
    const closeBtn = document.getElementById("checkoutModalClose");
    const cancelBtn = document.getElementById("cdCancel");

    // Pre-fill remembered details
    const stored = getStoredDetails();
    emailInput.value = stored.email || "";
    nameInput.value = stored.name || "";
    phoneInput.value = stored.phone || "";
    locationInput.value = stored.location || stored.address || "";

    // Toggle shipping fields based on need
    shippingWrap.style.display = needsShipping ? "" : "none";
    subtitle.textContent = needsShipping
      ? "Enter your details so we can send your receipt and deliver your order."
      : "Enter your email so we can send your receipt.";

    errEl.textContent = "";
    errEl.classList.remove("show");
    modal.hidden = false;
    setTimeout(() => (emailInput.value ? nameInput : emailInput).focus?.(), 40);

    function cleanup() {
      modal.hidden = true;
      form.onsubmit = null;
      closeBtn.onclick = null;
      cancelBtn.onclick = null;
      modal.onclick = null;
    }
    function cancel() { cleanup(); resolve(null); }

    closeBtn.onclick = cancel;
    cancelBtn.onclick = cancel;
    modal.onclick = (e) => { if (e.target === modal) cancel(); };

    form.onsubmit = (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!isValidEmail(email)) {
        errEl.textContent = "Please enter a valid email address for your receipt.";
        errEl.classList.add("show");
        emailInput.focus();
        return;
      }
      let details = { email };
      if (needsShipping) {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const location = locationInput.value.trim();
        if (!name) { errEl.textContent = "Please enter your full name for delivery."; errEl.classList.add("show"); nameInput.focus(); return; }
        if (!isValidPhone(phone)) { errEl.textContent = "Please enter a valid phone number (9–15 digits, optional +)."; errEl.classList.add("show"); phoneInput.focus(); return; }
        if (!location) { errEl.textContent = "Please enter your delivery location."; errEl.classList.add("show"); locationInput.focus(); return; }
        details = { email, shipping: { name, phone, address: location } };
        saveStoredDetails({ email, name, phone, location });
      } else {
        saveStoredDetails({ email });
      }
      cleanup();
      resolve(details);
    };
  });
}


function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Browsers block rapid-fire automatic downloads (usually after ~5-6 in one go),
// so for an album's worth of tracks we stagger them AND keep a clickable panel
// on screen as a guaranteed fallback for anything the browser blocked.
function autoDownloadAll(items, onAllStarted) {
  const valid = (items || []).filter(i => i.downloadUrl);
  valid.forEach((item, idx) => {
    setTimeout(() => triggerDownload(item.downloadUrl, item.title), idx * 600);
  });
  if (valid.length) {
    setTimeout(() => onAllStarted?.(), valid.length * 600 + 400);
  } else {
    onAllStarted?.();
  }
}

function showDownloadPanel(items, isPhysical, shippingAddress) {
  const valid = (items || []).filter(i => i.downloadUrl);
  const missing = (items || []).filter(i => !i.downloadUrl);

  const existing = document.getElementById("downloadPanel");
  if (existing) existing.remove();

  const panel = document.createElement("div");
  panel.id = "downloadPanel";
  panel.className = "download-panel";
  panel.innerHTML = `
    <div class="download-panel-box">
      <button class="download-panel-close" id="downloadPanelClose">✕</button>
      <h3>✅ Payment Successful</h3>
      <p id="downloadPanelStatus">${valid.length ? "Starting your download" + (valid.length > 1 ? "s" : "") + "..." : ""}</p>
      ${valid.length ? `<div class="download-panel-list">
        ${valid.map(i => `<a href="${i.downloadUrl}" download="${i.title}" target="_blank" class="download-panel-link">⬇ ${i.title}</a>`).join("")}
      </div>` : ""}
      ${missing.length ? `<p class="download-panel-note">${missing.length} item(s) will have their download link emailed to you shortly.</p>` : ""}
      ${isPhysical ? `<p class="download-panel-note">📦 Your order will be shipped to: <strong>${shippingAddress || "the address provided"}</strong></p>` : ""}
    </div>
  `;
  document.body.appendChild(panel);
  document.getElementById("downloadPanelClose").addEventListener("click", () => panel.remove());
  return panel;
}

// Saves everything needed to resume after we come back from the gateway
// (page navigates away entirely, so we can't just keep this in memory).
function savePendingOrder({ downloadItems, isPhysical, shipping, ticketType, ticketPrice }) {
  sessionStorage.setItem("manlungPendingOrder", JSON.stringify({ downloadItems, isPhysical, shipping, ticketType, ticketPrice }));
}

function consumePendingOrder() {
  const raw = sessionStorage.getItem("manlungPendingOrder");
  sessionStorage.removeItem("manlungPendingOrder");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

// Redirects the browser to the Manlung Gateway, which handles country,
// real server-calculated pricing, Paystack's hosted checkout, and
// verification — then sends the customer back to this exact page.
async function checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice }) {
  const details = await collectCustomerDetails({ needsShipping: !!needsShipping });
  if (!details) return;
  const email = details.email;
  const shipping = details.shipping || null;

  savePendingOrder({ downloadItems, isPhysical, shipping, ticketType, ticketPrice });

  const cartStr = items.map(i => `${i.id}:${i.quantity}`).join(",");
  const returnUrl = window.location.origin + window.location.pathname;

  const url = new URL(window.SITE_CONFIG.GATEWAY_URL.replace(/\/$/, "") + "/");
  url.searchParams.set("cart", cartStr);
  url.searchParams.set("email", email);
  url.searchParams.set("return", returnUrl);
  if (shipping) {
    url.searchParams.set("shipName", shipping.name);
    url.searchParams.set("shipPhone", shipping.phone);
    url.searchParams.set("shipAddress", shipping.address);
  }
  if (ticketType) url.searchParams.set("ticketType", ticketType);

  window.location.href = url.toString();
}


// On page load, checks if we've just been sent back from the gateway after
// a successful payment (?reference=...&status=success), verifies it against
// the gateway one more time, then shows the same download/shipping panel.
function checkGatewayReturn() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference");
  const status = params.get("status");
  if (!reference) return;

  // Clean the URL so refreshing doesn't re-trigger this
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);

  if (status !== "success" || !gatewayConfigured()) {
    if (status && status !== "success") window.cartFunctions?.showToast("Payment was not completed.");
    return;
  }

  fetch(`${window.SITE_CONFIG.GATEWAY_URL.replace(/\/$/, "")}/api/paystack/verify/${encodeURIComponent(reference)}`)
    .then(r => r.json())
    .then(data => {
      if (!data.success || data.status !== "success") {
        window.cartFunctions?.showToast("Payment could not be confirmed.");
        return;
      }
      const pending = consumePendingOrder();

      if (pending?.ticketType) {
        window.tourSystem?.showDetailsPanelAutomatically(pending.ticketType, pending.ticketPrice);
        window.cartFunctions?.showToast("✅ Payment successful — generate your ticket below!");
        return;
      }

      const panel = showDownloadPanel(pending?.downloadItems, pending?.isPhysical, pending?.shipping?.address);
      autoDownloadAll(pending?.downloadItems, () => {
        const el = document.getElementById("downloadPanelStatus");
        const hasDownloads = (pending?.downloadItems || []).some(i => i.downloadUrl);
        if (el && hasDownloads) el.textContent = "✅ Download complete — check your downloads folder, or use the links below.";
      });
      // Cart is only relevant for the multi-item checkout path — clear it now that payment is confirmed.
      if (window.cartFunctions?.clearCart) window.cartFunctions.clearCart();
    })
    .catch(() => window.cartFunctions?.showToast("Couldn't confirm payment status — contact us if you were charged."));
}

// Unified checkout used everywhere: cart, buy-now, merch, tour tickets.
// Routes through the Gateway if configured, otherwise falls back to the
// in-page Paystack popup.
// - items: [{id, quantity}] — required for gateway mode
// - needsShipping: true for physical goods (CDs, merch) — collects name/phone/address
// - downloadItems: array of { title, downloadUrl } for digital items in this order
async function checkout({ amount, items, label, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice, onSuccess, onClose }) {
  if (gatewayConfigured() && items && items.length) {
    checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice });
    return;
  }

  // ---- Fallback: in-page popup (no gateway configured yet) ----
  const details = await collectCustomerDetails({ needsShipping: !!needsShipping });
  if (!details) return;
  const email = details.email;
  const shipping = details.shipping || null;

  const customFields = [...(metadata?.custom_fields || [])];
  if (shipping) {
    customFields.push(
      { display_name: "Recipient Name", variable_name: "recipient_name", value: shipping.name },
      { display_name: "Phone", variable_name: "phone", value: shipping.phone },
      { display_name: "Delivery Address", variable_name: "address", value: shipping.address }
    );
  }

  paystackCheckout({
    amount,
    email,
    label,
    metadata: { ...metadata, custom_fields: customFields },
    onSuccess: (response) => {
      const panel = showDownloadPanel(downloadItems, isPhysical, shipping?.address);
      autoDownloadAll(downloadItems, () => {
        const statusEl = document.getElementById("downloadPanelStatus");
        const hasDownloads = (downloadItems || []).some(i => i.downloadUrl);
        if (statusEl && hasDownloads) {
          statusEl.textContent = "✅ Download complete — check your downloads folder, or use the links below.";
        }
      });
      if (typeof onSuccess === "function") onSuccess(response);
    },
    onClose: () => {
      window.cartFunctions?.showToast("Checkout closed");
      if (typeof onClose === "function") onClose();
    }
  });
}

window.paystackCheckoutFunctions = {
  paystackCheckout,
  checkout,
  checkGatewayReturn
};
