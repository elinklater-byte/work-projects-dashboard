"use client";

import { useEffect, useState } from "react";
import { useData } from "@/lib/DataContext";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { PinnedPanel } from "@/components/PinnedPanel";
import { GoalsPanel } from "@/components/GoalsPanel";
import { ProjectList } from "@/components/ProjectList";

export default function Home() {
  const { loading, error } = useData();
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("focusMode");
    if (stored) setFocusMode(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("focusMode", String(focusMode));
  }, [focusMode]);

  return (
    <div className="min-h-screen bg-bg">
      <Header focusMode={focusMode} setFocusMode={setFocusMode} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-danger/10 border border-danger text-danger text-sm rounded-xl p-4">
            {error}. Double check your Google Sheets environment variables and that the sheet is shared with your
            service account email.
          </div>
        )}

        {loading ? (
          <div className="text-center text-text-muted py-12">Loading your data...</div>
        ) : (
          <>
            <StatsBar />
            <div>
              <h2 className="text-base font-semibold text-secondary mb-3">Pinned Tasks</h2>
              <PinnedPanel />
            </div>
            <GoalsPanel />
            {!focusMode && <ProjectList />}
          </>
        )}
      </main>
    </div>
  );
}
