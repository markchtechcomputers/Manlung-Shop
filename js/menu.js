// ============================================================
// Menu Panel: newsletter, policy pages, account login/signup
// ============================================================

const POLICY_CONTENT = {
  shipping: {
    title: "Shipping Info",
    body: `
      <p>We aim to deliver every order safely, efficiently, and with clear communication from checkout through arrival.</p>
      <p>Physical orders, including CDs and merchandise, are shipped using <strong>DHL</strong> and trusted local courier partners where available. Delivery times vary by destination, order size, and local carrier capacity, and we always strive to provide the most accurate estimate possible at the time of purchase.</p>
      <p>If you need a quote for your area or want to confirm the most suitable shipping option for your location, please contact us at <a href="mailto:adictmanlung@gmail.com">adictmanlung@gmail.com</a>. We are happy to assist with special requests and regional delivery arrangements.</p>
    `
  },
  sizechart: {
    title: "Size Chart",
    body: `
      <p>Our merchandise is sized using standard adult apparel measurements, but minor variations can occur depending on the cut, fabric, and production batch.</p>
      <p>For the most accurate fit, we recommend comparing your measurements to the product details provided on the listing and considering whether you prefer a relaxed or fitted style. If you are unsure between sizes, reach out to us and we will gladly help you choose the best option.</p>
    `
  },
  productcare: {
    title: "Product Care",
    body: `
      <p>Proper care helps preserve the appearance, feel, and longevity of your purchase.</p>
      <p>For apparel, we recommend washing garments inside out in cold water and avoiding harsh bleach or high heat. For CDs and other physical media, keep items stored in a cool, dry place away from direct sunlight, moisture, and excessive handling.</p>
      <p>Following these simple steps will help make sure your order remains in excellent condition for as long as possible.</p>
    `
  },
  returns: {
    title: "Returns",
    body: `
      <p>We want every customer to feel confident in their purchase, and we take product issues seriously.</p>
      <p>If your item arrives damaged, incorrect, or significantly different from the description, please contact us as soon as possible with your order details and clear photos of the item and packaging. We will review the case promptly and work toward a fair resolution.</p>
      <p>To kick off a return request, fill in the form below and we will open a WhatsApp message with your details ready to send.</p>
      <form id="returnRequestForm" class="return-request-form">
        <label>Full name
          <input type="text" name="customerName" placeholder="Your full name" required>
        </label>
        <label>County / region
          <input type="text" name="county" placeholder="e.g. Nairobi" required>
        </label>
        <label>Product name
          <input type="text" name="productName" placeholder="What are you returning?" required>
        </label>
        <label>Product batch / code
          <input type="text" name="productBatch" placeholder="Batch number or code if available">
        </label>
        <button type="submit">Send return request via WhatsApp</button>
      </form>
      <p class="return-note">Returns are assessed on a case-by-case basis, and our team will confirm the next steps after reviewing the request.</p>
    `
  },
  privacy: {
    title: "Privacy Policy",
    body: `
      <p>Manlung Shop collects only the information needed to process orders, communicate with customers, and improve the shopping experience. This may include your name, email address, phone number, delivery address, and order details.</p>
      <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. Payments are processed securely through Paystack, and we do not store card or mobile money details on our website.</p>
      <p>We may use your contact details to send order updates, delivery information, and service-related messages. If you ever wish to update or remove your information, please contact us directly.</p>
    `
  },
  terms: {
    title: "Terms of Service",
    body: `
      <p><strong>1. Acceptance of Terms</strong><br>By accessing or purchasing from Manlung Shop, you agree to be bound by these Terms of Service. If you do not agree, please do not use this site.</p>
      <p><strong>2. Products & Pricing</strong><br>All prices are listed in Kenyan Shillings (KSh) unless converted for display in your local currency at checkout. We reserve the right to correct pricing errors, change prices, or discontinue products at any time without prior notice.</p>
      <p><strong>3. Orders & Payment</strong><br>All payments are processed securely through Paystack. By placing an order, you confirm that the payment details provided are accurate and that you are authorized to use the payment method. We reserve the right to refuse or cancel any order suspected of fraud or unauthorized activity.</p>
      <p><strong>4. Digital Products</strong><br>All digital singles and CD track downloads are licensed for personal, non-commercial use only. Redistribution, resale, or public performance without permission is prohibited. Due to the nature of digital goods, all digital sales are final once the download has started, and refunds will not be issued except in cases of a verified technical error on our part.</p>
      <p><strong>5. Physical Products & Shipping</strong><br>CDs and merchandise are shipped based on the delivery details you provide at checkout. You are responsible for ensuring this information is accurate. We are not liable for delays caused by couriers, customs, or incorrect address information. Please refer to our Shipping Info and Returns sections for additional details.</p>
      <p><strong>6. Intellectual Property</strong><br>All music, artwork, branding, and content on this site are the property of Adict Manlung and may not be copied, reproduced, or used without written permission.</p>
      <p><strong>7. User Accounts</strong><br>If you create an account, you are responsible for maintaining the confidentiality of your login details and for all activity under your account.</p>
      <p><strong>8. Limitation of Liability</strong><br>Manlung Shop is not liable for any indirect, incidental, or consequential damages arising from the use of this site or its products, to the fullest extent permitted by law.</p>
      <p><strong>9. Changes to These Terms</strong><br>We may update these Terms of Service at any time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.</p>
      <p><strong>10. Contact</strong><br>Questions about these terms can be sent to <a href="mailto:adictmanlung@gmail.com">adictmanlung@gmail.com</a>.</p>
    `
  },
  trackorder: {
    title: "Track My Order",
    body: `
      <p>Once your payment is confirmed, every order follows a simple processing journey so you always know what to expect.</p>
      <ol class="tracking-process">
        <li><strong>Order review:</strong> We confirm your purchase details, available stock, and any special delivery notes before packing begins.</li>
        <li><strong>Dispatch window:</strong> All physical products are packed and dispatched within <strong>2 to 4 working days</strong> depending on stock availability, order volume, and packaging time.</li>
        <li><strong>Delivery in Nairobi:</strong> Orders within Nairobi are typically delivered within <strong>1 day</strong> after dispatch.</li>
        <li><strong>Delivery outside Nairobi:</strong> Orders outside Nairobi usually arrive within <strong>2 days</strong> after dispatch, depending on the courier route.</li>
      </ol>
      <p>If you need a quick status check, contact us with your order reference and we will help you track it directly.</p>
    `
  },
  giftcard: {
    title: "Gift Card",
    body: `
      <p>Gift cards are part of our longer-term plans and will be introduced as a convenient way to share music, merchandise, and future Manlung Shop experiences with friends and supporters.</p>
      <p>We are currently focused on improving the core shopping experience, but we will share updates as soon as gift cards become available.</p>
    `
  }
};

