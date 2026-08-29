"use client";

import { ReactNode } from "react";
import { DataProvider } from "@/lib/DataContext";
import { ThemeProvider } from "@/lib/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>{children}</DataProvider>
    </ThemeProvider>
  );
}
