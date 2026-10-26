// Theme Light/Dark — persist di localStorage.
// Tidak butuh login ulang untuk ganti theme.

export type Theme = "light" | "dark";

const STORAGE_KEY = "pos-theme";

export function getInitialTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) ===
      "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // abaikan jika storage tidak tersedia
  }
}

// Transisi smooth & cepat saat theme berganti.
export function animateThemeSwitch() {
  const root = document.documentElement;

  root.classList.add("theme-anim");

  window.setTimeout(() => {
    root.classList.remove("theme-anim");
  }, 250);
}
