// ============================================================
// Menu Panel: newsletter, policy pages, account login/signup
// ============================================================

const POLICY_CONTENT = {
  shipping: {
    title: "Shipping Info",
    body: "<p>Physical orders (CDs, merch) ship via <strong>DHL</strong> as well as local courier options depending on your location. Exact rates and delivery timelines are being finalized and will be added here soon — message us on WhatsApp for a quote to your area right now.</p>"
  },
  sizechart: {
    title: "Size Chart",
    body: "<p>A full size chart for merch (hoodies, tees, caps) is coming soon. If you need help picking a size right now, reach out on WhatsApp and we'll guide you.</p>"
  },
  productcare: {
    title: "Product Care",
    body: "<p>Care instructions for merch and CDs will be posted here soon. General tip: wash apparel inside-out in cold water and keep CDs out of direct sunlight.</p>"
  },
  returns: {
    title: "Returns",
    body: "<p>Our returns policy is being finalized. If something arrives damaged or incorrect, contact us directly and we'll sort it out.</p>"
  },
  privacy: {
    title: "Privacy Policy",
    body: "<p>We collect the minimum information needed to process your order — name, email, phone, and delivery address for physical items. We never sell your information to third parties.</p><p>Payments are processed securely by Paystack; we do not store your card or mobile money details. A full, detailed privacy policy will be published here soon.</p>"
  },
  terms: {
    title: "Terms of Service",
    body: "<p>By purchasing from Manlung Shop, you agree to provide accurate information for delivery and payment. All sales of digital music are final once downloaded. Physical goods (CDs, merch) can be addressed via our Returns policy.</p><p>A full terms of service will be published here soon.</p>"
  },
  trackorder: {
    title: "Track My Order",
    body: "<p>We don't yet have automated order tracking. After a physical order (CD or merch), you'll receive a WhatsApp or email update on shipping status. For a quick check on your order, message us directly on WhatsApp.</p>"
  },
  giftcard: {
    title: "Gift Card",
    body: "<p>Gift cards aren't available yet, but they're on the roadmap! Check back soon.</p>"
  }
};

function openPolicyModal(key) {
  const data = POLICY_CONTENT[key];
  if (!data) return;
  document.getElementById("policyModalTitle").textContent = data.title;
  document.getElementById("policyModalBody").innerHTML = data.body;
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
    window.utils.handleNewsletterSubmit(document.getElementById("menuNewsletterEmail"));
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

    if (!window.utils.isValidEmail(email)) {
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
