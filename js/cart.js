// Cart Management System
let cart = [];

function saveCart() { 
  localStorage.setItem("manlungCart", JSON.stringify(cart)); 
  updateBadge(); 
  renderCartUI(); 
}

function loadCart() { 
  const s = localStorage.getItem("manlungCart"); 
  cart = s ? JSON.parse(s) : []; 
  updateBadge(); 
  renderCartUI(); 
}

function updateBadge() { 
  document.getElementById("cartCountBadge").innerText = cart.reduce((s, i) => s + i.quantity, 0); 
}

function showToast(m) { 
  const t = document.getElementById("toastMsg"); 
  t.innerText = m; 
  t.style.opacity = "1"; 
  setTimeout(() => t.style.opacity = "0", 1600); 
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) { 
    existing.quantity++; 
    showToast(`${product.title} x${existing.quantity}`); 
  } else { 
    cart.push({...product, quantity:1}); 
    showToast(`"${product.title}" added`); 
  }
  saveCart();
}

function directCheckout(product) {
  if (product && product.purchaseUrl) { 
    window.open(product.purchaseUrl, "_blank"); 
    showToast("Redirecting to secure checkout"); 
  } else showToast("Payment link unavailable");
}

function renderCartUI() {
  const cont = document.getElementById("cartItemsContainer");
  const footerDiv = document.getElementById("cartFooter");
  
  if (cart.length === 0) { 
    cont.innerHTML = "<div style='text-align:center; padding:20px;'>Cart empty</div>"; 
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
          $${item.price} x ${item.quantity}
          <div>
            <button class='cart-qty-btn' data-id='${item.id}' data-delta='-1'>-</button>
            <button class='cart-qty-btn' data-id='${item.id}' data-delta='1'>+</button>
            <button class='remove-item' data-id='${item.id}'>remove</button>
          </div>
        </div>
        <div>$${itemTotal.toFixed(2)}</div>
      </div>
    `;
  });
  
  cont.innerHTML = html;
  if (footerDiv) footerDiv.style.display = "block";
  document.getElementById("cartTotalPrice").innerText = `$${total.toFixed(2)}`;
  
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

function processCheckout() {
  if (cart.length === 0) { 
    showToast("Cart empty"); 
    return; 
  }
  
  if (cart.length === 1) {
    const product = window.productData.allProducts.find(p => p.id === cart[0].id);
    if (product) directCheckout(product);
  } else {
    alert(`Multiple items: $${cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}\nM-Pesa Till: 123456 | Account: MANLUNG`);
  }
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
  processCheckout
};