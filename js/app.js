// Main Application Initialization

function initScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "flex" : "none";
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function showWelcomeMessage() {
  if (window.appErrors.session.get("manlungWelcomeShown")) return;
  window.appErrors.session.set("manlungWelcomeShown", "true");
  setTimeout(() => {
    window.cartFunctions?.showToast("👋 Welcome to Manlung Shop!");
  }, 600);
}

function initEmailSubscription() {
  const subscribeBtn = document.getElementById("subscribeEmailBtn");
  if (!subscribeBtn) return;
  
  subscribeBtn.addEventListener("click", () => {
    const input = window.appErrors.requireElement("captureEmail", "app:subscribe");
    if (!input) {
      window.cartFunctions.showToast("Newsletter signup is unavailable right now");
      return;
    }
    if (input.value.includes("@") && input.value.includes(".")) {
      window.cartFunctions.showToast("Subscribed!");
      input.value = "";
    } else {
      window.cartFunctions.showToast("Enter valid email");
    }
  });
}

function initTourNotify() {
  const btn = document.getElementById("tourNotifyBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const input = window.appErrors.requireElement("tourNotifyEmail", "app:tour-notify");
    if (!input) {
      window.cartFunctions.showToast("Tour notifications are unavailable right now");
      return;
    }
    const email = input.value;
    if (email.includes("@") && email.includes(".")) {
      window.cartFunctions.showToast("You'll be notified when a show is announced!");
      input.value = "";
    } else {
      window.cartFunctions.showToast("Enter a valid email");
    }
  });
}

function initNavigation() {
  const sections = {
    home: document.getElementById("home-section"),
    music: document.getElementById("music-section"),
    cds: document.getElementById("cds-section"),
    merch: document.getElementById("merch-section"),
    tour: document.getElementById("tour-section"),
    contact: document.getElementById("contact-section")
  };

  const backBtn = document.getElementById("backToHomeBtn");

  function showSection(s) {
    Object.values(sections).forEach(v => { if (v) v.style.display = "none"; });
    if (sections[s]) sections[s].style.display = "block";
    if (backBtn) backBtn.style.display = (s === "home") ? "none" : "flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  
  document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", (e) => showSection(e.target.getAttribute("data-nav"))));
  document.getElementById("shopNowBtn")?.addEventListener("click", () => showSection("music"));
  backBtn?.addEventListener("click", () => showSection("home"));
  
  // Show home by default
  showSection("home");
}

function initCartSidebar() {
  const cartSidebar = document.getElementById("cartSidebar");
  if (!cartSidebar) return;
  
  document.getElementById("cartIconBtn")?.addEventListener("click", () => cartSidebar.classList.add("open"));
  document.getElementById("closeCartBtn")?.addEventListener("click", () => cartSidebar.classList.remove("open"));
  document.getElementById("checkoutBtn")?.addEventListener("click", window.cartFunctions.processCheckout);
}

// Main initialization function
function initApp() {
  console.log("Initializing Adict Manlung Store...");

  // Every step is isolated: before this, one throwing module (a missing
  // element, corrupt stored data) cancelled every step after it, so the
  // storefront came up half-wired with nothing but a console trace to show it.
  const steps = [
    ["app:load-cart", () => window.cartFunctions.loadCart()],
    ["app:render-products", () => window.renderFunctions.renderProducts()],
    ["app:render-merch", () => window.renderFunctions.renderMerch()],
    ["app:render-testimonials", () => window.renderFunctions.renderTestimonials()],
    ["app:tour-events", () => window.tourSystem.setupTourEvents()],
    ["app:tour-slideshow", () => window.tourSystem.initTourSlideshow()],
    ["app:rate-card", () => window.tourSystem.initRateCardDownload()],
    ["app:tour-payment-return", () => window.tourSystem.checkPaymentReturn()],
    ["app:gateway-return", () => window.paystackCheckoutFunctions.checkGatewayReturn()],
    ["app:brands-carousel", () => window.brandsCarouselFunctions.initBrandsCarousel()],
    ["app:scroll-top", initScrollTopButton],
    ["app:welcome", showWelcomeMessage],
    ["app:currency-dropdowns", () => window.currencyFunctions.populateCurrencyDropdowns()],
    ["app:currency-modal", () => window.currencyFunctions.initCurrencyModal()],
    ["app:country-search", () => window.currencyFunctions.initCountrySearch()],
    ["app:menu-panel", () => window.menuFunctions.initMenuPanel()],
    ["app:account-system", () => window.menuFunctions.initAccountSystem()],
    ["app:email-subscription", initEmailSubscription],
    ["app:tour-notify", initTourNotify],
    ["app:navigation", initNavigation],
    ["app:cart-sidebar", initCartSidebar],
    ["app:currency-selector", () => window.currencyFunctions.initCurrencySelector()],
    ["app:currency-detect", () => window.currencyFunctions.detectAndApplyCurrency()]
  ];

  const failed = steps.filter(([context, fn]) => !window.appErrors.safeRun(context, fn));

  if (failed.length) {
    window.appErrors.notify("Some parts of the store didn't load — please refresh, or contact us on WhatsApp if it continues");
    console.error("Store initialized with failures:", failed.map(([context]) => context));
    return;
  }
  console.log("Store initialized successfully!");
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}