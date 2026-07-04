export const APPEARANCE_STORAGE_KEY = "mycart-dark-mode";

export function readStoredDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(APPEARANCE_STORAGE_KEY) === "true";
}

export function storeDarkMode(darkMode: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPEARANCE_STORAGE_KEY, darkMode ? "true" : "false");
}

export function applyAppearance(darkMode: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.appearance = darkMode ? "dark" : "light";
  document.body.style.backgroundColor = "var(--color-canvas)";
}
