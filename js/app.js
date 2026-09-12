// Main Application Initialization

function initScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => { btn.style.display = window.scrollY > 400 ? "flex" : "none"; });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initSearchAndFilters() {
  const musicSearch = document.getElementById("musicSearch");
  musicSearch?.addEventListener("input", () => {
    const q = musicSearch.value.trim().toLowerCase();
    document.querySelectorAll("#digitalGrid .product-card").forEach(card => { card.style.display = card.dataset.title.includes(q) ? "" : "none"; });
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
      tab.classList.add("active"); activeCategory = tab.dataset.cat; applyMerchFilters();
    });
  });
}

function showWelcomeMessage() {
  if (sessionStorage.getItem("manlungWelcomeShown")) return;
  sessionStorage.setItem("manlungWelcomeShown", "true");
  setTimeout(() => { window.cartFunctions?.showToast("Welcome to the official Manlung Shop."); }, 600);
}

function initEmailSubscription() {
  const subscribeBtn = document.getElementById("subscribeEmailBtn");
  if (!subscribeBtn) return;
  subscribeBtn.addEventListener("click", () => {
    const email = document.getElementById("captureEmail").value;
    if (email.includes("@") && email.includes(".")) { window.cartFunctions.showToast("Subscribed!"); document.getElementById("captureEmail").value = ""; }
    else window.cartFunctions.showToast("Enter valid email");
  });
}

function initTourNotify() {
  const btn = document.getElementById("tourNotifyBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const input = document.getElementById("tourNotifyEmail"); const email = input.value;
    if (email.includes("@") && email.includes(".")) { window.cartFunctions.showToast("You'll be notified when a show is announced!"); input.value = ""; }
    else window.cartFunctions.showToast("Enter a valid email");
  });
}

function initStorefrontRefresh() {
  if (!document.getElementById("storefrontFixStyles")) {
    const link = document.createElement("link");
    link.id = "storefrontFixStyles";
    link.rel = "stylesheet";
    link.href = "css/storefront-fixes.css?v=20260912";
    document.head.appendChild(link);
  }

  document.title = "Manlung Shop | Adict Manlung — The Flock Storyteller";
  document.querySelector('meta[name="description"]')?.setAttribute("content", "Official Manlung Shop — music, CDs, The Flock culture and limited merchandise from Adict Manlung.");
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Manlung Shop | Adict Manlung — The Flock Storyteller");
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", "Official music, CDs, merchandise and live updates from independent Kenyan artist Adict Manlung.");
  document.querySelector('meta[property="og:image"]')?.setAttribute("content", "https://res.cloudinary.com/dxtpph9o9/image/upload/_DSC1701.JPG_ctscwb.jpg");
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Manlung Shop | Adict Manlung — The Flock Storyteller");
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", "Official music, CDs, merchandise and live updates from independent Kenyan artist Adict Manlung.");
  document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", "https://res.cloudinary.com/dxtpph9o9/image/upload/_DSC1701.JPG_ctscwb.jpg");

  const marqueeSpans = document.querySelectorAll(".top-marquee-track span");
  marqueeSpans.forEach(span => { span.textContent = "THE FLOCK STORYTELLER  ✦  NEW MUSIC  ✦  LIMITED DROPS  ✦  CDS  ✦  LIVE UPDATES  ✦  ADICT MANLUNG  ✦  "; });

  const heroTag = document.querySelector(".drip-influencer-tag");
  if (heroTag) heroTag.textContent = "THE FLOCK STORYTELLER · INDEPENDENT KENYAN HIP-HOP";
  const heroBio = document.querySelector(".bio-text p");
  if (heroBio) heroBio.textContent = "Street-rooted storytelling from Adict Manlung — music, culture and merchandise built independently from Kenya, with the next chapter Running already in progress.";

  const blogMeta = document.querySelector(".blog-meta");
  const blogTitle = document.querySelector(".blog-title");
  const blogExcerpts = document.querySelectorAll(".blog-excerpt");
  if (blogMeta) blogMeta.textContent = "MUSIC JOURNEY · THE FLOCK STORYTELLER";
  if (blogTitle) blogTitle.textContent = "From the notebooks to Running: the story behind Adict Manlung";
  if (blogExcerpts[0]) blogExcerpts[0].textContent = "The music began around 2018, when lyrics were finding their way into the same exercise books being used for school. After school, many early recordings stayed unreleased while the artist kept learning, writing and finding ways to fund the next session.";
  if (blogExcerpts[1]) blogExcerpts[1].textContent = "In 2022, My Gee became the first official release and opened a public chapter for Adict Manlung. The catalogue grew through independent releases shaped by friendship, ambition, setbacks, survival and everyday life.";
  if (blogExcerpts[2]) blogExcerpts[2].textContent = "A first Nairobi chapter followed in 2024 through the Jenga Talent Awards nomination and win. Later Nairobi work brought another difficult period involving detention and court proceedings, followed by a return to Eldoret and a full rebuild.";
  if (blogExcerpts[3]) blogExcerpts[3].textContent = "Now the focus is Running — a new project being built from Eldoret. Cold (Adict Manlung x Trecky) remains part of the recent catalogue, while The Flock continues to grow around the music and independent vision.";

  const sponsoredTitle = document.querySelector(".sponsored-section .section-title");
  if (sponsoredTitle) sponsoredTitle.textContent = "Featured Releases & Drops";
  const merchHeroTitle = document.querySelector(".merch-hero h1");
  const merchHeroCopy = document.querySelector(".merch-hero p");
  if (merchHeroTitle) merchHeroTitle.textContent = "The Flock / Merch";
  if (merchHeroCopy) merchHeroCopy.textContent = "Limited pieces from the Manlung world — street-rooted, independent and released as the movement grows.";

  const tourFeatures = document.querySelectorAll(".tour-features .feature-item");
  if (tourFeatures[0]) { const h = tourFeatures[0].querySelector("h4"); const p = tourFeatures[0].querySelector("p"); if (h) h.textContent = "Digital Ticket"; if (p) p.textContent = "Generated after successful payment"; }
  if (tourFeatures[1]) { const h = tourFeatures[1].querySelector("h4"); const p = tourFeatures[1].querySelector("p"); if (h) h.textContent = "Live Updates"; if (p) p.textContent = "Get notified when new shows are announced"; }
  if (tourFeatures[2]) { const h = tourFeatures[2].querySelector("h4"); const p = tourFeatures[2].querySelector("p"); if (h) h.textContent = "Secure Checkout"; if (p) p.textContent = "Powered by the existing Paystack flow"; }

  installSponsoredRailFix();
}

