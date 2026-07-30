// ============================================================
// Currency Localization
// ============================================================
// Detects the visitor's country and displays product prices in their
// local currency for convenience. The real Paystack charge always
// happens in KES (window.SITE_CONFIG.CURRENCY) — this module only
// changes what's SHOWN on screen, never what's actually billed.
//
// The user's choice is remembered across sessions in localStorage
// and can be changed anytime from the nav currency selector.

const CURRENCY_SYMBOLS = {
  KES: "KSh", TZS: "TSh", UGX: "USh", USD: "$", GBP: "£", EUR: "€",
  NGN: "₦", ZAR: "R", RWF: "FRw", GHS: "GH₵", CAD: "CA$", AUD: "A$",
  INR: "₹", JPY: "¥", CNY: "¥", AED: "AED", ETB: "Br", BRL: "R$",
  EGP: "E£", ZMW: "ZK"
};

const STORAGE_KEY = "manlungCurrency";

window.currencyState = {
  code: "KES",
  symbol: "KSh",
  rate: 1,
  ready: false
};

function formatPrice(kshAmount) {
  const { symbol, rate } = window.currencyState;
  const converted = kshAmount * rate;
  const rounded = converted >= 100 ? Math.round(converted) : Math.round(converted * 100) / 100;
  const formatted = rounded.toLocaleString(undefined, { maximumFractionDigits: rounded >= 100 ? 0 : 2 });
  return `${symbol} ${formatted}`;
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.currencyState));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(window.currencyState));
  } catch (e) { /* storage may be unavailable */ }
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function setCurrency(code, rate) {
  window.currencyState.code = code;
  window.currencyState.symbol = CURRENCY_SYMBOLS[code] || code;
  window.currencyState.rate = rate;
  window.currencyState.ready = true;
  persistState();
  refreshDisplayedPrices();
}

async function applyCurrencyChoice(code) {
  if (code === "KES") { setCurrency("KES", 1); return; }
  try {
    const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
    const rateData = await rateRes.json();
    const rate = rateData?.rates?.[code];
    setCurrency(code, rate || 1);
  } catch (e) {
    setCurrency("KES", 1);
  }
}

function refreshDisplayedPrices() {
  if (window.renderFunctions) {
    window.renderFunctions.renderProducts();
    window.renderFunctions.renderMerch();
  }
  if (window.cartFunctions) window.cartFunctions.renderCartUI();
  updateCurrencyBadge();
}

function updateCurrencyBadge() {
  const select = document.getElementById("currencySelector");
  if (select) select.value = window.currencyState.code;
}

async function detectAndApplyCurrency() {
  const cached = readStoredState();
  if (cached && cached.code) {
    window.currencyState = cached;
    refreshDisplayedPrices();
    return;
  }
  try {
    const geoRes = await fetch("https://ipapi.co/json/");
    const geo = await geoRes.json();
    const detectedCode = geo.currency || "KES";
    if (detectedCode === "KES") { setCurrency("KES", 1); return; }
    const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
    const rateData = await rateRes.json();
    const rate = rateData?.rates?.[detectedCode];
    setCurrency(rate ? detectedCode : "KES", rate || 1);
  } catch (err) {
    setCurrency("KES", 1);
  }
}

function populateCurrencyDropdowns() {
  const list = window.COUNTRY_CURRENCY_LIST || [];
  const optionsHtml = list.map(c => `<option value="${c.code}">${c.flag} ${c.country} — ${c.code}</option>`).join("");
  const navSelect = document.getElementById("currencySelector");
  if (navSelect) navSelect.innerHTML = optionsHtml;
  const hiddenSelect = document.getElementById("currencyModalSelect");
  if (hiddenSelect) hiddenSelect.innerHTML = optionsHtml;
}

function initCurrencySelector() {
  const select = document.getElementById("currencySelector");
  if (!select) return;
  select.addEventListener("change", async () => {
    const code = select.value;
    await applyCurrencyChoice(code);
    window.cartFunctions?.showToast(`Prices now in ${code}`);
  });
}

// ------- New classy modal with searchable, scrollable country list -------
function initCurrencyModal() {
  const modal = document.getElementById("currencyModal");
  if (!modal) return;

  // Already chosen? Skip. Persisted across sessions via localStorage.
  if (readStoredState()) {
    modal.style.display = "none";
    return;
  }

  const searchInput = document.getElementById("currencyModalSearch");
  const listEl = document.getElementById("currencyModalList");
  const btn = document.getElementById("currencyModalContinue");
  const list = window.COUNTRY_CURRENCY_LIST || [];
  let selectedCode = null;

  function renderList(filter) {
    const q = (filter || "").trim().toLowerCase();
    const matches = q
      ? list.filter(c =>
          c.country.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q))
      : list;
    if (!matches.length) {
      listEl.innerHTML = `<div class="currency-option-empty">No matches for "${q}"</div>`;
      return;
    }
    listEl.innerHTML = matches.map(c => `
      <div class="currency-option ${c.code === selectedCode ? 'selected' : ''}" role="option" data-code="${c.code}" tabindex="0">
        <span class="co-flag">${c.flag}</span>
        <span class="co-name">${c.country}</span>
        <span class="co-code">${c.code}</span>
      </div>
    `).join("");
    listEl.querySelectorAll(".currency-option").forEach(el => {
      el.addEventListener("click", () => selectCode(el.dataset.code));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCode(el.dataset.code); }
      });
    });
  }

  function selectCode(code) {
    selectedCode = code;
    listEl.querySelectorAll(".currency-option").forEach(el => {
      el.classList.toggle("selected", el.dataset.code === code);
    });
    btn.disabled = false;
  }

  searchInput?.addEventListener("input", () => renderList(searchInput.value));
  renderList("");

  btn.addEventListener("click", async () => {
    if (!selectedCode) return;
    btn.disabled = true;
    btn.textContent = "Setting up…";
    await applyCurrencyChoice(selectedCode);
    modal.style.display = "none";
  });
}

// Kept for backwards compatibility with any older code that referenced it.
function initCountrySearch() { /* no-op — modal now has built-in search */ }

window.currencyFunctions = {
  formatPrice,
  setCurrency,
  refreshDisplayedPrices,
  detectAndApplyCurrency,
  initCurrencySelector,
  initCurrencyModal,
  populateCurrencyDropdowns,
  initCountrySearch
};