function attachPolicyModalHandlers() {
  const form = document.getElementById("returnRequestForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const customerName = (data.get("customerName") || "").toString().trim();
    const county = (data.get("county") || "").toString().trim();
    const productName = (data.get("productName") || "").toString().trim();
    const productBatch = (data.get("productBatch") || "").toString().trim();
    const message = [
      "Hello, I would like to start a return request for Manlung Shop.",
      customerName ? `Customer name: ${customerName}` : null,
      county ? `County/region: ${county}` : null,
      productName ? `Product: ${productName}` : null,
      productBatch ? `Batch/code: ${productBatch}` : null,
      "Please help me with the next steps."
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/254724356178?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    window.cartFunctions?.showToast("Opening WhatsApp with your return request...");
  });
}

function openPolicyModal(key) {
  const data = POLICY_CONTENT[key];
  if (!data) return;
  document.getElementById("policyModalTitle").textContent = data.title;
  document.getElementById("policyModalBody").innerHTML = data.body;
  attachPolicyModalHandlers();
  document.getElementById("policyModal").classList.add("open");
}

function initMenuPanel() {
  const overlay = document.getElementById("menuOverlay");
  const openBtn = document.getElementById("menuOpenBtn");
  const closeBtn = document.getElementById("closeMenuBtn");
  if (!overlay || !openBtn) return;

  openBtn.addEventListener("click", () => overlay.classList.add("open"));
  closeBtn.addEventListener("click", () => overlay.classList.remove("open"));

  // Policy + Contact links inside the menu
  document.querySelectorAll("[data-policy]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.remove("open");
      openPolicyModal(el.dataset.policy);
    });
  });

  const contactLink = document.getElementById("menuContactLink");
  if (contactLink) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.classList.remove("open");
      document.querySelector('[data-nav="contact"]')?.click();
    });
  }

  // Policy modal close
  document.getElementById("policyModalClose")?.addEventListener("click", () => {
    document.getElementById("policyModal").classList.remove("open");
  });

  // Newsletter (menu version)
  document.getElementById("menuNewsletterBtn")?.addEventListener("click", () => {
    const input = document.getElementById("menuNewsletterEmail");
    if (input.value.includes("@") && input.value.includes(".")) {
      window.cartFunctions.showToast("Subscribed!");
      input.value = "";
    } else {
      window.cartFunctions.showToast("Enter a valid email");
    }
  });
}

