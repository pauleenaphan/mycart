export const THEME_COLORS = ["pink", "green", "blue", "purple"] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

export const THEME_OPTIONS: Array<{
  id: ThemeColor;
  label: string;
  swatch: string;
}> = [
  { id: "pink", label: "Pink", swatch: "#db2777" },
  { id: "green", label: "Green", swatch: "#059669" },
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "purple", label: "Purple", swatch: "#9333ea" },
];

export function isThemeColor(value: string): value is ThemeColor {
  return THEME_COLORS.includes(value as ThemeColor);
}
