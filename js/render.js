// UI Rendering Functions

// Sort helper — newer products (higher id, or explicit createdAt) render first.
// The admin portal appends new items to the end of the list, so we reverse
// that order so the freshest drops show up on the front of every grid.
function sortNewestFirst(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
    return tb - ta;
  });
}

function featureTagsHtml(features) {
  if (!features || !features.length) return "";
  return `<div class="feature-tags">${features.map(f => `<span class="feature-tag">${f}</span>`).join("")}</div>`;
}


function galleryHtml(id, images, title, wrapClass) {
  const imgs = (images && images.length) ? images : [];
  if (imgs.length <= 1) {
    const src = imgs[0] || "";
    return `<div class="${wrapClass}"><img src="${src}" loading="lazy" alt="${title}"></div>`;
  }
  const slides = imgs.map((src, i) => `<img src="${src}" loading="lazy" alt="${title} ${i + 1}" class="gallery-slide ${i === 0 ? 'active' : ''}">`).join("");
  const dots = imgs.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join("");
  return `
    <div class="${wrapClass} gallery-wrap" data-gallery-id="${id}" data-count="${imgs.length}">
      ${slides}
      <button type="button" class="gallery-arrow gallery-prev">‹</button>
      <button type="button" class="gallery-arrow gallery-next">›</button>
      <div class="gallery-dots">${dots}</div>
    </div>
  `;
}

function initGalleries(container) {
  container.querySelectorAll(".gallery-wrap").forEach(wrap => {
    const slides = wrap.querySelectorAll(".gallery-slide");
    const dots = wrap.querySelectorAll(".gallery-dot");
    let index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("active", n === index));
      dots.forEach((d, n) => d.classList.toggle("active", n === index));
    }
    wrap.querySelector(".gallery-prev")?.addEventListener("click", (e) => { e.stopPropagation(); show(index - 1); });
    wrap.querySelector(".gallery-next")?.addEventListener("click", (e) => { e.stopPropagation(); show(index + 1); });
    dots.forEach(d => d.addEventListener("click", (e) => { e.stopPropagation(); show(parseInt(d.dataset.idx)); }));
  });
}

