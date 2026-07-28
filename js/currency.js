// ============================================================
// Currency Localization
// ============================================================
// Detects the visitor's country and displays product prices in their
// local currency for convenience. The real Paystack charge always
// happens in KES (window.SITE_CONFIG.CURRENCY) — this module only
// changes what's SHOWN on screen, never what's actually billed.

const CURRENCY_SYMBOLS = {
  KES: "KSh", TZS: "TSh", UGX: "USh", USD: "$", GBP: "£", EUR: "€",
  NGN: "₦", ZAR: "R", RWF: "FRw", GHS: "GH₵", CAD: "CA$", AUD: "A$",
  INR: "₹", JPY: "¥", CNY: "¥", AED: "AED", ETB: "Br", BRL: "R$",
  EGP: "E£", ZMW: "ZK"
};

window.currencyState = {
  code: "KES",     // detected/selected display currency
  symbol: "KSh",
  rate: 1,         // units of display currency per 1 KES
  ready: false
};

function formatPrice(kshAmount) {
  const { code, symbol, rate } = window.currencyState;
  const converted = kshAmount * rate;
  const rounded = converted >= 100 ? Math.round(converted) : Math.round(converted * 100) / 100;
  const formatted = rounded.toLocaleString(undefined, { maximumFractionDigits: rounded >= 100 ? 0 : 2 });

  if (code === "KES") return `${symbol} ${formatted}`;
  return `${symbol} ${formatted}`;
}

const CURRENCY_STORAGE_KEY = "manlungCurrency";
const RATE_API_URL = "https://open.er-api.com/v6/latest/KES";

function setCurrency(code, rate) {
  window.currencyState.code = code;
  window.currencyState.symbol = CURRENCY_SYMBOLS[code] || code;
  window.currencyState.rate = rate;
  window.currencyState.ready = true;
  // Failing to remember the choice is not worth interrupting the visitor over
  // (it's re-detected next load), but it must not stop the prices updating.
  window.appErrors.session.setJson(CURRENCY_STORAGE_KEY, window.currencyState);
  refreshDisplayedPrices();
}

// A cached state with a non-numeric rate would silently render every price as
// NaN, so treat it as absent.
function readCachedCurrency() {
  const cached = window.appErrors.session.getJson(CURRENCY_STORAGE_KEY, null);
  if (!cached || typeof cached.code !== "string" || !Number.isFinite(cached.rate) || cached.rate <= 0) {
    if (cached) {
      window.appErrors.report("currency:cache", new Error(`Ignoring unusable cached currency: ${JSON.stringify(cached)}`));
      window.appErrors.session.remove(CURRENCY_STORAGE_KEY);
    }
    return null;
  }
  return cached;
}

// Single place the KES conversion rate is fetched. Returns null on any failure
// (network, HTTP error, unknown currency) after reporting why — callers decide
// what to tell the visitor.
async function fetchRateForCurrency(code) {
  try {
    const rateData = await window.appErrors.fetchJson(RATE_API_URL);
    const rate = rateData?.rates?.[code];
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Exchange rate API returned no usable rate for ${code}`);
    }
    return rate;
  } catch (e) {
    window.appErrors.report(`currency:rate:${code}`, e);
    return null;
  }
}

// Applies the requested currency, or falls back to KES and says so.
async function applyCurrency(code) {
  if (code === "KES") {
    setCurrency("KES", 1);
    return true;
  }
  const rate = await fetchRateForCurrency(code);
  if (rate === null) {
    window.appErrors.notify(`Couldn't get the ${code} exchange rate — showing prices in KES`);
    setCurrency("KES", 1);
    return false;
  }
  setCurrency(code, rate);
  return true;
}

