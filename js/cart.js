// Cart Management System
const CART_STORAGE_KEY = "manlungCart";
let cart = [];

function saveCart() {
  const saved = window.appErrors.local.setJson(CART_STORAGE_KEY, cart);
  if (!saved) showToast("⚠️ Your cart won't be remembered — browser storage is blocked or full");
  updateBadge();
  renderCartUI();
}

// A stored cart line is only trustworthy if it can be priced and totalled.
function isValidCartItem(item) {
  return !!item
    && typeof item === "object"
    && typeof item.price === "number"
    && Number.isFinite(item.price)
    && Number.isFinite(Number(item.quantity))
    && Number(item.quantity) > 0;
}

function loadCart() {
  const stored = window.appErrors.local.getJson(CART_STORAGE_KEY, []);
  const items = Array.isArray(stored) ? stored : [];
  cart = items.filter(isValidCartItem).map(i => ({ ...i, quantity: Number(i.quantity) }));

  if (cart.length !== items.length) {
    window.appErrors.report(
      "cart:load",
      new Error(`Dropped ${items.length - cart.length} unreadable cart item(s) from storage`),
      "Some saved cart items couldn't be restored — please add them again"
    );
    window.appErrors.local.setJson(CART_STORAGE_KEY, cart);
  }

  updateBadge();
  renderCartUI();
}

function updateBadge() {
  const badge = document.getElementById("cartCountBadge");
  if (!badge) return;
  badge.innerText = cart.reduce((s, i) => s + i.quantity, 0);
}

// The whole app reports problems through this toast, so it must never throw:
// a missing toast element would otherwise turn every handled error into an
// unhandled one.
function showToast(m) {
  const t = document.getElementById("toastMsg");
  if (!t) {
    console.warn("[notice]", m);
    return;
  }
  t.innerText = m;
  t.style.opacity = "1";
  setTimeout(() => t.style.opacity = "0", 1600);
}

function addToCart(product, qty) {
  const quantity = Math.max(1, parseInt(qty) || 1);
  const existing = cart.find(i => i.id === product.id);
  if (existing) { 
    existing.quantity += quantity; 
    showToast(`${product.title} x${existing.quantity}`); 
  } else { 
    cart.push({...product, quantity: quantity}); 
    showToast(`"${product.title}" x${quantity} added`); 
  }
  saveCart();
}

function cdCatalog() {
  return Array.isArray(window.productData?.cdProducts) ? window.productData.cdProducts : [];
}

function isPhysicalItem(id) {
  return cdCatalog().some(p => p.id === id);
}

function getDownloadItems(product) {
  const cd = cdCatalog().find(p => p.id === product.id);
  if (cd) {
    // A CD's downloadable content is its full tracklist (set in Admin Portal)
    return (cd.tracks || []).map(t => ({ title: t.title, downloadUrl: t.url }));
  }
  // A digital single has one downloadUrl
  return [{ title: product.title, downloadUrl: product.downloadUrl }];
}

function directCheckout(product, qty) {
  if (!product) { showToast("Product unavailable"); return; }
  const quantity = Math.max(1, parseInt(qty) || 1);
  const physical = isPhysicalItem(product.id);

  window.paystackCheckoutFunctions.checkout({
    amount: product.price * quantity,
    items: [{ id: product.id, quantity: quantity }],
    label: product.title,
    needsShipping: physical,
    isPhysical: physical,
    downloadItems: getDownloadItems(product),
    metadata: {
      custom_fields: [
        { display_name: "Product", variable_name: "product", value: product.title },
        { display_name: "Product ID", variable_name: "product_id", value: product.id },
        { display_name: "Quantity", variable_name: "quantity", value: quantity }
      ]
    },
    onSuccess: (response) => {
      console.log("Paystack reference:", response.reference);
    }
  });
}

function renderCartUI() {
  const cont = document.getElementById("cartItemsContainer");
  const footerDiv = document.getElementById("cartFooter");
  if (!cont) return;

  if (cart.length === 0) { 
    cont.innerHTML = "<div style='text-align:center; padding:48px 20px; color:#7d8bab;'><div style='font-size:2.5rem; margin-bottom:12px;'>🛒</div><div style='font-weight:600; color:#16213e; margin-bottom:4px;'>Your cart is empty</div><div style='font-size:0.85rem;'>Browse Music, CDs, or Merch to add something.</div></div>"; 
    if (footerDiv) footerDiv.style.display = "none"; 
    return; 
  }
  
  let html = ""; 
  let total = 0;
  
  cart.forEach(item => { 
    const itemTotal = item.price * item.quantity; 
    total += itemTotal;
    html += `
      <div class='cart-item'>
        <div>
          <strong>${item.title}</strong><br>
          ${window.currencyFunctions.formatPrice(item.price)} x ${item.quantity}
          <div>
            <button class='cart-qty-btn' data-id='${item.id}' data-delta='-1'>-</button>
            <button class='cart-qty-btn' data-id='${item.id}' data-delta='1'>+</button>
            <button class='remove-item' data-id='${item.id}'>remove</button>
          </div>
        </div>
        <div>${window.currencyFunctions.formatPrice(itemTotal)}</div>
      </div>
    `;
  });
  
  cont.innerHTML = html;
  if (footerDiv) footerDiv.style.display = "block";
  const totalEl = document.getElementById("cartTotalPrice");
  if (totalEl) totalEl.innerText = window.currencyFunctions.formatPrice(total);
  
  document.querySelectorAll(".cart-qty-btn").forEach(btn => btn.addEventListener("click", () => updateQty(parseInt(btn.dataset.id), parseInt(btn.dataset.delta))));
  document.querySelectorAll(".remove-item").forEach(btn => btn.addEventListener("click", () => removeItem(parseInt(btn.dataset.id))));
}

function updateQty(pid, delta) {
  const idx = cart.findIndex(i => i.id === pid);
  if (idx === -1) return;
  const newQty = cart[idx].quantity + delta;
  if (newQty <= 0) cart.splice(idx, 1);
  else cart[idx].quantity = newQty;
  saveCart();
}

function removeItem(pid) { 
  cart = cart.filter(i => i.id !== pid); 
  saveCart(); 
  showToast("Removed"); 
}

function clearCart() {
  cart = [];
  saveCart();
}

function processCheckout() {
  if (cart.length === 0) { 
    showToast("Cart empty"); 
    return; 
  }

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const itemsSummary = cart.map(i => `${i.title} x${i.quantity}`).join(", ");
  const hasPhysical = cart.some(i => isPhysicalItem(i.id));
  const downloadItems = cart.flatMap(i => getDownloadItems(i));
  const items = cart.map(i => ({ id: i.id, quantity: i.quantity }));

  window.paystackCheckoutFunctions.checkout({
    amount: total,
    items: items,
    label: "Adict Manlung Store — Cart Checkout",
    needsShipping: hasPhysical,
    isPhysical: hasPhysical,
    downloadItems: downloadItems,
    metadata: {
      custom_fields: [
        { display_name: "Items", variable_name: "items", value: itemsSummary }
      ]
    },
    onSuccess: (response) => {
      console.log("Paystack reference:", response.reference);
      clearCart();
      document.getElementById("cartSidebar")?.classList.remove("open");
    }
  });
}

// Export cart functions
window.cartFunctions = {
  cart,
  saveCart,
  loadCart,
  updateBadge,
  showToast,
  addToCart,
  directCheckout,
  renderCartUI,
  updateQty,
  removeItem,
  processCheckout,
  clearCart
};
