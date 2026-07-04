"use client";

import { useEffect } from "react";

import { applyAppearance, storeDarkMode } from "~/types/appearance";
import { type ThemeColor } from "~/types/theme";

type ThemeApplierProps = {
  themeColor: ThemeColor;
  darkMode: boolean;
};

export function ThemeApplier({ themeColor, darkMode }: ThemeApplierProps) {
  useEffect(() => {
    document.documentElement.dataset.theme = themeColor;
    applyAppearance(darkMode);
    storeDarkMode(darkMode);
  }, [themeColor, darkMode]);

  return null;
}
