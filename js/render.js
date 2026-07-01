// UI Rendering Functions
function renderProducts() {
  const digitalGrid = document.getElementById("digitalGrid");
  const cdGrid = document.getElementById("cdGrid");
  
  if (!digitalGrid || !cdGrid) return;
  
  digitalGrid.innerHTML = "";
  cdGrid.innerHTML = "";
  
  // Render digital products
  window.productData.digitalProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      ${p.featured ? '<div class="featured-badge">🔥 FEATURED</div>' : ''}
      <div class="product-img"><img src="${p.imgUrl}" loading="lazy" alt="${p.title}"></div>
      <div class="product-info">
        <div class="product-type">DIGITAL</div>
        <div class="product-title">${p.title}</div>
        <div class="product-price">$${p.price}</div>
        <button class="btn-add" data-id="${p.id}">ADD TO CART</button>
        <button class="btn-buy-now buy-now" data-id="${p.id}">BUY NOW</button>
      </div>
    `;
    digitalGrid.appendChild(card);
  });
  
  // Render CD products
  window.productData.cdProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      ${p.stock < 50 ? `<div class="stock-badge">Only ${p.stock} left</div>` : ''}
      ${p.featured ? '<div class="featured-badge">BESTSELLER</div>' : ''}
      <div class="product-img"><img src="${p.imgUrl}" loading="lazy" alt="${p.title}"></div>
      <div class="product-info">
        <div class="product-type">PHYSICAL CD</div>
        <div class="product-title">${p.title}</div>
        <div class="product-price">$${p.price}</div>
        <button class="btn-add" data-id="${p.id}">ADD TO CART</button>
        <button class="btn-buy-now buy-now" data-id="${p.id}">BUY NOW</button>
      </div>
    `;
    cdGrid.appendChild(card);
  });
  
  // Add event listeners
  document.querySelectorAll(".btn-add").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
    if (prod) window.cartFunctions.addToCart(prod);
  }));
  
  document.querySelectorAll(".buy-now").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
    if (prod) window.cartFunctions.directCheckout(prod);
  }));
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
        <div class="merch-img">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <div class="merch-tag">PREMIUM</div>
          <div class="coming-soon-overlay"><div class="coming-soon-text">COMING SOON</div></div>
        </div>
        <div class="merch-info">
          <div class="merch-title">${item.title}</div>
          <div class="merch-desc">${item.description}</div>
          <div class="merch-price-row">
            <span class="merch-price">$${item.price}</span>
            <button class="merch-btn" disabled style="opacity:0.5;">NOTIFY ME</button>
          </div>
        </div>
      `;
    } else {
      let colorHtml = `<div class="color-swatches" id="colors-${item.id}">`;
      item.colors.forEach((color, idx) => {
        const isSelected = idx === 0 ? 'selected' : '';
        colorHtml += `<div class="color-option ${isSelected}" style="background-color: ${color.code}; border: ${color.border || 'none'};" data-color="${color.name}" data-id="${item.id}"></div>`;
      });
      colorHtml += `</div>`;
      
      card.innerHTML = `
        <div class="merch-img">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <div class="merch-tag">LIMITED</div>
        </div>
        <div class="merch-info">
          <div class="merch-title">${item.title}</div>
          <div class="merch-desc">${item.description}</div>
          ${colorHtml}
          <div class="size-selector" id="sizes-${item.id}">
            <button class="size-btn" data-size="S">S</button>
            <button class="size-btn" data-size="M">M</button>
            <button class="size-btn" data-size="L">L</button>
            <button class="size-btn" data-size="XL">XL</button>
            <button class="size-btn" data-size="XXL">XXL</button>
          </div>
          <div class="merch-price-row">
            <span class="merch-price">$${item.price}</span>
            <a href="${item.paymentUrl}" target="_blank" class="merch-pay-btn">BUY NOW →</a>
          </div>
        </div>
      `;
    }
    grid.appendChild(card);
  });
  
  // Add color and size selection for hoodie
  const hoodieItem = window.productData.merchItems.find(i => i.id === 101);
  if (hoodieItem && !hoodieItem.comingSoon) {
    const colorOptions = document.querySelectorAll(`.color-option[data-id="101"]`);
    colorOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = document.getElementById(`colors-101`);
        container.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
        opt.classList.add('selected');
        window.cartFunctions.showToast(`Color: ${opt.dataset.color} selected`);
      });
    });
    
    const sizeBtns = document.querySelectorAll(`#sizes-101 .size-btn`);
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sizeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        window.cartFunctions.showToast(`Size: ${btn.dataset.size} selected`);
      });
    });
  }
}

function renderTestimonials() {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;
  
  grid.innerHTML = window.productData.testimonials.map(t => `
    <div class="testimonial-card">
      <div class="stars">${"★".repeat(t.stars)}${"☆".repeat(5 - t.stars)}</div>
      <div class="testimonial-text">"${t.text}"</div>
      <div class="testimonial-author">— ${t.name}</div>
    </div>
  `).join("");
}

// Export rendering functions
window.renderFunctions = {
  renderProducts,
  renderMerch,
  renderTestimonials
};