function refreshDisplayedPrices() {
  // Re-render anything that shows a price, using the new currency
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
  // 1. Use a cached choice from this session if present (manual pick or prior detection)
  const cached = readCachedCurrency();
  if (cached) {
    window.currencyState = cached;
    refreshDisplayedPrices();
    return;
  }

  // 2. Detect visitor's country/currency. Detection is a convenience, so a
  // failure here stays in the console rather than nagging the visitor — but it
  // is no longer indistinguishable from "this visitor is in Kenya".
  let detectedCode = "KES";
  try {
    const geo = await window.appErrors.fetchJson("https://ipapi.co/json/");
    detectedCode = geo.currency || "KES";
  } catch (e) {
    window.appErrors.report("currency:geo-detect", e);
    setCurrency("KES", 1);
    return;
  }

  // 3. Convert to the detected currency, falling back to KES if the rate
  // lookup fails (reported inside fetchRateForCurrency).
  if (detectedCode === "KES") {
    setCurrency("KES", 1);
    return;
  }
  const rate = await fetchRateForCurrency(detectedCode);
  setCurrency(rate === null ? "KES" : detectedCode, rate === null ? 1 : rate);
}

function populateCurrencyDropdowns() {
  const list = window.COUNTRY_CURRENCY_LIST || [];
  const optionsHtml = list.map(c => `<option value="${c.code}">${c.flag} ${c.country} — ${c.code}</option>`).join("");

  const navSelect = document.getElementById("currencySelector");
  if (navSelect) navSelect.innerHTML = optionsHtml;

  const modalSelect = document.getElementById("currencyModalSelect");
  if (modalSelect) modalSelect.innerHTML = optionsHtml;
}

function initCountrySearch() {
  const input = document.getElementById("countrySearchInput");
  const results = document.getElementById("countrySearchResults");
  if (!input || !results) return;

  const list = window.COUNTRY_CURRENCY_LIST || [];

  function render(filter) {
    const q = filter.trim().toLowerCase();
    const matches = q ? list.filter(c => c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) : list;
    results.innerHTML = matches.slice(0, 8).map(c => `
      <div class="country-result" data-code="${c.code}">
        <span>${c.flag} ${c.country}</span><span class="country-result-code">${c.code}</span>
      </div>
    `).join("") || `<div class="country-result-empty">No matches</div>`;

    results.querySelectorAll(".country-result").forEach(el => {
      el.addEventListener("click", async () => {
        const code = el.dataset.code;
        const applied = await applyCurrency(code);
        // Only claim the currency changed when it really did.
        if (applied) window.cartFunctions?.showToast(`Currency set to ${code}`);
      });
    });
  }

  input.addEventListener("input", () => render(input.value));
  render("");
}

function initCurrencySelector() {
  const select = document.getElementById("currencySelector");
  if (!select) return;

  select.addEventListener("change", () => {
    applyCurrency(select.value);
  });
}

function initCurrencyModal() {
  const modal = document.getElementById("currencyModal");
  if (!modal) return;

  // Already chosen this session? Skip the modal entirely.
  if (readCachedCurrency()) {
    modal.style.display = "none";
    return;
  }

  const select = window.appErrors.requireElement("currencyModalSelect", "currency:modal");
  const btn = window.appErrors.requireElement("currencyModalContinue", "currency:modal");
  if (!select || !btn) {
    modal.style.display = "none";
    return;
  }

  // If IP-based detection finishes while the modal is still open, reflect it
  const syncSelectIfOpen = () => {
    if (modal.style.display !== "none" && CURRENCY_SYMBOLS[window.currencyState.code]) {
      select.value = window.currencyState.code;
    }
  };
  const checkInterval = setInterval(syncSelectIfOpen, 300);

  btn.addEventListener("click", async () => {
    clearInterval(checkInterval);
    await applyCurrency(select.value);
    modal.style.display = "none";
  });
}

window.currencyFunctions = {
  formatPrice,
  setCurrency,
  applyCurrency,
  refreshDisplayedPrices,
  detectAndApplyCurrency,
  initCurrencySelector,
  initCurrencyModal,
  populateCurrencyDropdowns,
  initCountrySearch
};
