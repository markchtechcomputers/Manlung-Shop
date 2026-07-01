function initEmailSubscription() {
  const subscribeBtn = document.getElementById("subscribeEmailBtn");
  if (!subscribeBtn) return;
  
  subscribeBtn.addEventListener("click", () => {
    const email = document.getElementById("captureEmail").value;
    if (email.includes("@") && email.includes(".")) { 
      window.cartFunctions.showToast("✅ Subscribed! Check your email"); 
      document.getElementById("captureEmail").value = ""; 
    } else {
      window.cartFunctions.showToast("❌ Enter a valid email");
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
  
  function showSection(sectionName) {
    Object.values(sections).forEach(v => { if (v) v.style.display = "none"; });
    if (sections[sectionName]) sections[sectionName].style.display = "block";
    
    // Update active nav link
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    document.querySelector(`[data-nav="${sectionName}"]`).classList.add("active");
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  
  document.querySelectorAll(".nav-link").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showSection(e.target.getAttribute("data-nav"));
    });
  });
  
  document.getElementById("shopNowBtn")?.addEventListener("click", () => showSection("music"));
  
  showSection("home");
}

function initCartSidebar() {
  const cartSidebar = document.getElementById("cartSidebar");
  if (!cartSidebar) return;
  
  document.getElementById("cartIconBtn")?.addEventListener("click", () => {
    cartSidebar.classList.add("open");
  });
  
  document.getElementById("closeCartBtn")?.addEventListener("click", () => {
    cartSidebar.classList.remove("open");
  });
  
  document.getElementById("checkoutBtn")?.addEventListener("click", window.cartFunctions.processCheckout);
  
  // Close cart when clicking outside
  document.addEventListener("click", (e) => {
    if (!cartSidebar.contains(e.target) && e.target.id !== "cartIconBtn" && !e.target.closest("#cartIconBtn")) {
      cartSidebar.classList.remove("open");
    }
  });
}

function initApp() {
  console.log("🎵 Loading Adict Manlung Store...");
  
  window.cartFunctions.loadCart();
  window.renderFunctions.renderFeaturedShowcase();
  window.renderFunctions.renderProducts();
  window.renderFunctions.renderMerch();
  window.renderFunctions.renderTestimonials();
  
  initEmailSubscription();
  initNavigation();
  initCartSidebar();
  
  console.log("✅ Store loaded!");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}