/* Manlung Shop — stable application boot + storefront refresh */

function sfText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

function initStorefrontRefresh() {
  if (!document.getElementById('storefrontFixStyles')) {
    const link = document.createElement('link');
    link.id = 'storefrontFixStyles';
    link.rel = 'stylesheet';
    link.href = 'css/storefront-fixes.css?v=20260912-2';
    document.head.appendChild(link);
  }

  document.title = 'Manlung Shop | Adict Manlung — The Flock Storyteller';
  document.querySelector('meta[name="description"]')?.setAttribute('content','Official Manlung Shop — music, CDs, The Flock culture and limited merchandise from Adict Manlung.');
  document.querySelector('meta[property="og:title"]')?.setAttribute('content','Manlung Shop | Adict Manlung — The Flock Storyteller');
  document.querySelector('meta[property="og:description"]')?.setAttribute('content','Official music, CDs, merchandise and live updates from independent Kenyan artist Adict Manlung.');
  document.querySelector('meta[property="og:image"]')?.setAttribute('content','https://res.cloudinary.com/dxtpph9o9/image/upload/_DSC1701.JPG_ctscwb.jpg');

  document.querySelectorAll('.top-marquee-track span').forEach(span => {
    span.textContent = 'THE FLOCK STORYTELLER  ✦  NEW MUSIC  ✦  LIMITED DROPS  ✦  CDS  ✦  LIVE UPDATES  ✦  ADICT MANLUNG  ✦';
  });
  sfText('.drip-influencer-tag','THE FLOCK STORYTELLER · INDEPENDENT KENYAN HIP-HOP');
  sfText('.bio-text p','Street-rooted storytelling from Adict Manlung — music, culture and merchandise built independently from Kenya, with the next chapter Running already in progress.');
  sfText('.sponsored-section .section-title','Featured Releases & Drops');
  sfText('.merch-hero h1','The Flock / Merch');
  sfText('.merch-hero p','Limited pieces from the Manlung world — street-rooted, independent and released as the movement grows.');

  installSponsoredRailFix();
}

