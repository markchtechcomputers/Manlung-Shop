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
    window.cartFunctions?.showToast("Payments are temporarily unavailable. Please try again later.");
    return;
  }

  if (typeof PaystackPop === "undefined") {
    window.cartFunctions?.showToast("Payment system failed to load. Check your connection.");
    return;
  }

  const handler = PaystackPop.setup({
    key: key,
    email: email,
    amount: Math.round(amount * 100),
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
  return /^\S+@\S+\.\S+$/.test(email);
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^\+?\d{9,15}$/.test(cleaned);
}

// Opens the checkout modal and resolves with { email, shipping } once
// the customer completes it, or null if they close it.
function collectCheckoutDetails({ needsShipping }) {
  return new Promise((resolve) => {
    const modal = document.getElementById("checkoutModal");
    const emailInput = document.getElementById("coEmail");
    const shippingFields = document.getElementById("coShippingFields");
    const nameInput = document.getElementById("coName");
    const phoneInput = document.getElementById("coPhone");
    const addressInput = document.getElementById("coAddress");
    const generalNote = document.getElementById("coGeneralNote");
    const continueBtn = document.getElementById("coContinueBtn");
    const closeBtn = document.getElementById("checkoutModalClose");

    const cachedEmail = getStoredEmail();
    const cachedShipping = JSON.parse(sessionStorage.getItem("manlungShippingInfo") || "null") || {};
    
    emailInput.value = cachedEmail;
    generalNote.textContent = "";
    
    // Always show shipping fields for all customers
    shippingFields.style.display = "block";
    
    nameInput.value = cachedShipping.name || "";
    phoneInput.value = cachedShipping.phone || "";
    addressInput.value = cachedShipping.address || "";

    function finish(result) {
      modal.classList.remove("open");
      cleanup();
      resolve(result);
    }

    function cleanup() {
      continueBtn.removeEventListener("click", onContinue);
      closeBtn.removeEventListener("click", onClose);
    }

    function onContinue() {
      generalNote.textContent = "";
      
      const email = emailInput.value.trim().toLowerCase();
      if (!isValidEmail(email)) { 
        generalNote.textContent = "Enter a valid email address."; 
        return; 
      }

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const address = addressInput.value.trim();

      if (!name) { 
        generalNote.textContent = "Enter your full name."; 
        return; 
      }
      
      if (!phone || !isValidPhone(phone)) { 
        generalNote.textContent = "Enter a valid phone number."; 
        return; 
      }
      
      if (!address) { 
        generalNote.textContent = "Enter your delivery address."; 
        return; 
      }

      const shipping = { name, phone, address };
      sessionStorage.setItem("manlungShippingInfo", JSON.stringify(shipping));
      sessionStorage.setItem("manlungCustomerEmail", email);

      finish({ email, shipping });
    }

    function onClose() {
      finish(null);
    }

    continueBtn.addEventListener("click", onContinue);
    closeBtn.addEventListener("click", onClose);

    modal.classList.add("open");
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

function savePendingOrder({ downloadItems, isPhysical, shipping, ticketType, ticketPrice, ticketDownloadUrl }) {
  sessionStorage.setItem("manlungPendingOrder", JSON.stringify({ downloadItems, isPhysical, shipping, ticketType, ticketPrice, ticketDownloadUrl }));
}

function consumePendingOrder() {
  const raw = sessionStorage.getItem("manlungPendingOrder");
  sessionStorage.removeItem("manlungPendingOrder");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

async function checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice, ticketDownloadUrl }) {
  const details = await collectCheckoutDetails({ needsShipping });
  if (!details) return;
  const { email, shipping } = details;

  savePendingOrder({ downloadItems, isPhysical, shipping, ticketType, ticketPrice, ticketDownloadUrl });

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
  if (ticketDownloadUrl) url.searchParams.set("ticketDownloadUrl", ticketDownloadUrl);

  window.location.href = url.toString();
}

function checkGatewayReturn() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference");
  const status = params.get("status");
  if (!reference) return;

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
        if (pending.ticketDownloadUrl) {
          window.cartFunctions?.showToast("✅ Payment successful — downloading your ticket...");
          setTimeout(() => triggerDownload(pending.ticketDownloadUrl, `adict_${pending.ticketType.toLowerCase()}_ticket`), 500);
        } else {
          window.tourSystem?.showDetailsPanelAutomatically(pending.ticketType, pending.ticketPrice);
          window.cartFunctions?.showToast("✅ Payment successful — generate your ticket below!");
        }
        return;
      }

      const panel = showDownloadPanel(pending?.downloadItems, pending?.isPhysical, pending?.shipping?.address);
      autoDownloadAll(pending?.downloadItems, () => {
        const el = document.getElementById("downloadPanelStatus");
        const hasDownloads = (pending?.downloadItems || []).some(i => i.downloadUrl);
        if (el && hasDownloads) el.textContent = "✅ Download complete — check your downloads folder, or use the links below.";
      });
      if (window.cartFunctions?.clearCart) window.cartFunctions.clearCart();
    })
    .catch(() => window.cartFunctions?.showToast("Couldn't confirm payment status — contact us if you were charged."));
}

async function checkout({ amount, items, label, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice, ticketDownloadUrl, onSuccess, onClose }) {
  if (gatewayConfigured() && items && items.length) {
    checkoutViaGateway({ items, metadata, needsShipping, downloadItems, isPhysical, ticketType, ticketPrice, ticketDownloadUrl });
    return;
  }

  const details = await collectCheckoutDetails({ needsShipping });
  if (!details) return;
  const { email, shipping } = details;

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
      if (ticketType && ticketDownloadUrl) {
        window.cartFunctions?.showToast("✅ Payment successful — downloading your ticket...");
        setTimeout(() => triggerDownload(ticketDownloadUrl, `adict_${ticketType.toLowerCase()}_ticket`), 500);
      } else if (ticketType) {
        window.tourSystem?.showDetailsPanelAutomatically(ticketType, ticketPrice);
        window.cartFunctions?.showToast("✅ Payment successful — generate your ticket below!");
      } else {
        const panel = showDownloadPanel(downloadItems, isPhysical, shipping?.address);
        autoDownloadAll(downloadItems, () => {
          const statusEl = document.getElementById("downloadPanelStatus");
          const hasDownloads = (downloadItems || []).some(i => i.downloadUrl);
          if (statusEl && hasDownloads) {
            statusEl.textContent = "✅ Download complete — check your downloads folder, or use the links below.";
          }
        });
      }
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
  checkGatewayReturn,
  collectCheckoutDetails,
  triggerDownload
};
