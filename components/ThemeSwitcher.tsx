"use client";

import { THEMES, useTheme } from "@/lib/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          title={t.label}
          aria-label={`Switch to ${t.label} theme`}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            theme === t.id ? "border-primary scale-110" : "border-transparent hover:scale-105"
          }`}
          style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
        />
      ))}
    </div>
  );
}
