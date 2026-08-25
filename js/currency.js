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
  EGP: "E£", ZMW: "ZK", PLN: "zł", SEK: "kr", NOK: "kr", DKK: "kr",
  CHF: "CHF", NZD: "NZ$", PKR: "Rs", BDT: "৳", SAR: "SR", QAR: "QR",
  KWD: "KD", ILS: "₪", TRY: "₺", KRW: "₩", SGD: "S$", MYR: "RM",
  THB: "฿", IDR: "Rp", PHP: "₱", VND: "₫", HKD: "HK$", MXN: "MX$",
  ARS: "AR$", COP: "COL$", CLP: "CLP$", PEN: "S/", MAD: "DH", DZD: "DA",
  TND: "DT", MWK: "MK", MZN: "MT", BWP: "P", NAD: "N$", XOF: "CFA",
  XAF: "FCFA", CDF: "FC", SDG: "SDG", SOS: "Sh", SSP: "SSP", BIF: "FBu",
  RUB: "₽", UAH: "₴", CZK: "Kč", HUF: "Ft", RON: "lei", ISK: "kr",
  LKR: "Rs", NPR: "Rs", JMD: "J$", TTD: "TT$"
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

  // Save permanently
  localStorage.setItem(
    "manlungCurrency",
    JSON.stringify(window.currencyState)
  );

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
  // Use saved customer choice
  const saved = localStorage.getItem("manlungCurrency");

  if (saved) {
    try {
      window.currencyState = JSON.parse(saved);
      refreshDisplayedPrices();
      return;
    } catch (e) {}
  }

  // No automatic country selection.
  // Wait for customer to choose.
  setCurrency("KES", 1);
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

  const saved = localStorage.getItem("manlungCurrency");

  // Customer already selected before
  if (saved) {
    modal.style.display = "none";
    return;
  }

  modal.style.display = "flex";

  const select = document.getElementById("currencyModalSelect");
  const btn = document.getElementById("currencyModalContinue");

  btn.addEventListener("click", async () => {
    const choice = select.value;

    if (!choice) {
      window.cartFunctions?.showToast(
        "Please choose your country first"
      );
      return;
    }

    if (choice === "KES") {
      setCurrency("KES", 1);
    } else {
      try {
        const rateRes = await fetch(
          "https://open.er-api.com/v6/latest/KES"
        );
        const rateData = await rateRes.json();
        const rate = rateData?.rates?.[choice] || 1;
        setCurrency(choice, rate);
      } catch(e) {
        setCurrency(choice, 1);
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
