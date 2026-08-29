"use client";

import { ThemeSwitcher } from "./ThemeSwitcher";
import { Toggle } from "./ui/Toggle";

export function Header({
  focusMode,
  setFocusMode,
}: {
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-secondary">Work Projects</h1>
        <div className="flex items-center gap-4">
          <Toggle checked={focusMode} onChange={setFocusMode} label="Off-work view" />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
