// UI Rendering Functions

function renderFeaturedShowcase() {
  const container = document.getElementById("featuredShowcase");
  if (!container) return;
  
  const featured = window.productData.digitalProducts.filter(p => p.featured).slice(0, 2);
  
  container.innerHTML = featured.map(p => `
    <div class="featured-item">
      <div class="featured-item-img">
        <img src="${p.imgUrl}" alt="${p.title}">
        <div class="featured-badge">🔥 HOT</div>
      </div>
      <div class="featured-item-content">
        <h3>${p.title}</h3>
        <p class="artist">Adict Manlung</p>
        <div class="featured-item-footer">
          <span class="price">$${p.price}</span>
          <button class="btn btn-small" data-id="${p.id}">Get Now</button>
        </div>
      </div>
    </div>
  `).join('');
  
  container.querySelectorAll('.btn-small').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = window.productData.digitalProducts.find(p => p.id == parseInt(btn.dataset.id));
      if (prod) window.cartFunctions.directCheckout(prod);
    });
  });
}

function renderProducts() {
  const digitalGrid = document.getElementById("digitalGrid");
  const cdGrid = document.getElementById("cdGrid");
  
  if (!digitalGrid || !cdGrid) return;
  
  digitalGrid.innerHTML = "";
  cdGrid.innerHTML = "";
  
  window.productData.digitalProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      ${p.featured ? '<div class="badge featured-badge">🔥 FEATURED</div>' : ''}
      <div class="product-img">
        <img src="${p.imgUrl}" loading="lazy" alt="${p.title}">
        <div class="product-overlay">
          <button class="btn-icon add-to-cart" data-id="${p.id}">🛒</button>
          <button class="btn-icon buy-now" data-id="${p.id}">💳</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-type">SINGLE</span>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-artist">Adict Manlung</p>
        <div class="product-footer">
          <span class="price">$${p.price}</span>
          <div class="rating">⭐⭐⭐⭐⭐</div>
        </div>
      </div>
    `;
    digitalGrid.appendChild(card);
  });
  
  window.productData.cdProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      ${p.stock < 50 ? `<div class="badge stock-badge">Only ${p.stock} left</div>` : ''}
      ${p.featured ? '<div class="badge bestseller-badge">🏆 BESTSELLER</div>' : ''}
      <div class="product-img">
        <img src="${p.imgUrl}" loading="lazy" alt="${p.title}">
        <div class="product-overlay">
          <button class="btn-icon add-to-cart" data-id="${p.id}">🛒</button>
          <button class="btn-icon buy-now" data-id="${p.id}">💳</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-type">PHYSICAL CD</span>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-artist">Adict Manlung</p>
        <div class="product-footer">
          <span class="price">$${p.price}</span>
          <div class="rating">⭐⭐⭐⭐⭐</div>
        </div>
      </div>
    `;
    cdGrid.appendChild(card);
  });
  
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
      if (prod) window.cartFunctions.addToCart(prod);
    });
  });
  
  document.querySelectorAll(".buy-now").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
      if (prod) window.cartFunctions.directCheckout(prod);
    });
  });
}

function renderMerch() {
  const grid = document.getElementById("merchGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  window.productData.merchItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "merch-card";
    
    if (item.comingSoon) {
      card.innerHTML = `
        <div class="merch-img-wrapper">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <div class="coming-soon-overlay">
            <span class="coming-soon-text">COMING SOON</span>
          </div>
        </div>
        <div class="merch-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="merch-footer">
            <span class="price">$${item.price}</span>
            <button class="btn btn-small" disabled>NOTIFY</button>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="merch-img-wrapper">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <span class="merch-badge">LIMITED</span>
        </div>
        <div class="merch-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="merch-footer">
            <span class="price">$${item.price}</span>
            <a href="${item.paymentUrl}" target="_blank" class="btn btn-small">BUY NOW</a>
          </div>
        </div>
      `;
    }
    grid.appendChild(card);
  });
}

function renderTestimonials() {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;
  
  grid.innerHTML = window.productData.testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${"⭐".repeat(t.stars)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <p class="testimonial-author">— ${t.name}</p>
    </div>
  `).join("");
}

window.renderFunctions = {
  renderFeaturedShowcase,
  renderProducts,
  renderMerch,
  renderTestimonials
};