function renderProducts() {
  const digitalGrid = document.getElementById("digitalGrid");
  const cdGrid = document.getElementById("cdGrid");
  
  if (!digitalGrid || !cdGrid) return;
  
  digitalGrid.innerHTML = "";
  cdGrid.innerHTML = "";
  
  // Render digital products
  sortNewestFirst(window.productData.digitalProducts).forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.title = p.title.toLowerCase();
    const soldOut = p.soldOut || p.stock === 0;
    card.innerHTML = `
      ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : ''}
      ${!soldOut && p.discount > 0 ? `<div class="discount-badge">${p.discount}</div>` : ''}
      ${!soldOut && p.featured ? '<div class="featured-badge">🔥 FEATURED</div>' : ''}
       ${galleryHtml('digital-' + p.id, p.images, p.title, 'product-img')}
       <div class="product-info">
         <div class="product-type">DIGITAL</div>
         <div class="product-title">${p.title}</div>
         ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
         ${featureTagsHtml(p.features)}
         <div class="product-price-row">
           ${p.discount > 0 ? `<span class="product-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(p.price)}</span><span class="product-price">${window.currencyFunctions.formatPrice(Math.round(p.price * (1 - p.discount / 100)))}</span>` : `<span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>`}
           ${p.unit ? `<span class="product-unit">${p.unit}</span>` : ''}
         </div>
        ${!soldOut ? `<div class="qty-stepper" data-id="${p.id}">
          <button type="button" class="qty-dec">−</button>
          <span class="qty-display">1</span>
          <button type="button" class="qty-inc">+</button>
        </div>` : ''}
        <button class="btn-add" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>ADD TO CART</button>
        <button class="btn-buy-now buy-now" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>${soldOut ? 'SOLD OUT' : 'BUY NOW'}</button>
      </div>
    `;
    digitalGrid.appendChild(card);
  });
  
  // Render CD products
  sortNewestFirst(window.productData.cdProducts).forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const soldOut = p.soldOut || p.stock === 0;
    card.innerHTML = `
      ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : (p.stock < 50 ? `<div class="stock-badge">Only ${p.stock} left</div>` : '')}
       ${!soldOut && p.discount > 0 ? `<div class="discount-badge">${p.discount}</div>` : ''}
       ${!soldOut && p.featured ? '<div class="featured-badge">BESTSELLER</div>' : ''}
       ${galleryHtml('cd-' + p.id, p.images, p.title, 'product-img')}
       <div class="product-info">
         <div class="product-type">PHYSICAL CD</div>
         <div class="product-title">${p.title}</div>
         ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
         ${featureTagsHtml(p.features)}
         ${p.audioUrl ? `<audio controls controlsList="nodownload noplaybackrate" oncontextmenu="return false" class="cd-audio-preview" src="${p.audioUrl}"></audio>` : ''}
         <div class="product-price-row">
           ${p.discount > 0 ? `<span class="product-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(p.price)}</span><span class="product-price">${window.currencyFunctions.formatPrice(Math.round(p.price * (1 - p.discount / 100)))}</span>` : `<span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>`}
           ${p.unit ? `<span class="product-unit">${p.unit}</span>` : ''}
         </div>
        ${!soldOut ? `<div class="qty-stepper" data-id="${p.id}">
          <button type="button" class="qty-dec">−</button>
          <span class="qty-display">1</span>
          <button type="button" class="qty-inc">+</button>
        </div>` : ''}
        <button class="btn-add" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>ADD TO CART</button>
        <button class="btn-buy-now buy-now" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>${soldOut ? 'SOLD OUT' : 'BUY NOW'}</button>
      </div>
    `;
    cdGrid.appendChild(card);
  });

  initGalleries(digitalGrid);
  initGalleries(cdGrid);
  
  // Quantity steppers
  document.querySelectorAll(".qty-stepper").forEach(stepper => {
    const display = stepper.querySelector(".qty-display");
    stepper.querySelector(".qty-dec").addEventListener("click", (e) => {
      e.stopPropagation();
      const val = Math.max(1, parseInt(display.textContent) - 1);
      display.textContent = val;
    });
    stepper.querySelector(".qty-inc").addEventListener("click", (e) => {
      e.stopPropagation();
      const val = parseInt(display.textContent) + 1;
      display.textContent = val;
    });
  });

  function getSelectedQty(id) {
    const stepper = document.querySelector(`.qty-stepper[data-id="${id}"]`);
    return stepper ? parseInt(stepper.querySelector(".qty-display").textContent) || 1 : 1;
  }

  // Add event listeners
   document.querySelectorAll(".btn-add").forEach(btn => btn.addEventListener("click", (e) => {
     e.stopPropagation();
     const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
     if (prod) { trackProductView(prod.id); window.cartFunctions.addToCart(prod, getSelectedQty(prod.id)); }
   }));
   
   document.querySelectorAll(".buy-now").forEach(btn => btn.addEventListener("click", (e) => {
     e.stopPropagation();
     const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
     if (prod) { trackProductView(prod.id); window.cartFunctions.directCheckout(prod, getSelectedQty(prod.id)); }
   }));
}

function renderMerch() {
  const grid = document.getElementById("merchGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  sortNewestFirst(window.productData.merchItems).forEach(item => {
    const card = document.createElement("div");
    card.className = "merch-card";
    card.dataset.title = item.title.toLowerCase();
    card.dataset.category = item.category || "unisex";
    const soldOut = item.soldOut && !item.comingSoon;
    
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
          ${featureTagsHtml(item.features)}
          <div class="merch-price-row">
            <span class="merch-price">${window.currencyFunctions.formatPrice(item.price)}</span>
            ${item.unit ? `<span class="product-unit">${item.unit}</span>` : ''}
            <button class="merch-btn" disabled style="opacity:0.5;">NOTIFY ME</button>
          </div>
        </div>
      `;
    } else if (soldOut) {
      card.innerHTML = `
        <div class="merch-img">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <div class="merch-tag">LIMITED</div>
          ${item.discount > 0 ? `<div class="discount-badge">${item.discount}</div>` : ''}
          <div class="coming-soon-overlay"><div class="coming-soon-text">SOLD OUT</div></div>
        </div>
        <div class="merch-info">
          <div class="merch-title">${item.title}</div>
          <div class="merch-desc">${item.description}</div>
          ${featureTagsHtml(item.features)}
          <div class="merch-price-row">
            <span class="merch-price">${window.currencyFunctions.formatPrice(item.price)}</span>
            ${item.unit ? `<span class="product-unit">${item.unit}</span>` : ''}
            <button class="merch-btn" disabled style="opacity:0.5;">SOLD OUT</button>
          </div>
        </div>
      `;
    } else {
      const hasColors = Array.isArray(item.colors) && item.colors.length > 0;
      const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;

      let colorHtml = "";
      if (hasColors) {
        colorHtml = `<div class="color-swatches" id="colors-${item.id}">`;
        item.colors.forEach((color, idx) => {
          const isSelected = idx === 0 ? 'selected' : '';
          colorHtml += `<div class="color-option ${isSelected}" style="background-color: ${color.code}; border: ${color.border || 'none'};" data-color="${color.name}" data-id="${item.id}" title="${color.name}"></div>`;
        });
        colorHtml += `</div>`;
      }

      let sizeHtml = "";
      if (hasSizes) {
        sizeHtml = `<div class="size-selector" id="sizes-${item.id}">`;
        item.sizes.forEach(size => {
          sizeHtml += `<button class="size-btn" data-size="${size}">${size}</button>`;
        });
        sizeHtml += `</div>`;
      }

      card.innerHTML = `
        <div class="merch-img-wrap-outer">
          ${galleryHtml('merch-' + item.id, item.images, item.title, 'merch-img')}
          <div class="merch-tag">LIMITED</div>
          ${item.discount > 0 ? `<div class="discount-badge">${item.discount}</div>` : ''}
          ${typeof item.stock === 'number' && item.stock > 0 && item.stock < 20 ? `<div class="stock-badge">Only ${item.stock} left</div>` : ''}
        </div>
        <div class="merch-info">
          <div class="merch-title">${item.title}</div>
          <div class="merch-desc">${item.description}</div>
          ${featureTagsHtml(item.features)}
          ${colorHtml}
          ${sizeHtml}
          <div class="merch-price-row">
            ${item.discount > 0 ? `<span class="merch-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(item.price)}</span><span class="merch-price">${window.currencyFunctions.formatPrice(Math.round(item.price * (1 - item.discount / 100)))}</span>` : `<span class="merch-price">${window.currencyFunctions.formatPrice(item.price)}</span>`}
            ${item.unit ? `<span class="product-unit">${item.unit}</span>` : ''}
          </div>
          <div class="merch-btn-row">
            <button class="btn-add merch-add-btn" data-id="${item.id}">ADD TO CART</button>
            <button class="merch-pay-btn" data-id="${item.id}">BUY NOW →</button>
          </div>
        </div>
      `;
    }
    grid.appendChild(card);
  });

  initGalleries(grid);
  
  // Wire up color + size selection for every merch item that has them
  // (generic — works for any item added via the Admin Portal, not just one hardcoded product)
  sortNewestFirst(window.productData.merchItems).forEach(item => {
    if (item.comingSoon || (item.soldOut && !item.comingSoon)) return;

    if (Array.isArray(item.colors) && item.colors.length) {
      const colorOptions = document.querySelectorAll(`.color-option[data-id="${item.id}"]`);
      colorOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const container = document.getElementById(`colors-${item.id}`);
          container.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
          opt.classList.add('selected');
          window.cartFunctions.showToast(`Color: ${opt.dataset.color} selected`);
        });
      });
    }

    if (Array.isArray(item.sizes) && item.sizes.length) {
      const sizeBtns = document.querySelectorAll(`#sizes-${item.id} .size-btn`);
      sizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          sizeBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          window.cartFunctions.showToast(`Size: ${btn.dataset.size} selected`);
        });
      });
    }
  });

  // Merch: Add to Cart (captures the currently selected color/size, if any)
   document.querySelectorAll(".merch-add-btn").forEach(btn => {
     btn.addEventListener("click", (e) => {
       e.stopPropagation();
       const item = window.productData.merchItems.find(i => i.id == parseInt(btn.dataset.id));
       if (!item) return;
       trackProductView(item.id);

       const selectedColorEl = document.querySelector(`#colors-${item.id} .color-option.selected`);
       const selectedSizeEl = document.querySelector(`#sizes-${item.id} .size-btn.selected`);
       const color = selectedColorEl ? selectedColorEl.dataset.color : null;
       const size = selectedSizeEl ? selectedSizeEl.dataset.size : null;

       window.cartFunctions.addToCart({ ...item, color, size }, 1);
     });
   });

   // Merch checkout — every "BUY NOW" button goes through the same Paystack system
   document.querySelectorAll(".merch-pay-btn").forEach(btn => {
     btn.addEventListener("click", (e) => {
       e.stopPropagation();
       const item = window.productData.merchItems.find(i => i.id == parseInt(btn.dataset.id));
       if (!item) return;
       trackProductView(item.id);

      const selectedColorEl = document.querySelector(`#colors-${item.id} .color-option.selected`);
      const selectedSizeEl = document.querySelector(`#sizes-${item.id} .size-btn.selected`);
      const color = selectedColorEl ? selectedColorEl.dataset.color : "Default";
      const size = selectedSizeEl ? selectedSizeEl.dataset.size : "Not selected";

      window.paystackCheckoutFunctions.checkout({
        amount: item.price,
        items: [{ id: item.id, quantity: 1 }],
        label: item.title,
        needsShipping: true,
        isPhysical: true,
        downloadItems: [],
        metadata: {
          custom_fields: [
            { display_name: "Product", variable_name: "product", value: item.title },
            { display_name: "Color", variable_name: "color", value: color },
            { display_name: "Size", variable_name: "size", value: size }
          ]
        },
        onSuccess: () => {
          console.log(`Order placed: ${item.title} (${color}, ${size})`);
        }
      });
    });
  });
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

