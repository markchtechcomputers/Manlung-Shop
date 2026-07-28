// ============================================================
// Security helpers — HTML escaping, URL sanitising, password hashing
// ============================================================
// Loaded before every other script. Product data can come from the cloud
// (Supabase) or another device's localStorage, so it is untrusted input and
// must be escaped before it is put into innerHTML.

(function () {
  const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  };

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"'`]/g, ch => HTML_ESCAPES[ch]);
  }

  // Only http(s), protocol-relative and same-origin relative URLs are allowed,
  // so a "javascript:" or "data:text/html" URL saved into a product can't run.
  function safeUrl(value) {
    if (value === null || value === undefined) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      if (!/^https?:/i.test(raw)) return "";
      return raw;
    }
    if (raw.startsWith("//") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return raw;
    if (/^[\w./-]+$/.test(raw)) return raw;
    return "";
  }

  // Escaped URL, ready to drop into an href/src attribute.
  function safeUrlAttr(value) {
    return escapeHtml(safeUrl(value));
  }

  function toHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  const PBKDF2_ITERATIONS = 150000;

  function cryptoAvailable() {
    return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  }

  function randomSaltHex(bytes = 16) {
    const salt = new Uint8Array(bytes);
    window.crypto.getRandomValues(salt);
    return toHex(salt);
  }

  // Returns { salt, iterations, hash } — safe to store/commit; the password
  // itself is never written down anywhere.
  async function hashPassword(password, saltHex, iterations) {
    const salt = saltHex ? fromHex(saltHex) : fromHex(randomSaltHex());
    const rounds = iterations || PBKDF2_ITERATIONS;
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: rounds, hash: "SHA-256" },
      key,
      256
    );
    return { salt: toHex(salt), iterations: rounds, hash: toHex(bits) };
  }

  // Constant-time-ish comparison so a wrong password can't be found byte by byte.
  function timingSafeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  async function verifyPassword(password, record) {
    if (!record || !record.salt || !record.hash) return false;
    const candidate = await hashPassword(password, record.salt, record.iterations);
    return timingSafeEqual(candidate.hash, record.hash);
  }

  window.security = {
    escapeHtml,
    escapeAttr: escapeHtml,
    safeUrl,
    safeUrlAttr,
    cryptoAvailable,
    randomSaltHex,
    hashPassword,
    verifyPassword,
    PBKDF2_ITERATIONS
  };
})();