function installSponsoredRailFix() {
  if (!window.renderFunctions || window.renderFunctions.__manlungSponsoredFixed) return;
  window.renderFunctions.__manlungSponsoredFixed = true;
  window.renderFunctions.renderSponsored = function() {
    const grid = document.getElementById('sponsoredGrid');
    if (!grid || !window.productData) return;
    const all = [
      ...(window.productData.digitalProducts || []).map(p => ({...p,_type:'DIGITAL'})),
      ...(window.productData.cdProducts || []).map(p => ({...p,_type:'CD'})),
      ...(window.productData.merchItems || []).filter(p => !p.comingSoon).map(p => ({...p,_type:'MERCH'}))
    ];
    const seen = new Set();
    const picks = all.filter(p => {
      if (!(p.featured || p.sponsored)) return false;
      const key = `${p._type}:${p.id || p.title}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0,8);
    const section = grid.closest('.sponsored-section');
    if (!picks.length) { if(section) section.style.display='none'; return; }
    if(section) section.style.display='block';
    grid.innerHTML = `<div class="sponsored-track">${picks.map((p,i)=>`<article class="sponsored-card" data-idx="${i}"><span class="sponsored-tag">${p.sponsored?'SPONSORED':'FEATURED'}</span><div class="sponsored-img"><img loading="lazy" src="${p.imgUrl || (Array.isArray(p.images)?p.images[0]:'')}" alt="${p.title}"></div><div class="sponsored-info"><div class="sponsored-type">${p._type}</div><div class="sponsored-title">${p.title}</div><div class="sponsored-price">${window.currencyFunctions?.formatPrice ? window.currencyFunctions.formatPrice(p.price) : ''}</div></div></article>`).join('')}</div>`;
    grid.querySelectorAll('.sponsored-card').forEach(card => card.addEventListener('click',()=>{
      const p=picks[Number(card.dataset.idx)];
      document.querySelector(`[data-nav="${p._type==='DIGITAL'?'music':p._type==='CD'?'cds':'merch'}"]`)?.click();
    }));
  };
}

function initNavigation() {
  const sections={home:'home-section',music:'music-section',cds:'cds-section',merch:'merch-section',tour:'tour-section',contact:'contact-section'};
  let current='home';
  const show = (name, push=true) => {
    current = sections[name] ? name : 'home';
    Object.entries(sections).forEach(([key,id])=>{const el=document.getElementById(id); if(el) el.style.display=key===current?'block':'none';});
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===current));
    document.getElementById('backToHomeBtn')?.style.setProperty('display',current==='home'?'none':'flex');
    if(push) history.pushState({manlungSection:current},'',window.location.pathname);
    window.scrollTo({top:0,behavior:'smooth'});
  };
  document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();show(a.dataset.nav);}));
  document.getElementById('shopNowBtn')?.addEventListener('click',()=>show('music'));
  document.getElementById('backToHomeBtn')?.addEventListener('click',()=>show('home'));
  window.addEventListener('popstate',e=>show(e.state?.manlungSection||'home',false));
  history.replaceState({manlungSection:'home'},'',window.location.pathname);
  show('home',false);
}

function initSearchAndFilters(){
  const musicSearch=document.getElementById('musicSearch');
  musicSearch?.addEventListener('input',()=>{const q=musicSearch.value.trim().toLowerCase();document.querySelectorAll('#digitalGrid .product-card').forEach(c=>c.style.display=(c.dataset.title||'').includes(q)?'':'none');});
  const merchSearch=document.getElementById('merchSearch'); let cat='all';
  const apply=()=>{const q=(merchSearch?.value||'').trim().toLowerCase();document.querySelectorAll('#merchGrid .merch-card').forEach(c=>{const ok=(c.dataset.title||'').includes(q)&&(cat==='all'||c.dataset.category===cat);c.style.display=ok?'':'none';});};
  merchSearch?.addEventListener('input',apply);
  document.querySelectorAll('.merch-cat-tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.merch-cat-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');cat=t.dataset.cat||'all';apply();}));
}

function initEmailSubscription(){document.getElementById('subscribeEmailBtn')?.addEventListener('click',()=>{const input=document.getElementById('captureEmail');const ok=input?.value.includes('@')&&input.value.includes('.');window.cartFunctions?.showToast(ok?'Subscribed!':'Enter valid email');if(ok)input.value='';});}
function initTourNotify(){document.getElementById('tourNotifyBtn')?.addEventListener('click',()=>{const input=document.getElementById('tourNotifyEmail');const ok=input?.value.includes('@')&&input.value.includes('.');window.cartFunctions?.showToast(ok?"You'll be notified when a show is announced!":'Enter a valid email');if(ok)input.value='';});}
function initScrollTopButton(){const b=document.getElementById('scrollTopBtn');if(!b)return;window.addEventListener('scroll',()=>b.style.display=scrollY>400?'flex':'none');b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));}

function initMusicStoryline(){
  const home=document.getElementById('home-section'); if(!home||document.getElementById('music-story-section'))return;
  const p=home.querySelectorAll('.about-text > p');
  if(p[0])p[0].textContent="Adict Manlung's music story began around 2018, while he was still in school. Lyrics were being written in the same exercise books used for school subjects. After a difficult school chapter, he returned and completed Form Four.";
  if(p[1])p[1].textContent="After school he kept writing and recording, although many early tracks stayed unreleased. In 2022, My Gee became the first official release and opened a public catalogue built around friendship, ambition, setbacks, survival and growth.";
  if(p[2])p[2].textContent="The journey moved between Eldoret and Nairobi. A later Nairobi chapter involved detention and court proceedings, followed by a return to Eldoret and a rebuild. The music continued through the setback.";
  const values=home.querySelectorAll('.profile-info-value'); if(values[0])values[0].textContent='Eldoret, Kenya · Nairobi chapters'; if(values[1])values[1].textContent='Kenyan Rapper · Storyteller · Entrepreneur · Independent Artist'; if(values[2])values[2].textContent='Kenya · East Africa · Diaspora';
  const stats=home.querySelectorAll('.stats-row .stat-item');[['2018','Started','Writing & recording'],['2022','My Gee','First official release'],['2024','Jenga','Talent Awards chapter'],['2026+','Running','New project in progress']].forEach((x,i)=>{if(stats[i])stats[i].innerHTML=`<div class="stat-icon-circle">${x[0]}</div><div class="stat-number">${x[1]}</div><div class="stat-label">${x[2]}</div>`;});
  const section=document.createElement('section');section.id='music-story-section';section.className='music-story-section';section.innerHTML=`<div class="section-title">Music Story &amp; Journey</div><div class="story-intro"><span class="story-eyebrow">FROM THE NOTEBOOKS TO THE NEXT CHAPTER</span><h2>The music kept moving, even when life did not.</h2><p>School days, unreleased songs, first releases, Nairobi dreams, setbacks, survival and the decision to keep creating.</p></div><div class="music-timeline"><article class="story-chapter"><span>01</span><div><small>2018 · THE NOTEBOOKS</small><h3>Before the movement</h3><p>Lyrics began filling school exercise books. After a difficult school period, he returned and completed Form Four.</p></div></article><article class="story-chapter"><span>02</span><div><small>2019–2021 · UNRELEASED YEARS</small><h3>Recording without a spotlight</h3><p>Many songs were recorded but never released while the artist learned, wrote and hustled for resources.</p></div></article><article class="story-chapter"><span>03</span><div><small>2022 · MY GEE</small><h3>The first official release</h3><p>My Gee opened the public catalogue and established Adict Manlung as an independent storyteller.</p></div></article><article class="story-chapter"><span>04</span><div><small>2024 · NAIROBI &amp; JENGA</small><h3>A major Nairobi chapter</h3><p>The Jenga Talent Awards nomination and win became an important milestone after his first Nairobi trip.</p></div></article><article class="story-chapter"><span>05</span><div><small>2025–2026 · THE HARD RESET</small><h3>Work, court proceedings and starting again</h3><p>A difficult Nairobi chapter brought detention and court proceedings, loss of work and a return to Eldoret. He kept rebuilding.</p></div></article><article class="story-chapter"><span>06</span><div><small>NOW · RUNNING</small><h3>The next project</h3><p><strong>Running</strong> is being built from Eldoret, while <strong>Cold (Adict Manlung x Trecky)</strong> remains part of the recent catalogue.</p></div></article></div><div class="flock-history-card"><div><span class="story-eyebrow">THE BRAND</span><h3>Universion Flock → The Flock</h3></div><p>The identity has grown from Universion Flock into The Flock — the wider culture around the music, people and independent Manlung vision.</p></div>`;
  const blog=home.querySelector('.blog-section'); if(blog)blog.before(section); else home.appendChild(section);
}

function initCartSidebar(){const side=document.getElementById('cartSidebar');if(!side)return;document.getElementById('cartIconBtn')?.addEventListener('click',()=>side.classList.add('open'));document.getElementById('closeCartBtn')?.addEventListener('click',()=>side.classList.remove('open'));document.getElementById('checkoutBtn')?.addEventListener('click',window.cartFunctions?.processCheckout);}

function initApp(){
  console.log('Initializing Adict Manlung Store…');
  initStorefrontRefresh();
  try{window.cartFunctions?.loadCart();window.renderFunctions?.renderProducts();window.renderFunctions?.renderMerch();window.renderFunctions?.renderSponsored();window.renderFunctions?.renderTestimonials();}catch(e){console.error('Store render boot:',e);}
  try{window.tourSystem?.setupTourEvents();window.tourSystem?.initTourSlideshow();window.tourSystem?.initRateCardDownload();window.tourSystem?.checkPaymentReturn();window.paystackCheckoutFunctions?.checkGatewayReturn();window.brandsCarouselFunctions?.initBrandsCarousel();}catch(e){console.error('Tour boot:',e);}
  initScrollTopButton();initSearchAndFilters();initEmailSubscription();initTourNotify();initMusicStoryline();initNavigation();initCartSidebar();
  try{window.currencyFunctions?.populateCurrencyDropdowns();window.currencyFunctions?.initCurrencyModal();window.currencyFunctions?.initCountrySearch();window.currencyFunctions?.initCurrencySelector();window.currencyFunctions?.detectAndApplyCurrency();}catch(e){console.error('Currency boot:',e);}
  try{window.menuFunctions?.initMenuPanel();window.menuFunctions?.initAccountSystem();}catch(e){console.error('Menu/account boot:',e);}
  // render again after the compatibility hook is installed so the sponsored rail is immediately clean.
  window.renderFunctions?.renderSponsored?.();
  console.log('Store initialized successfully.');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initApp);else initApp();