// ---------- ACCOUNT (Supabase Auth if configured, otherwise a working
// on-this-device account system so login/signup works immediately) ----------
function supabaseAuthConfigured() {
  const cfg = window.SITE_CONFIG?.SUPABASE_CONFIG;
  return !!(cfg && cfg.url && !cfg.url.includes("REPLACE_WITH") && window.dataStore?.getClient?.());
}

function showAccountLoggedIn(email) {
  document.getElementById("accountLoggedOut").style.display = "none";
  document.getElementById("accountLoggedIn").style.display = "block";
  document.getElementById("accountEmailDisplay").textContent = email;
}

function showAccountLoggedOut() {
  document.getElementById("accountLoggedOut").style.display = "block";
  document.getElementById("accountLoggedIn").style.display = "none";
}

// ---- Local fallback account store (this browser only) ----
const LOCAL_ACCOUNTS_KEY = "manlungAccounts";
const LOCAL_SESSION_KEY = "manlungLoggedInEmail";

function getLocalAccounts() {
  try { return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "{}"); }
  catch (e) { return {}; }
}
function saveLocalAccounts(accounts) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function initLocalAccountSystem(loginBtn, createBtn, logoutBtn, errorBox) {
  const existingSession = sessionStorage.getItem(LOCAL_SESSION_KEY);
  if (existingSession) showAccountLoggedIn(existingSession);

  loginBtn.addEventListener("click", () => {
    errorBox.textContent = "";
    const email = document.getElementById("accountEmail").value.trim().toLowerCase();
    const password = document.getElementById("accountPassword").value;
    const accounts = getLocalAccounts();

    if (!email || !password) {
      errorBox.textContent = "Enter your email and password";
      return;
    }
    if (!accounts[email]) {
      errorBox.textContent = "No account found with that email — create one below";
      return;
    }
    if (accounts[email] !== password) {
      errorBox.textContent = "Incorrect password";
      return;
    }
    sessionStorage.setItem(LOCAL_SESSION_KEY, email);
    showAccountLoggedIn(email);
    window.cartFunctions.showToast("Logged in!");
  });

  createBtn.addEventListener("click", (e) => {
    e.preventDefault();
    errorBox.textContent = "";
    const email = document.getElementById("accountEmail").value.trim().toLowerCase();
    const password = document.getElementById("accountPassword").value;

    if (!email || !email.includes("@") || !email.includes(".")) {
      errorBox.textContent = "Enter a valid email first";
      return;
    }
    if (password.length < 6) {
      errorBox.textContent = "Password should be at least 6 characters";
      return;
    }
    const accounts = getLocalAccounts();
    if (accounts[email]) {
      errorBox.textContent = "An account with that email already exists — try logging in";
      return;
    }
    accounts[email] = password;
    saveLocalAccounts(accounts);
    sessionStorage.setItem(LOCAL_SESSION_KEY, email);
    showAccountLoggedIn(email);
    window.cartFunctions.showToast("Account created!");
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
    showAccountLoggedOut();
    window.cartFunctions.showToast("Logged out");
  });
}

function initAccountSystem() {
  const loginBtn = document.getElementById("accountLoginBtn");
  const createBtn = document.getElementById("accountCreateBtn");
  const logoutBtn = document.getElementById("accountLogoutBtn");
  const errorBox = document.getElementById("accountError");
  if (!loginBtn) return;

  if (!supabaseAuthConfigured()) {
    // Works right away on this device/browser. Set up Supabase in js/config.js
    // later to make accounts recognized across every device instead.
    initLocalAccountSystem(loginBtn, createBtn, logoutBtn, errorBox);
    return;
  }

  const sb = window.dataStore.getClient();

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) showAccountLoggedIn(session.user.email);
    else showAccountLoggedOut();
  });
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showAccountLoggedIn(session.user.email);
    else showAccountLoggedOut();
  });

  loginBtn.addEventListener("click", async () => {
    errorBox.textContent = "";
    const email = document.getElementById("accountEmail").value;
    const password = document.getElementById("accountPassword").value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      errorBox.textContent = error.message;
    } else {
      window.cartFunctions.showToast("Logged in!");
    }
  });

  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    errorBox.textContent = "";
    const email = document.getElementById("accountEmail").value;
    const password = document.getElementById("accountPassword").value;
    if (!email || !password) {
      errorBox.textContent = "Enter an email and password first, then click Create Account";
      return;
    }
    const { error } = await sb.auth.signUp({ email, password });
    if (error) {
      errorBox.textContent = error.message;
    } else {
      window.cartFunctions.showToast("Account created! Check your email to confirm, then log in.");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    window.cartFunctions.showToast("Logged out");
  });
}

window.menuFunctions = { initMenuPanel, initAccountSystem };
