// Main Application Initialization

function initEmailSubscription() {
  const subscribeBtn = document.getElementById("subscribeEmailBtn");
  if (!subscribeBtn) return;
  
  subscribeBtn.addEventListener("click", () => {
    const email = document.getElementById("captureEmail").value;
    if (email.includes("@") && email.includes(".")) { 
      window.cartFunctions.showToast("✓ Subscribed! Check your email"); 
      document.getElementById("captureEmail").value = ""; 
    } else {
      window.cartFunctions.showToast("Enter valid email");
    }
  });
}

function initFeaturedButtons() {
  const preOrderBtn = document.getElementById("preOrderBtn");
  const notifyBtn = document.getElementById("notifyBtn");
  
  if (preOrderBtn) {
    preOrderBtn.addEventListener("click", () => {
      const coldSong = window.productData.digitalProducts.find(p => p.id === 5);
      if (coldSong) {
        window.cartFunctions.directCheckout(coldSong);
      }
    });
  }
  
  if (notifyBtn) {
    notifyBtn.addEventListener("click", () => {
      window.cartFunctions.showToast("🔔 You'll be notified on July 7, 2026!");
    });
  }
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
  
  function showSection(s) {
    Object.values(sections).forEach(v => { if (v) v.style.display = "none"; });
    if (sections[s]) sections[s].style.display = "block";
  }
  
  document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", (e) => showSection(e.target.getAttribute("data-nav"))));
  document.getElementById("shopNowBtn")?.addEventListener("click", () => showSection("music"));
  
  showSection("home");
}

function initCartSidebar() {
  const cartSidebar = document.getElementById("cartSidebar");
  if (!cartSidebar) return;
  
  document.getElementById("cartIconBtn")?.addEventListener("click", () => cartSidebar.classList.add("open"));
  document.getElementById("closeCartBtn")?.addEventListener("click", () => cartSidebar.classList.remove("open"));
  document.getElementById("checkoutBtn")?.addEventListener("click", window.cartFunctions.processCheckout);
}

function initApp() {
  console.log("🎵 Initializing Adict Manlung Store...");
  
  window.cartFunctions.loadCart();
  window.renderFunctions.renderProducts();
  window.renderFunctions.renderFeatured();
  window.renderFunctions.renderMerch();
  window.renderFunctions.renderTestimonials();
  window.tourSystem.setupTourEvents();
  window.tourSystem.initTourSlideshow();
  window.tourSystem.checkPaymentReturn();
  
  initEmailSubscription();
  initFeaturedButtons();
  initNavigation();
  initCartSidebar();
  
  console.log("✓ Store initialized successfully!");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}