function installSponsoredRailFix() {
  if (!window.renderFunctions || window.renderFunctions.__manlungSponsoredFixed) return;
  window.renderFunctions.__manlungSponsoredFixed = true;

  window.renderFunctions.renderSponsored = function() {
    const grid = document.getElementById("sponsoredGrid");
    if (!grid || !window.productData) return;

    const all = [
      ...(window.productData.digitalProducts || []).map(p => ({ ...p, _type: "DIGITAL" })),
      ...(window.productData.cdProducts || []).map(p => ({ ...p, _type: "CD" })),
      ...(window.productData.merchItems || []).filter(m => !m.comingSoon).map(p => ({ ...p, _type: "MERCH" }))
    ];

    const seen = new Set();
    const picks = all.filter(p => {
      if (!(p.featured || p.sponsored)) return false;
      const key = `${p._type}:${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    const section = grid.closest(".sponsored-section");
    if (!picks.length) { if (section) section.style.display = "none"; return; }
    if (section) section.style.display = "block";

    grid.innerHTML = `<div class="sponsored-track">${picks.map((p, idx) => `
      <div class="sponsored-card" data-idx="${idx}">
        <div class="sponsored-tag ${p.sponsored ? "" : "featured-tag-alt"}">${p.sponsored ? "SPONSORED" : "FEATURED"}</div>
        <div class="sponsored-img"><img src="${p.imgUrl || (Array.isArray(p.images) ? p.images[0] : "")}" loading="lazy" alt="${p.title}"></div>
        <div class="sponsored-info"><div class="sponsored-type">${p._type}</div><div class="sponsored-title">${p.title}</div><div class="sponsored-price">${window.currencyFunctions.formatPrice(p.price)}</div></div>
      </div>`).join("")}</div>`;

    grid.querySelectorAll(".sponsored-card").forEach(card => {
      card.addEventListener("click", () => {
        const p = picks[Number(card.dataset.idx)];
        const nav = p._type === "DIGITAL" ? "music" : p._type === "CD" ? "cds" : "merch";
        document.querySelector(`[data-nav="${nav}"]`)?.click();
      });
    });
  };
}

function initMusicStoryline() {
  const home = document.getElementById("home-section");
  if (!home || document.getElementById("music-story-section")) return;

  const aboutText = home.querySelector(".about-text");
  if (aboutText) {
    const paragraphs = aboutText.querySelectorAll(":scope > p");
    if (paragraphs[0]) paragraphs[0].textContent = "Adict Manlung's music story began around 2018, while he was still in school. Music was already taking over his notebooks: lyrics were being written in the same exercise books he used for his school subjects. His school performance suffered, and that creative obsession became part of a difficult chapter that eventually saw him leave school for about a year before returning and completing Form Four.";
    if (paragraphs[1]) paragraphs[1].textContent = "After school, he kept writing and recording whenever he could. Many early tracks were never released, but those sessions built the voice behind the artist. In 2022, My Gee became his first official release, opening the door to a catalogue shaped by real experiences, struggle, ambition, friendship, setbacks and survival.";
    if (paragraphs[2]) paragraphs[2].textContent = "The journey continued through Nairobi and Eldoret, independent releases and constant hustling to fund the next song. In 2025–2026, another difficult Nairobi chapter interrupted that momentum and brought serious personal and financial pressure. After a period of detention and court proceedings, he returned to Eldoret and kept rebuilding. The music did not stop.";
  }

  const profileValues = home.querySelectorAll(".profile-info-value");
  if (profileValues[0]) profileValues[0].textContent = "Eldoret, Kenya · Nairobi chapters";
  if (profileValues[1]) profileValues[1].textContent = "Kenyan Rapper · Storyteller · Entrepreneur · Independent Artist";
  if (profileValues[2]) profileValues[2].textContent = "Kenya · East Africa · Diaspora";

  const stats = home.querySelectorAll(".stats-row .stat-item");
  if (stats[0]) stats[0].innerHTML = '<div class="stat-icon-circle">2018</div><div class="stat-number">Started</div><div class="stat-label">Writing & recording</div>';
  if (stats[1]) stats[1].innerHTML = '<div class="stat-icon-circle">2022</div><div class="stat-number">My Gee</div><div class="stat-label">First official release</div>';
  if (stats[2]) stats[2].innerHTML = '<div class="stat-icon-circle">2024</div><div class="stat-number">Jenga</div><div class="stat-label">Talent Awards chapter</div>';
  if (stats[3]) stats[3].innerHTML = '<div class="stat-icon-circle">2026+</div><div class="stat-number">Running</div><div class="stat-label">New project in progress</div>';

  const section = document.createElement("section");
  section.id = "music-story-section";
  section.className = "music-story-section";
  section.innerHTML = `
    <div class="section-title">Music Story &amp; Journey</div>
    <div class="story-intro">
      <span class="story-eyebrow">FROM THE NOTEBOOKS TO THE NEXT CHAPTER</span>
      <h2>The music kept moving, even when life did not.</h2>
      <p>Adict Manlung's journey is not a straight line. It is a record of school days, unreleased songs, first releases, Nairobi dreams, setbacks, survival and the decision to keep creating.</p>
    </div>
    <div class="music-timeline">
      <article class="story-chapter"><span>01</span><div><small>2018 · THE NOTEBOOKS</small><h3>Before the name became a movement</h3><p>Lyrics started appearing everywhere — including the exercise books meant for school subjects. Music became an obsession early, even during a period when school was not going well. After being expelled for about a year, he returned and finished Form Four.</p></div></article>
      <article class="story-chapter"><span>02</span><div><small>2019–2021 · THE UNRELEASED YEARS</small><h3>Recording without a spotlight</h3><p>He kept finding ways to write and record. Several tracks were made but never officially released. Those years were about learning, struggling for resources and building the confidence to finally put music out.</p></div></article>
      <article class="story-chapter"><span>03</span><div><small>2022 · MY GEE</small><h3>The first official release</h3><p>My Gee became the first official release and marked the beginning of a public catalogue. More songs followed as Adict Manlung developed his sound and identity as an independent Kenyan storyteller.</p></div></article>
      <article class="story-chapter"><span>04</span><div><small>2024 · NAIROBI &amp; JENGA TALENT AWARDS</small><h3>A first major Nairobi chapter</h3><p>His first Nairobi trip brought a nomination at the Jenga Talent Awards. After getting lost on the way, he was helped to the venue by two people he met in the city. He won the award, but says he never received the physical award — another lesson in the realities behind the spotlight.</p></div></article>
      <article class="story-chapter"><span>05</span><div><small>2025–2026 · THE HARD RESET</small><h3>Work, legal proceedings and starting again</h3><p>A connection brought him back to Nairobi for work. A later arrest and court process became a major interruption, followed by about three months in custody and release on bail. Losing work and stability forced him to sell belongings and eventually return to Eldoret. He kept the music alive through the setback.</p></div></article>
      <article class="story-chapter"><span>06</span><div><small>NOW · RUNNING</small><h3>The next project is being built</h3><p>Adict Manlung is currently developing <strong>Running</strong>, a new project that carries the story forward. The catalogue continues to grow, with <strong>Cold (Adict Manlung x Trecky)</strong> among the more recent releases, while the next chapter is being shaped from Eldoret.</p></div></article>
    </div>
    <div class="flock-history-card">
      <div><span class="story-eyebrow">THE BRAND</span><h3>From Universion Flock to The Flock</h3></div>
      <p>The movement has evolved with the artist. What was previously known as <strong>Universion Flock</strong> grew into <strong>The Flock</strong> — the wider identity around the music, culture, people and independent Manlung vision.</p>
    </div>`;

  const blog = home.querySelector(".blog-section");
  if (blog) blog.before(section);
}

function initNavigation() {
  const sections = { home: document.getElementById("home-section"), music: document.getElementById("music-section"), cds: document.getElementById("cds-section"), merch: document.getElementById("merch-section"), tour: document.getElementById("tour-section"), contact: document.getElementById("contact-section") };
  const backBtn = document.getElementById("backToHomeBtn"); let isPopping = false;
  function showSection(s, { pushHistory = true } = {}) {
    Object.values(sections).forEach(v => { if (v) v.style.display = "none"; });
    if (sections[s]) sections[s].style.display = "block";
    if (backBtn) backBtn.style.display = (s === "home") ? "none" : "flex";
    document.querySelectorAll(".nav-links a").forEach(a => a.classList.toggle("active", a.getAttribute("data-nav") === s));
    if (pushHistory && !isPopping) { if (s === "home") history.replaceState({ manlungSection: "home" }, "", window.location.pathname); else history.pushState({ manlungSection: s }, "", window.location.pathname); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll("[data-nav]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); showSection(a.getAttribute("data-nav")); }));
  document.getElementById("shopNowBtn")?.addEventListener("click", () => showSection("music"));
  backBtn?.addEventListener("click", () => showSection("home"));
  window.addEventListener("popstate", e => { isPopping = true; showSection(e.state?.manlungSection || "home", { pushHistory: false }); isPopping = false; });
  history.replaceState({ manlungSection: "home" }, "", window.location.pathname); showSection("home", { pushHistory: false });
}

function initCartSidebar() {
  const cartSidebar = document.getElementById("cartSidebar"); if (!cartSidebar) return;
  document.getElementById("cartIconBtn")?.addEventListener("click", () => cartSidebar.classList.add("open"));
  document.getElementById("closeCartBtn")?.addEventListener("click", () => cartSidebar.classList.remove("open"));
  document.getElementById("checkoutBtn")?.addEventListener("click", window.cartFunctions.processCheckout);
}

function initApp() {
  console.log("Initializing Adict Manlung Store...");
  initStorefrontRefresh();
  window.cartFunctions.loadCart(); window.renderFunctions.renderProducts(); window.renderFunctions.renderMerch(); window.renderFunctions.renderSponsored(); window.renderFunctions.renderTestimonials();
  window.tourSystem.setupTourEvents(); window.tourSystem.initTourSlideshow(); window.tourSystem.initRateCardDownload(); window.tourSystem.checkPaymentReturn(); window.paystackCheckoutFunctions.checkGatewayReturn(); window.brandsCarouselFunctions.initBrandsCarousel();
  initScrollTopButton(); initSearchAndFilters(); showWelcomeMessage();
  window.currencyFunctions.populateCurrencyDropdowns(); window.currencyFunctions.initCurrencyModal(); window.currencyFunctions.initCountrySearch(); window.menuFunctions.initMenuPanel(); window.menuFunctions.initAccountSystem(); initEmailSubscription(); initTourNotify();
  initMusicStoryline(); initNavigation(); initCartSidebar(); window.currencyFunctions.initCurrencySelector(); window.currencyFunctions.detectAndApplyCurrency();
  console.log("Store initialized successfully!");
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
