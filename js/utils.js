// ============================================================
// Shared Utilities
// ============================================================
// Small, dependency-free helpers used across the app so the same
// logic (email/phone validation, downloads, product-list assembly,
// newsletter signup) lives in exactly one place.
//
// Loaded before every other app script (and before data-store.js,
// which uses combineProducts at load time), so window.utils is always
// available by the time other modules run.

(function () {
  function isValidEmail(email) {
    return typeof email === "string" && email.includes("@") && email.includes(".");
  }

  function isValidPhone(phone) {
    const cleaned = String(phone).replace(/[\s\-()]/g, "");
    return /^\+?\d{9,15}$/.test(cleaned);
  }

  // Programmatically download a URL by clicking a temporary anchor.
  // Works for direct file URLs, blob: URLs, and data: URLs (canvas exports).
  function downloadFromUrl(href, filename, { newTab = false } = {}) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename || "";
    if (newTab) a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // The full sellable catalog is always digital singles + physical CDs.
  function combineProducts(digital, cd) {
    return [...(digital || []), ...(cd || [])];
  }

  // Shared newsletter/subscribe behaviour: validate the input's email,
  // toast the outcome, and clear the field on success. Returns whether
  // the email was valid.
  function handleNewsletterSubmit(inputEl, { success = "Subscribed!", invalid = "Enter a valid email" } = {}) {
    if (!inputEl) return false;
    if (isValidEmail(inputEl.value)) {
      window.cartFunctions?.showToast(success);
      inputEl.value = "";
      return true;
    }
    window.cartFunctions?.showToast(invalid);
    return false;
  }

  window.utils = {
    isValidEmail,
    isValidPhone,
    downloadFromUrl,
    combineProducts,
    handleNewsletterSubmit
  };
})();
