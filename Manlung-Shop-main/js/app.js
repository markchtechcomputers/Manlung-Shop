// Main Application Initialization

function initScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.style.display = window.scrollY > 400 ? "flex" : "none";
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initSearchAndFilters() {
  const musicSearch = document.getElementById("musicSearch");
  musicSearch?.addEventListener("input", () => {
    const q = musicSearch.value.trim().toLowerCase();
    document.querySelectorAll("#digitalGrid .product-card").forEach(card => {
      card.style.display = card.dataset.title.includes(q) ? "" : "none";
    });
  });

  const merchSearch = document.getElementById("merchSearch");
  let activeCategory = "all";

  function applyMerchFilters() {
    const q = (merchSearch?.value || "").trim().toLowerCase();
    document.querySelectorAll("#merchGrid .merch-card").forEach(card => {
      const matchesSearch = card.dataset.title.includes(q);
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      card.style.display = (matchesSearch && matchesCategory) ? "" : "none";
    });
  }

  merchSearch?.addEventListener("input", applyMerchFilters);

  document.querySelectorAll(".merch-cat-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".merch-cat-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = tab.dataset.cat;
      applyMerchFilters();
    });
  });
}

function showWelcomeMessage() {
  if (sessionStorage.getItem("manlungWelcomeShown")) return;
  sessionStorage.setItem("manlungWelcomeShown", "true");
  setTimeout(() => {
    window.cartFunctions?.showToast("👋 Welcome to Manlung Shop!");
  }, 600);
}

function initEmailSubscription() {
  const subscribeBtn = document.getElementById("subscribeEmailBtn");
  if (!subscribeBtn) return;
  
  subscribeBtn.addEventListener("click", () => {
    const email = document.getElementById("captureEmail").value;
    if (email.includes("@") && email.includes(".")) { 
      window.cartFunctions.showToast("Subscribed!"); 
      document.getElementById("captureEmail").value = ""; 
    } else {
      window.cartFunctions.showToast("Enter valid email");
    }
  });
}

function initTourNotify() {
  const btn = document.getElementById("tourNotifyBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const input = document.getElementById("tourNotifyEmail");
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
  let isPopping = false;

  function showSection(s, { pushHistory = true } = {}) {
    Object.values(sections).forEach(v => { if (v) v.style.display = "none"; });
    if (sections[s]) sections[s].style.display = "block";
    if (backBtn) backBtn.style.display = (s === "home") ? "none" : "flex";

    document.querySelectorAll(".nav-links a").forEach(a => {
      a.classList.toggle("active", a.getAttribute("data-nav") === s);
    });

    if (pushHistory && !isPopping) {
      if (s === "home") {
        history.replaceState({ manlungSection: "home" }, "", window.location.pathname);
      } else {
        history.pushState({ manlungSection: s }, "", window.location.pathname);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", (e) => showSection(e.target.getAttribute("data-nav"))));
  document.getElementById("shopNowBtn")?.addEventListener("click", () => showSection("music"));
  backBtn?.addEventListener("click", () => showSection("home"));

  window.addEventListener("popstate", (e) => {
    isPopping = true;
    const target = e.state?.manlungSection || "home";
    showSection(target, { pushHistory: false });
    isPopping = false;
  });

  history.replaceState({ manlungSection: "home" }, "", window.location.pathname);

  showSection("home", { pushHistory: false });
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
  // Load product data first
  console.log("Initializing Adict Manlung Store...");
  
  // Initialize all modules
  window.cartFunctions.loadCart();
  window.renderFunctions.renderProducts();
  window.renderFunctions.renderMerch();
  window.renderFunctions.renderSponsored();
  window.renderFunctions.renderTestimonials();
  window.tourSystem.setupTourEvents();
  window.tourSystem.initTourSlideshow();
  window.tourSystem.initRateCardDownload();
  window.tourSystem.checkPaymentReturn();
  window.paystackCheckoutFunctions.checkGatewayReturn();
  window.brandsCarouselFunctions.initBrandsCarousel();
  initScrollTopButton();
  initSearchAndFilters();
  showWelcomeMessage();
  
  // Initialize core functionality
  window.currencyFunctions.populateCurrencyDropdowns();
  window.currencyFunctions.initCurrencyModal();
  window.currencyFunctions.initCountrySearch();
  window.menuFunctions.initMenuPanel();
  window.menuFunctions.initAccountSystem();
  initEmailSubscription();
  initTourNotify();
  initNavigation();
  initCartSidebar();
  window.currencyFunctions.initCurrencySelector();
  window.currencyFunctions.detectAndApplyCurrency();
  
  console.log("Store initialized successfully!");
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
