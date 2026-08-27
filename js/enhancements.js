/* Manlung Shop — storefront polish layer */
(() => {
  const W = window;
  const wishlistKey = 'manlungWishlist';
  const recentKey = 'manlungRecentlyViewed';
  const promoKey = 'manlungPromo';

  const safe = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const products = () => (W.productData?.allProducts || []);
  const getProduct = id => products().find(p => Number(p.id) === Number(id));
  const wishlist = () => { try { return JSON.parse(localStorage.getItem(wishlistKey) || '[]'); } catch { return []; } };
  const saveWishlist = list => localStorage.setItem(wishlistKey, JSON.stringify([...new Set(list.map(Number))]));
  const isWishlisted = id => wishlist().includes(Number(id));

  function updateBadges() {
    const count = wishlist().length;
    const el = document.getElementById('wishlistBadge'); if (el) el.textContent = count;
    const cartCount = Number(document.getElementById('cartCountBadge')?.textContent || 0);
    const cb = document.getElementById('mobileCartBadge'); if (cb) cb.textContent = cartCount;
  }

  function toggleWishlist(id) {
    const list = wishlist();
    const n = Number(id);
    const next = list.includes(n) ? list.filter(x => x !== n) : [...list, n];
    saveWishlist(next); updateBadges(); decorateWishlistButtons();
    W.cartFunctions?.showToast(next.includes(n) ? '♡ Saved to wishlist' : 'Removed from wishlist');
  }

  function addRecent(id) {
    const list = (() => { try { return JSON.parse(localStorage.getItem(recentKey) || '[]'); } catch { return []; } })();
    const n = Number(id);
    const next = [n, ...list.filter(x => Number(x) !== n)].slice(0, 8);
    localStorage.setItem(recentKey, JSON.stringify(next));
  }

  function quickView(id) {
    const p = getProduct(id); const modal = document.getElementById('quickViewModal'); const content = document.getElementById('quickViewContent');
    if (!p || !modal || !content) return;
    addRecent(id);
    const img = p.imgUrl || p.images?.[0] || '';
    const sold = p.soldOut || p.stock === 0;
    content.innerHTML = `<div class="quick-view-grid"><div class="quick-view-media"><img src="${safe(img)}" alt="${safe(p.title)}"></div><div class="quick-view-copy"><span class="eyebrow">${safe(p.unit || 'MANLUNG')}</span><h2>${safe(p.title)}</h2><div class="quick-view-price">${W.currencyFunctions?.formatPrice(p.price) || `KSh ${p.price}`}</div><p>${safe(p.description || 'Official Manlung release.')}</p>${p.features?.length ? `<div class="feature-tags">${p.features.slice(0,4).map(f => `<span class="feature-tag">${safe(f)}</span>`).join('')}</div>` : ''}<div class="quick-view-actions"><button class="btn-primary" id="quickAddBtn" ${sold?'disabled':''}>${sold?'SOLD OUT':'ADD TO CART'}</button><button class="wishlist-action ${isWishlisted(id)?'saved':''}" id="quickWishBtn">${isWishlisted(id)?'♥ Saved':'♡ Save'}</button></div></div></div>`;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.getElementById('quickAddBtn')?.addEventListener('click', () => { if (!sold) { W.cartFunctions?.addToCart(p,1); modal.classList.remove('open'); } });
    document.getElementById('quickWishBtn')?.addEventListener('click', () => toggleWishlist(id));
  }

  function closeQuickView() { const m = document.getElementById('quickViewModal'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); } }

  function decorateWishlistButtons() {
    document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
      const id = Number(btn.dataset.wishlistId); const saved = isWishlisted(id);
      btn.classList.toggle('saved', saved); btn.setAttribute('aria-label', saved ? 'Remove from wishlist' : 'Save to wishlist'); btn.textContent = saved ? '♥' : '♡';
    });
  }

  function decorateCards() {
    document.querySelectorAll('.product-card, .merch-card').forEach(card => {
      if (card.dataset.enhanced) return;
      const id = card.querySelector('[data-id]')?.dataset.id || card.dataset.id;
      if (!id) return;
      card.dataset.id = id; card.dataset.enhanced = '1';
      const tools = document.createElement('div'); tools.className = 'card-float-tools';
      tools.innerHTML = `<button type="button" class="wishlist-float" data-wishlist-id="${id}">♡</button><button type="button" class="quick-view-float" data-quick-id="${id}">Quick view</button>`;
      card.insertBefore(tools, card.firstChild);
      tools.querySelector('[data-wishlist-id]').addEventListener('click', e => { e.stopPropagation(); toggleWishlist(id); });
      tools.querySelector('[data-quick-id]').addEventListener('click', e => { e.stopPropagation(); quickView(id); });
    });
    decorateWishlistButtons();
  }

  function renderFeatureRows() {
    const featured = document.getElementById('featuredGrid'); const best = document.getElementById('bestsellerGrid');
    if (!featured || !best) return;
    const all = products().filter(p => !(p.soldOut || p.stock === 0));
    const featuredItems = all.filter(p => p.featured).slice(0,4);
    const fallback = all.filter(p => !featuredItems.includes(p)).slice(0,4);
    const bestItems = [...all].sort((a,b) => (Number(b.featured)-Number(a.featured)) || (Number(a.price)-Number(b.price))).slice(0,4);
    const card = p => `<article class="mini-product-card"><div class="mini-product-image"><img src="${safe(p.imgUrl || p.images?.[0] || '')}" loading="lazy" alt="${safe(p.title)}"><span>${p.featured?'BEST SELLER':'NEW'}</span></div><div class="mini-product-copy"><h3>${safe(p.title)}</h3><strong>${W.currencyFunctions?.formatPrice(p.price) || `KSh ${p.price}`}</strong><div><button class="mini-add" data-mini-add="${p.id}">Add to cart</button><button class="mini-save" data-mini-save="${p.id}">${isWishlisted(p.id)?'♥':'♡'}</button></div></div></article>`;
    featured.innerHTML = (featuredItems.length ? featuredItems : fallback).map(card).join('');
    best.innerHTML = bestItems.map(card).join('');
    document.querySelectorAll('[data-mini-add]').forEach(b => b.addEventListener('click', () => { const p=getProduct(b.dataset.miniAdd); if(p) W.cartFunctions?.addToCart(p,1); }));
    document.querySelectorAll('[data-mini-save]').forEach(b => b.addEventListener('click', () => toggleWishlist(b.dataset.miniSave)));
  }

  function initGlobalSearch() {
    const btn = document.getElementById('headerSearchBtn'); if (!btn) return;
    const overlay = document.createElement('div'); overlay.className='global-search-modal'; overlay.id='globalSearchModal'; overlay.innerHTML=`<div class="global-search-box"><button class="global-search-close" type="button">✕</button><span class="eyebrow">SEARCH MANLUNG SHOP</span><input id="globalSearchInput" autocomplete="off" placeholder="Search music, CDs, hoodies..."/><div id="globalSearchResults"></div></div>`;
    document.body.appendChild(overlay);
    const input=overlay.querySelector('#globalSearchInput'), results=overlay.querySelector('#globalSearchResults');
    const render=q=>{ const query=q.trim().toLowerCase(); const found=products().filter(p=>!query || `${p.title} ${p.description||''}`.toLowerCase().includes(query)).slice(0,8); results.innerHTML=found.length?found.map(p=>`<button class="global-result" data-search-id="${p.id}"><img src="${safe(p.imgUrl||p.images?.[0]||'')}" alt=""><span><strong>${safe(p.title)}</strong><small>${safe(p.unit||'Product')} · ${W.currencyFunctions?.formatPrice(p.price)||`KSh ${p.price}`}</small></span></button>`).join(''):`<div class="search-empty">No products found. Try another search.</div>`; results.querySelectorAll('[data-search-id]').forEach(r=>r.addEventListener('click',()=>{ quickView(r.dataset.searchId); overlay.classList.remove('open'); })); };
    btn.addEventListener('click',()=>{overlay.classList.add('open'); input.focus(); render('');}); overlay.querySelector('.global-search-close').addEventListener('click',()=>overlay.classList.remove('open')); overlay.addEventListener('click',e=>{if(e.target===overlay) overlay.classList.remove('open')}); input.addEventListener('input',()=>render(input.value));
  }

  function initCartPolish() {
    const sidebar=document.getElementById('cartSidebar'); if(!sidebar) return;
    const original=W.cartFunctions?.renderCartUI; if(!original || original.__enhanced) return;
    const enhanced=function(){ original(); updateBadges(); const footer=document.getElementById('cartFooter'); if(!footer) return; const subtotalEl=document.getElementById('cartSubtotalPrice'); const totalEl=document.getElementById('cartTotalPrice'); const sub=Number((subtotalEl?.textContent||'').replace(/[^0-9.]/g,'')); if(subtotalEl && totalEl && !document.getElementById('cartDiscountRow')?.style.display==='block') subtotalEl.textContent=totalEl.textContent; const progress=document.getElementById('shippingProgress'); if(progress){ const target=5000; const pct=Math.min(100,Math.round((sub/target)*100)); progress.innerHTML=sub>=target?`<strong>🎉 You unlocked free shipping!</strong>`:`Add ${W.currencyFunctions?.formatPrice(Math.max(0,target-sub))||''} more for <strong>free shipping</strong><div><i style="width:${pct}%"></i></div>`; } };
    enhanced.__enhanced=true; W.cartFunctions.renderCartUI=enhanced;
    const oldSave=W.cartFunctions.saveCart; if(oldSave && !oldSave.__wrapped){ W.cartFunctions.saveCart=function(){ oldSave(); enhanced(); }; W.cartFunctions.saveCart.__wrapped=true; }
    document.getElementById('promoApplyBtn')?.addEventListener('click',()=>{ const code=document.getElementById('promoCodeInput')?.value.trim().toUpperCase(); const valid={MANLUNG10:10,FLOCK15:15,WELCOME5:5}; const msg=document.getElementById('promoMessage'); if(valid[code]){localStorage.setItem(promoKey,JSON.stringify({code,percent:valid[code]})); if(msg)msg.textContent=`${code} applied — ${valid[code]}% off in popup checkout.`; W.cartFunctions.showToast(`${valid[code]}% promo applied`); W.cartFunctions.renderCartUI?.();} else {localStorage.removeItem(promoKey); if(msg)msg.textContent='Invalid promo code.';} });
  }

  function initShopFilters() {
    const sortGrid=(gridId,sortId)=>{const grid=document.getElementById(gridId),sel=document.getElementById(sortId); if(!grid||!sel)return; sel.addEventListener('change',()=>{const cards=[...grid.children]; cards.sort((a,b)=>{const pa=getProduct(a.dataset.id),pb=getProduct(b.dataset.id); if(!pa||!pb)return 0; if(sel.value==='price-low')return pa.price-pb.price; if(sel.value==='price-high')return pb.price-pa.price; if(sel.value==='newest')return pb.id-pa.id; return Number(pb.featured)-Number(pa.featured);}); cards.forEach(c=>grid.appendChild(c));});}; sortGrid('digitalGrid','musicSort'); sortGrid('cdGrid','cdSort'); sortGrid('merchGrid','merchSort');
  }

  function initMobile() {
    document.getElementById('mobileCartBtn')?.addEventListener('click',()=>document.getElementById('cartSidebar')?.classList.add('open'));
    document.getElementById('mobileWishlistBtn')?.addEventListener('click',()=>W.cartFunctions?.showToast(`${wishlist().length} saved item${wishlist().length===1?'':'s'}`));
    document.getElementById('quickViewClose')?.addEventListener('click',closeQuickView); document.getElementById('quickViewModal')?.addEventListener('click',e=>{if(e.target.id==='quickViewModal')closeQuickView();});
  }

  function boot(){ renderFeatureRows(); decorateCards(); initGlobalSearch(); initCartPolish(); initShopFilters(); initMobile(); updateBadges(); setInterval(()=>{decorateCards();updateBadges();},1200); }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250));
})();
