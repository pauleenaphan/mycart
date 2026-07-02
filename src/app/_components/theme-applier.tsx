"use client";

import { useEffect } from "react";

import { type ThemeColor } from "~/types/theme";

export function ThemeApplier({ themeColor }: { themeColor: ThemeColor }) {
  useEffect(() => {
    document.documentElement.dataset.theme = themeColor;
    document.body.style.backgroundColor = "var(--color-canvas)";
  }, [themeColor]);

  return null;
}