function renderNewArrivals() {
   const grid = document.getElementById("newArrivalsGrid");
   if (!grid) return;
   grid.innerHTML = "";
   sortNewestFirst(window.productData.newArrivals).forEach(p => {
     const card = document.createElement("div");
     card.className = "new-arrivals-card";
     card.dataset.title = p.title.toLowerCase();
     card.dataset.id = p.id;
     const soldOut = p.soldOut || p.stock === 0;
     const discount = p.discount || 0;
     card.innerHTML = `
       ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : ''}
       ${!soldOut && discount > 0 ? `<div class="discount-badge">${discount}</div>` : ''}
       ${!soldOut && p.featured ? '<div class="featured-badge">🔥 FEATURED</div>' : ''}
       ${galleryHtml('newarr-' + p.id, p.images || [p.imgUrl], p.title, 'product-img')}
       <div class="product-info">
         <div class="product-type">${p.category || 'NEW'}</div>
         <div class="product-title">${p.title}</div>
         <div class="product-price-row">
           ${discount > 0 ? `<span class="product-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(p.price)}</span><span class="product-price">${window.currencyFunctions.formatPrice(Math.round(p.price * (1 - discount / 100)))}</span>` : `<span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>`}
           ${p.unit ? `<span class="product-unit">${p.unit}</span>` : ''}
         </div>
         <button class="btn-add" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>ADD TO CART</button>
       </div>
     `;
     grid.appendChild(card);
   });
   initGalleries(grid);
   grid.querySelectorAll(".btn-add").forEach(btn => {
     btn.addEventListener("click", (e) => {
       e.stopPropagation();
       const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
       if (prod) { trackProductView(prod.id); window.cartFunctions.addToCart(prod, 1); }
     });
   });
 }

 function renderSponsored() {
   const grid = document.getElementById("sponsoredGrid");
   if (!grid) return;
   grid.innerHTML = "";
   (window.productData.sponsored || []).forEach(p => {
     const card = document.createElement("div");
     card.className = "sponsored-card";
     card.dataset.title = p.title.toLowerCase();
     card.dataset.id = p.id;
     const soldOut = p.soldOut || p.stock === 0;
     const discount = p.discount || 0;
     card.innerHTML = `
       ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : ''}
       ${!soldOut && discount > 0 ? `<div class="discount-badge">${discount}</div>` : ''}
       ${galleryHtml('spon-' + p.id, p.images || [p.imgUrl], p.title, 'product-img')}
       <div class="product-info">
         <div class="product-type">SPONSORED</div>
         <div class="product-title">${p.title}</div>
         <div class="product-price-row">
           ${discount > 0 ? `<span class="product-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(p.price)}</span><span class="product-price">${window.currencyFunctions.formatPrice(Math.round(p.price * (1 - discount / 100)))}</span>` : `<span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>`}
           ${p.unit ? `<span class="product-unit">${p.unit}</span>` : ''}
         </div>
         <button class="btn-add" data-id="${p.id}" ${soldOut ? 'disabled' : ''}>ADD TO CART</button>
       </div>
     `;
     grid.appendChild(card);
   });
   initGalleries(grid);
   grid.querySelectorAll(".btn-add").forEach(btn => {
     btn.addEventListener("click", (e) => {
       e.stopPropagation();
       const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
       if (prod) { trackProductView(prod.id); window.cartFunctions.addToCart(prod, 1); }
     });
   });
 }

 function renderRecentlyViewed() {
   const grid = document.getElementById("recentlyViewedGrid");
   if (!grid) return;
   grid.innerHTML = "";
   const viewed = window.productData.recentlyViewed || [];
   if (!viewed.length) { grid.style.display = 'none'; return; }
   grid.style.display = '';
   viewed.forEach(id => {
     const prod = window.productData.allProducts.find(p => p.id === id);
     if (!prod) return;
     const card = document.createElement("div");
     card.className = "recently-viewed-card";
     card.dataset.title = prod.title.toLowerCase();
     const discount = prod.discount || 0;
     card.innerHTML = `
       ${discount > 0 ? `<div class="discount-badge">${discount}</div>` : ''}
       ${galleryHtml('recent-' + prod.id, prod.images || [prod.imgUrl], prod.title, 'product-img')}
       <div class="product-info">
         <div class="product-title">${prod.title}</div>
         <div class="product-price-row">
           ${discount > 0 ? `<span class="product-price" style="text-decoration:line-through;color:#999;">${window.currencyFunctions.formatPrice(prod.price)}</span><span class="product-price">${window.currencyFunctions.formatPrice(Math.round(prod.price * (1 - discount / 100)))}</span>` : `<span class="product-price">${window.currencyFunctions.formatPrice(prod.price)}</span>`}
           ${prod.unit ? `<span class="product-unit">${prod.unit}</span>` : ''}
         </div>
         <button class="btn-add" data-id="${prod.id}" ${(prod.soldOut || prod.stock === 0) ? 'disabled' : ''}>ADD TO CART</button>
       </div>
     `;
     grid.appendChild(card);
   });
   initGalleries(grid);
   grid.querySelectorAll(".btn-add").forEach(btn => {
     btn.addEventListener("click", (e) => {
       e.stopPropagation();
       const prod = window.productData.allProducts.find(p => p.id == parseInt(btn.dataset.id));
       if (prod) window.cartFunctions.addToCart(prod, 1);
     });
   });
 }

 function trackProductView(id) {
   let viewed = window.productData.recentlyViewed || [];
   viewed = viewed.filter(v => v !== id);
   viewed.unshift(id);
   if (viewed.length > 10) viewed = viewed.slice(0, 10);
   window.productData.recentlyViewed = viewed;
   try { localStorage.setItem("manlung_recently_viewed", JSON.stringify(viewed)); } catch(e) {}
   renderRecentlyViewed();
 }

 function initGlobalSearch() {
   const searchInput = document.getElementById("globalSearch");
   if (!searchInput) return;
   searchInput.addEventListener("input", () => {
     const q = searchInput.value.trim().toLowerCase();
     if (!q) {
       document.querySelectorAll("#digitalGrid .product-card").forEach(c => c.style.display = "");
       document.querySelectorAll("#cdGrid .product-card").forEach(c => c.style.display = "");
       document.querySelectorAll("#merchGrid .merch-card").forEach(c => c.style.display = "");
       document.querySelectorAll(".new-arrivals-card").forEach(c => c.style.display = "");
       document.querySelectorAll(".sponsored-card").forEach(c => c.style.display = "");
       document.querySelectorAll(".recently-viewed-card").forEach(c => c.style.display = "");
       return;
     }
     const matches = (cards) => {
       cards.forEach(card => {
         card.style.display = card.dataset.title.includes(q) ? "" : "none";
       });
     };
     matches(document.querySelectorAll("#digitalGrid .product-card"));
     matches(document.querySelectorAll("#cdGrid .product-card"));
     matches(document.querySelectorAll("#merchGrid .merch-card"));
     matches(document.querySelectorAll(".new-arrivals-card"));
     matches(document.querySelectorAll(".sponsored-card"));
     matches(document.querySelectorAll(".recently-viewed-card"));
   });
 }

 function initDarkMode() {
   const toggle = document.getElementById("darkModeToggle");
   if (!toggle) return;
   const current = localStorage.getItem("manlungDarkMode") || "light";
   if (current === "dark") {
     document.documentElement.setAttribute("data-theme", "dark");
   }
   toggle.addEventListener("click", () => {
     const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
     document.documentElement.setAttribute("data-theme", next);
     localStorage.setItem("manlungDarkMode", next);
   });
 }


window.renderFunctions = {
  renderProducts,
  renderMerch,
  renderTestimonials,
  renderNewArrivals,
  renderSponsored,
  renderRecentlyViewed
};
window.trackProductView = trackProductView;
