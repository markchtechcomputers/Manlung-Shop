(() => {
  const KEY = "manlung-theme";
  const root = document.documentElement;
  const button = () => document.getElementById("themeToggle");

  function apply(theme, persist = true) {
    root.setAttribute("data-theme", theme);
    if (persist) localStorage.setItem(KEY, theme);
    const b = button();
    if (b) {
      const dark = theme === "dark";
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      b.title = dark ? "Switch to light mode" : "Switch to dark mode";
      const icon = b.querySelector(".theme-icon");
      const label = b.querySelector(".theme-label");
      if (icon) icon.textContent = dark ? "☀" : "☾";
      if (label) label.textContent = dark ? "Light" : "Dark";
    }
  }

  const saved = localStorage.getItem(KEY);
  apply(saved === "dark" ? "dark" : "light", false);
  document.addEventListener("DOMContentLoaded", () => {
    const b = button();
    if (!b || b.dataset.bound) return;
    b.dataset.bound = "1";
    b.addEventListener("click", () => apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));
    apply(root.getAttribute("data-theme") || "light", false);
  });
})();
