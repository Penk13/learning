/* Learning site shell: theme toggle (remembered in localStorage),
 * reading progress line and auto-hiding top bar. */
(() => {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "learning:theme";

  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: theme just won't persist */ }
  };

  /* ---------- theme ---------- */
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : dark.matches);
  const paintThemeColor = () => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.append(meta);
    }
    meta.content = getComputedStyle(document.body).backgroundColor;
  };
  const themeChanged = () => {
    paintThemeColor();
    window.dispatchEvent(new Event("themechange"));
  };
  dark.addEventListener("change", () => { if (!root.dataset.theme) themeChanged(); });

  document.querySelectorAll("[data-sx-theme]").forEach((btn) => btn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    // Matching the system again means "follow the system" from now on.
    if ((next === "dark") === dark.matches) {
      delete root.dataset.theme;
      try { localStorage.removeItem(THEME_KEY); } catch { /* ignore */ }
    } else {
      root.dataset.theme = next;
      save(THEME_KEY, next);
    }
    themeChanged();
  }));

  /* ---------- top bar: reading progress + hide on scroll down ---------- */
  const bar = document.querySelector(".sx-bar");
  const progress = document.querySelector(".sx-progress span");
  if (bar) {
    let lastY = window.scrollY, ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (Math.abs(y - lastY) > 6) {
        bar.classList.toggle("sx-hidden", y > lastY && y > 160);
        lastY = y;
      }
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    bar.addEventListener("focusin", () => bar.classList.remove("sx-hidden"));
    update();
  }

  paintThemeColor();
})();
