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

function getStoredEmail() {
  return sessionStorage.getItem("manlungCustomerEmail") || "";
}

function isValidEmail(email) {
  return /^[^\s@"'<>]{1,64}@[^\s@"'<>.]+(\.[^\s@"'<>.]+)+$/.test(email);
}

function askForEmail() {
  const email = (window.prompt("Enter your email to receive your receipt:", getStoredEmail()) || "").trim();
  if (!isValidEmail(email)) {
    window.cartFunctions?.showToast("A valid email is needed to checkout");
    return null;
  }
  sessionStorage.setItem("manlungCustomerEmail", email);
  return email;
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^\+?\d{9,15}$/.test(cleaned);
}

function askForShipping() {
  const cached = JSON.parse(sessionStorage.getItem("manlungShippingInfo") || "null") || {};
  const name = window.prompt("Full name for delivery:", cached.name || "");
  if (!name) { window.cartFunctions?.showToast("A name is needed to ship your order"); return null; }

  let phone = window.prompt("Phone number (e.g. 0712345678 or +254712345678):", cached.phone || "");
  if (!phone) { window.cartFunctions?.showToast("A phone number is needed to ship your order"); return null; }
  while (!isValidPhone(phone)) {
    phone = window.prompt("That doesn't look like a valid phone number. Please re-enter (digits only, 9-15 digits, optional +):", phone);
    if (!phone) { window.cartFunctions?.showToast("A valid phone number is needed to ship your order"); return null; }
  }

  const address = window.prompt("Delivery address (town, street, landmark):", cached.address || "");
  if (!address) { window.cartFunctions?.showToast("A delivery address is needed to ship your order"); return null; }

  const info = { name, phone, address };
  sessionStorage.setItem("manlungShippingInfo", JSON.stringify(info));
  return info;
}

function triggerDownload(url, filename) {
  const safe = window.security.safeUrl(url);
  if (!safe) return;
  const a = document.createElement("a");
  a.href = safe;
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
  const valid = (items || []).filter(i => window.security.safeUrl(i.downloadUrl));
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
  const esc = window.security.escapeHtml;
  // A download URL comes from the catalog, which can be edited remotely — only
  // http(s) links are ever turned into a clickable link.
  const valid = (items || []).filter(i => window.security.safeUrl(i.downloadUrl));
  const missing = (items || []).filter(i => !window.security.safeUrl(i.downloadUrl));

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
        ${valid.map(i => `<a href="${window.security.safeUrlAttr(i.downloadUrl)}" download="${esc(i.title)}" target="_blank" rel="noopener noreferrer" class="download-panel-link">⬇ ${esc(i.title)}</a>`).join("")}
      </div>` : ""}
      ${missing.length ? `<p class="download-panel-note">${esc(missing.length)} item(s) will have their download link emailed to you shortly.</p>` : ""}
      ${isPhysical ? `<p class="download-panel-note">📦 Your order will be shipped to: <strong>${esc(shippingAddress || "the address provided")}</strong></p>` : ""}
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
function checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice }) {
  const email = askForEmail();
  if (!email) return;

  let shipping = null;
  if (needsShipping) {
    shipping = askForShipping();
    if (!shipping) return;
  }

  savePendingOrder({ downloadItems, isPhysical, shipping, ticketType, ticketPrice });

  const cartStr = items.map(i => `${i.id}:${i.quantity}`).join(",");
  const returnUrl = window.location.origin + window.location.pathname;

  const gatewayBase = window.security.safeUrl(window.SITE_CONFIG.GATEWAY_URL);
  if (!gatewayBase) {
    window.cartFunctions?.showToast("Checkout isn't set up correctly — GATEWAY_URL must be an https:// address");
    return;
  }

  const url = new URL(gatewayBase.replace(/\/$/, "") + "/");
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

  const gatewayBase = window.security.safeUrl(window.SITE_CONFIG.GATEWAY_URL);
  if (!gatewayBase) return;

  fetch(`${gatewayBase.replace(/\/$/, "")}/api/paystack/verify/${encodeURIComponent(reference)}`)
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
function checkout({ amount, items, label, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice, onSuccess, onClose }) {
  if (gatewayConfigured() && items && items.length) {
    checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice });
    return;
  }

  // ---- Fallback: in-page popup (no gateway configured yet) ----
  const email = askForEmail();
  if (!email) return;

  let shipping = null;
  if (needsShipping) {
    shipping = askForShipping();
    if (!shipping) return;
  }

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
