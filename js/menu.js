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
  if (!data) {
    window.appErrors.report("menu:policy", new Error(`No policy content defined for "${key}"`));
    return;
  }
  const title = window.appErrors.requireElement("policyModalTitle", "menu:policy");
  const body = window.appErrors.requireElement("policyModalBody", "menu:policy");
  const modal = window.appErrors.requireElement("policyModal", "menu:policy");
  if (!title || !body || !modal) return;

  title.textContent = data.title;
  body.innerHTML = data.body;
  modal.classList.add("open");
}

function initMenuPanel() {
  const overlay = document.getElementById("menuOverlay");
  const openBtn = document.getElementById("menuOpenBtn");
  const closeBtn = document.getElementById("closeMenuBtn");
  if (!overlay || !openBtn) return;

  openBtn.addEventListener("click", () => overlay.classList.add("open"));
  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  else window.appErrors.report("menu:panel", new Error("Expected element #closeMenuBtn in the page"));

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
    const input = window.appErrors.requireElement("menuNewsletterEmail", "menu:newsletter");
    if (!input) {
      window.cartFunctions.showToast("Newsletter signup is unavailable right now");
      return;
    }
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
  const loggedOut = window.appErrors.requireElement("accountLoggedOut", "menu:account");
  const loggedIn = window.appErrors.requireElement("accountLoggedIn", "menu:account");
  const emailDisplay = window.appErrors.requireElement("accountEmailDisplay", "menu:account");
  if (loggedOut) loggedOut.style.display = "none";
  if (loggedIn) loggedIn.style.display = "block";
  if (emailDisplay) emailDisplay.textContent = email;
}

function showAccountLoggedOut() {
  const loggedOut = window.appErrors.requireElement("accountLoggedOut", "menu:account");
  const loggedIn = window.appErrors.requireElement("accountLoggedIn", "menu:account");
  if (loggedOut) loggedOut.style.display = "block";
  if (loggedIn) loggedIn.style.display = "none";
}

// ---- Local fallback account store (this browser only) ----
const LOCAL_ACCOUNTS_KEY = "manlungAccounts";
const LOCAL_SESSION_KEY = "manlungLoggedInEmail";

function getLocalAccounts() {
  const accounts = window.appErrors.local.getJson(LOCAL_ACCOUNTS_KEY, {});
  return accounts && typeof accounts === "object" ? accounts : {};
}
function saveLocalAccounts(accounts) {
  return window.appErrors.local.setJson(LOCAL_ACCOUNTS_KEY, accounts);
}

function initLocalAccountSystem(loginBtn, createBtn, logoutBtn, errorBox) {
  const existingSession = window.appErrors.session.get(LOCAL_SESSION_KEY);
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
    window.appErrors.session.set(LOCAL_SESSION_KEY, email);
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
    // Without storage there is no account to log back into, so don't claim one
    // was created.
    if (!saveLocalAccounts(accounts)) {
      errorBox.textContent = "Couldn't save your account — your browser is blocking storage (private mode?)";
      return;
    }
    window.appErrors.session.set(LOCAL_SESSION_KEY, email);
    showAccountLoggedIn(email);
    window.cartFunctions.showToast("Account created!");
  });

  logoutBtn.addEventListener("click", () => {
    window.appErrors.session.remove(LOCAL_SESSION_KEY);
    showAccountLoggedOut();
    window.cartFunctions.showToast("Logged out");
  });
}

function initAccountSystem() {
  const loginBtn = document.getElementById("accountLoginBtn");
  if (!loginBtn) return;

  const createBtn = window.appErrors.requireElement("accountCreateBtn", "menu:account");
  const logoutBtn = window.appErrors.requireElement("accountLogoutBtn", "menu:account");
  const errorBox = window.appErrors.requireElement("accountError", "menu:account");
  if (!createBtn || !logoutBtn || !errorBox) return;

  if (!supabaseAuthConfigured()) {
    // Works right away on this device/browser. Set up Supabase in js/config.js
    // later to make accounts recognized across every device instead.
    initLocalAccountSystem(loginBtn, createBtn, logoutBtn, errorBox);
    return;
  }

  const sb = window.dataStore.getClient();

  sb.auth.getSession()
    .then(({ data: { session } }) => {
      if (session?.user) showAccountLoggedIn(session.user.email);
      else showAccountLoggedOut();
    })
    .catch(e => {
      window.appErrors.report("menu:get-session", e);
      showAccountLoggedOut();
    });
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showAccountLoggedIn(session.user.email);
    else showAccountLoggedOut();
  });

  loginBtn.addEventListener("click", async () => {
    errorBox.textContent = "";
    const email = document.getElementById("accountEmail").value;
    const password = document.getElementById("accountPassword").value;
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.cartFunctions.showToast("Logged in!");
    } catch (e) {
      window.appErrors.report("menu:sign-in", e);
      errorBox.textContent = e.message || "Couldn't sign in — please try again";
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
    try {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      window.cartFunctions.showToast("Account created! Check your email to confirm, then log in.");
    } catch (e) {
      window.appErrors.report("menu:sign-up", e);
      errorBox.textContent = e.message || "Couldn't create the account — please try again";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      window.cartFunctions.showToast("Logged out");
    } catch (e) {
      // Still signed in server-side — saying "Logged out" here would be a lie.
      window.appErrors.report("menu:sign-out", e, "Couldn't log you out — please try again");
    }
  });
}

window.menuFunctions = { initMenuPanel, initAccountSystem };
