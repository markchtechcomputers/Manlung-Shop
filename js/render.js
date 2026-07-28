// UI Rendering Functions

// Product data can come from the cloud or from an admin export, so a missing or
// malformed list must degrade to "nothing to show here" instead of throwing
// mid-render and leaving a half-drawn page with no explanation.
function catalogList(key) {
  const list = window.productData?.[key];
  if (Array.isArray(list)) return list;
  window.appErrors.report("render:catalog", new Error(`productData.${key} is missing or not an array — rendering it as empty`));
  return [];
}

function featureTagsHtml(features) {
  if (!features || !features.length) return "";
  return `<div class="feature-tags">${features.map(f => `<span class="feature-tag">${f}</span>`).join("")}</div>`;
}

function renderProducts() {
  const digitalGrid = document.getElementById("digitalGrid");
  const cdGrid = document.getElementById("cdGrid");
  
  if (!digitalGrid || !cdGrid) return;
  
  digitalGrid.innerHTML = "";
  cdGrid.innerHTML = "";
  
  // Render digital products
  catalogList("digitalProducts").forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const soldOut = p.soldOut || p.stock === 0;
    card.innerHTML = `
      ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : ''}
      ${!soldOut && p.featured ? '<div class="featured-badge">🔥 FEATURED</div>' : ''}
      <div class="product-img"><img src="${p.imgUrl}" loading="lazy" alt="${p.title}"></div>
      <div class="product-info">
        <div class="product-type">DIGITAL</div>
        <div class="product-title">${p.title}</div>
        ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
        ${featureTagsHtml(p.features)}
        <div class="product-price-row">
          <span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>
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
  catalogList("cdProducts").forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    const soldOut = p.soldOut || p.stock === 0;
    card.innerHTML = `
      ${soldOut ? '<div class="sold-out-ribbon">SOLD OUT</div>' : (p.stock < 50 ? `<div class="stock-badge">Only ${p.stock} left</div>` : '')}
      ${!soldOut && p.featured ? '<div class="featured-badge">BESTSELLER</div>' : ''}
      <div class="product-img"><img src="${p.imgUrl}" loading="lazy" alt="${p.title}"></div>
      <div class="product-info">
        <div class="product-type">PHYSICAL CD</div>
        <div class="product-title">${p.title}</div>
        ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
        ${featureTagsHtml(p.features)}
        ${p.audioUrl ? `<audio controls controlsList="nodownload noplaybackrate" oncontextmenu="return false" class="cd-audio-preview" src="${p.audioUrl}"></audio>` : ''}
        <div class="product-price-row">
          <span class="product-price">${window.currencyFunctions.formatPrice(p.price)}</span>
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
  
  // Quantity steppers
  document.querySelectorAll(".qty-stepper").forEach(stepper => {
    const display = stepper.querySelector(".qty-display");
    const dec = stepper.querySelector(".qty-dec");
    const inc = stepper.querySelector(".qty-inc");
    if (!display || !dec || !inc) {
      window.appErrors.report("render:qty-stepper", new Error(`Quantity stepper for product ${stepper.dataset.id} is missing its controls`));
      return;
    }
    dec.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = Math.max(1, parseInt(display.textContent) - 1);
      display.textContent = val;
    });
    inc.addEventListener("click", (e) => {
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
  function findProduct(btn) {
    const id = parseInt(btn.dataset.id);
    const prod = catalogList("allProducts").find(p => p.id === id);
    if (!prod) {
      window.appErrors.report(
        "render:missing-product",
        new Error(`Product ${btn.dataset.id} is on the page but not in the catalog`),
        "That item is no longer available — please refresh the page"
      );
    }
    return prod;
  }

  document.querySelectorAll(".btn-add").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const prod = findProduct(btn);
    if (prod) window.cartFunctions.addToCart(prod, getSelectedQty(prod.id));
  }));
  
  document.querySelectorAll(".buy-now").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const prod = findProduct(btn);
    if (prod) window.cartFunctions.directCheckout(prod, getSelectedQty(prod.id));
  }));
}

function renderMerch() {
  const grid = document.getElementById("merchGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  catalogList("merchItems").forEach(item => {
    const card = document.createElement("div");
    card.className = "merch-card";
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
        <div class="merch-img">
          <img src="${item.imgUrl}" loading="lazy" alt="${item.title}">
          <div class="merch-tag">LIMITED</div>
        </div>
        <div class="merch-info">
          <div class="merch-title">${item.title}</div>
          <div class="merch-desc">${item.description}</div>
          ${featureTagsHtml(item.features)}
          ${colorHtml}
          ${sizeHtml}
          <div class="merch-price-row">
            <span class="merch-price">${window.currencyFunctions.formatPrice(item.price)}</span>
            ${item.unit ? `<span class="product-unit">${item.unit}</span>` : ''}
            <button class="merch-pay-btn" data-id="${item.id}">BUY NOW →</button>
          </div>
        </div>
      `;
    }
    grid.appendChild(card);
  });
  
  // Wire up color + size selection for every merch item that has them
  // (generic — works for any item added via the Admin Portal, not just one hardcoded product)
  catalogList("merchItems").forEach(item => {
    if (item.comingSoon || (item.soldOut && !item.comingSoon)) return;

    if (Array.isArray(item.colors) && item.colors.length) {
      const colorOptions = document.querySelectorAll(`.color-option[data-id="${item.id}"]`);
      colorOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const container = document.getElementById(`colors-${item.id}`);
          if (container) container.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
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

  // Merch checkout — every "BUY NOW" button goes through the same Paystack system
  document.querySelectorAll(".merch-pay-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = catalogList("merchItems").find(i => i.id === parseInt(btn.dataset.id));
      if (!item) {
        window.appErrors.report(
          "render:missing-product",
          new Error(`Merch item ${btn.dataset.id} is on the page but not in the catalog`),
          "That item is no longer available — please refresh the page"
        );
        return;
      }

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
  
  grid.innerHTML = catalogList("testimonials").map(t => `
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
