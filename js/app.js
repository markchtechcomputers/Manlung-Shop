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
  // Load product data first
  console.log("Initializing Adict Manlung Store...");
  
  // Initialize all modules
  window.cartFunctions.loadCart();
  window.renderFunctions.renderProducts();
  window.renderFunctions.renderMerch();
  window.renderFunctions.renderTestimonials();
  window.tourSystem.setupTourEvents();
  window.tourSystem.initTourSlideshow();
  window.tourSystem.initRateCardDownload();
  window.tourSystem.checkPaymentReturn();
  window.paystackCheckoutFunctions.checkGatewayReturn();
  window.brandsCarouselFunctions.initBrandsCarousel();
  initScrollTopButton();
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