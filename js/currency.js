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

function setCurrency(code, rate) {
  window.currencyState.code = code;
  window.currencyState.symbol = CURRENCY_SYMBOLS[code] || code;
  window.currencyState.rate = rate;
  window.currencyState.ready = true;
  sessionStorage.setItem("manlungCurrency", JSON.stringify(window.currencyState));
  refreshDisplayedPrices();
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
  const cached = sessionStorage.getItem("manlungCurrency");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      window.currencyState = parsed;
      refreshDisplayedPrices();
      return;
    } catch (e) { /* fall through to re-detect */ }
  }

  try {
    // 2. Detect visitor's country/currency
    const geoRes = await fetch("https://ipapi.co/json/");
    const geo = await geoRes.json();
    const detectedCode = geo.currency || "KES";

    if (detectedCode === "KES") {
      setCurrency("KES", 1);
      return;
    }

    // 3. Get conversion rate from KES to the detected currency
    const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
    const rateData = await rateRes.json();
    const rate = rateData?.rates?.[detectedCode];

    if (rate) {
      setCurrency(detectedCode, rate);
    } else {
      setCurrency("KES", 1);
    }
  } catch (err) {
    // Offline, blocked, or rate-limited — just stick with KES
    setCurrency("KES", 1);
  }
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
        if (code === "KES") {
          setCurrency("KES", 1);
        } else {
          try {
            const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
            const rateData = await rateRes.json();
            setCurrency(code, rateData?.rates?.[code] || 1);
          } catch (e) {
            setCurrency("KES", 1);
          }
        }
        window.cartFunctions?.showToast(`Currency set to ${code}`);
      });
    });
  }

  input.addEventListener("input", () => render(input.value));
  render("");
}

function initCurrencySelector() {
  const select = document.getElementById("currencySelector");
  if (!select) return;

  select.addEventListener("change", async () => {
    const code = select.value;
    if (code === "KES") { setCurrency("KES", 1); return; }

    try {
      const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
      const rateData = await rateRes.json();
      const rate = rateData?.rates?.[code];
      setCurrency(code, rate || 1);
    } catch (e) {
      window.cartFunctions?.showToast("Couldn't fetch exchange rate, showing KES");
      setCurrency("KES", 1);
    }
  });
}

function initCurrencyModal() {
  const modal = document.getElementById("currencyModal");
  if (!modal) return;

  // Already chosen this session? Skip the modal entirely.
  if (sessionStorage.getItem("manlungCurrency")) {
    modal.style.display = "none";
    return;
  }

  const select = document.getElementById("currencyModalSelect");
  const btn = document.getElementById("currencyModalContinue");

  // If IP-based detection finishes while the modal is still open, reflect it
  const originalSetCurrency = setCurrency;
  const syncSelectIfOpen = () => {
    if (modal.style.display !== "none" && CURRENCY_SYMBOLS[window.currencyState.code]) {
      select.value = window.currencyState.code;
    }
  };
  const checkInterval = setInterval(syncSelectIfOpen, 300);

  btn.addEventListener("click", async () => {
    clearInterval(checkInterval);
    const choice = select.value;

    if (choice === "KES") {
      setCurrency("KES", 1);
    } else {
      try {
        const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
        const rateData = await rateRes.json();
        const rate = rateData?.rates?.[choice];
        setCurrency(choice, rate || 1);
      } catch (e) {
        setCurrency("KES", 1);
      }
    }

    modal.style.display = "none";
  });
}

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
