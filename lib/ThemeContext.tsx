"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "berry" | "ocean" | "sunset" | "forest" | "midnight";

export const THEMES: { id: ThemeName; label: string; swatch: [string, string] }[] = [
  { id: "berry", label: "Berry & Plum", swatch: ["#9d174d", "#ec4899"] },
  { id: "ocean", label: "Ocean & Slate", swatch: ["#0f766e", "#1e293b"] },
  { id: "sunset", label: "Sunset", swatch: ["#ea580c", "#9f1239"] },
  { id: "forest", label: "Forest", swatch: ["#3f6212", "#65a30d"] },
  { id: "midnight", label: "Midnight", swatch: ["#818cf8", "#a78bfa"] },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("berry");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeName | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
