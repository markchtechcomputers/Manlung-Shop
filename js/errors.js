// ============================================================
// Error Reporting + Safe Storage Helpers
// ============================================================
// Loaded before every other script. Two jobs:
//   1. Give every module one way to surface a failure: log it with a
//      context tag AND (optionally) tell the visitor what happened,
//      instead of dropping it in an empty catch block.
//   2. Wrap Web Storage, which throws in private mode / when the quota
//      is full, so a blocked storage call never takes down the feature
//      that used it — and never fails invisibly either.

(function () {
  function notify(message) {
    if (!message) return;
    const toast = window.cartFunctions?.showToast;
    if (typeof toast === "function") {
      try {
        toast(message);
        return;
      } catch (e) {
        console.error("[errors] toast failed:", e);
      }
    }
    console.warn("[notice]", message);
  }

  // The single funnel for "something went wrong". `userMessage` is shown to
  // the visitor when the failure is something they can act on or should know
  // about; the details always reach the console.
  function report(context, error, userMessage) {
    console.error(`[${context}]`, error);
    if (userMessage) notify(userMessage);
  }

  function getStore(kind) {
    try {
      return kind === "session" ? window.sessionStorage : window.localStorage;
    } catch (e) {
      report("storage:unavailable", e);
      return null;
    }
  }

  function readItem(kind, key) {
    const store = getStore(kind);
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch (e) {
      report(`storage:read:${key}`, e);
      return null;
    }
  }

  // Returns true when the value was really persisted, so callers can tell the
  // visitor their data is only in memory instead of pretending it saved.
  function writeItem(kind, key, value) {
    const store = getStore(kind);
    if (!store) return false;
    try {
      store.setItem(key, value);
      return true;
    } catch (e) {
      report(`storage:write:${key}`, e);
      return false;
    }
  }

  function removeItem(kind, key) {
    const store = getStore(kind);
    if (!store) return false;
    try {
      store.removeItem(key);
      return true;
    } catch (e) {
      report(`storage:remove:${key}`, e);
      return false;
    }
  }

  // Reads + parses JSON. Corrupt values are reported and dropped so the same
  // bad blob doesn't keep breaking the page on every load.
  function readJson(kind, key, fallback) {
    const raw = readItem(kind, key);
    if (raw === null || raw === "") return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) {
      report(`storage:parse:${key}`, e);
      removeItem(kind, key);
      return fallback;
    }
  }

  function writeJson(kind, key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      report(`storage:serialize:${key}`, e);
      return false;
    }
    return writeItem(kind, key, serialized);
  }

  // Runs one step of a multi-step init sequence. Without this, a throw in any
  // single step silently cancels every step after it.
  function safeRun(context, fn, userMessage) {
    try {
      const result = fn();
      if (result && typeof result.catch === "function") {
        result.catch(e => report(context, e, userMessage));
      }
      return true;
    } catch (e) {
      report(context, e, userMessage);
      return false;
    }
  }

  // fetch() only rejects on network failure — a 404/500 resolves, and then
  // .json() throws on the HTML error page. Turn both into one real error.
  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    try {
      return await res.json();
    } catch (e) {
      throw new Error(`Response from ${url} was not valid JSON: ${e.message}`);
    }
  }

  function requireElement(id, context) {
    const el = document.getElementById(id);
    if (!el) report(context || "dom:missing-element", new Error(`Expected element #${id} in the page`));
    return el;
  }

  // Anything that escaped every handler above still gets logged with a tag
  // rather than vanishing into a rejected promise nobody awaited.
  window.addEventListener("error", (event) => {
    console.error("[uncaught]", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[unhandled-rejection]", event.reason);
  });

  window.appErrors = {
    report,
    notify,
    safeRun,
    fetchJson,
    requireElement,
    session: {
      get: key => readItem("session", key),
      set: (key, value) => writeItem("session", key, value),
      remove: key => removeItem("session", key),
      getJson: (key, fallback) => readJson("session", key, fallback),
      setJson: (key, value) => writeJson("session", key, value)
    },
    local: {
      get: key => readItem("local", key),
      set: (key, value) => writeItem("local", key, value),
      remove: key => removeItem("local", key),
      getJson: (key, fallback) => readJson("local", key, fallback),
      setJson: (key, value) => writeJson("local", key, value)
    }
  };
})();
