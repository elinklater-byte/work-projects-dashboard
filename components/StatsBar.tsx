"use client";

import { useMemo } from "react";
import { useData } from "@/lib/DataContext";

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr || status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function StatsBar() {
  const { items, projects } = useData();

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.archived).length;
    const total = items.length;
    const done = items.filter((i) => i.status === "Done").length;
    const inProgress = items.filter((i) => i.status === "In Progress").length;
    const overdue = items.filter((i) => isOverdue(i.date, i.status)).length;
    const onDashboard = items.filter((i) => i.onDashboard).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { activeProjects, rate, done, inProgress, overdue, onDashboard };
  }, [items, projects]);

  const cards: { label: string; value: string | number; danger?: boolean }[] = [
    { label: "Active Projects", value: stats.activeProjects },
    { label: "Completion", value: `${stats.rate}%` },
    { label: "Done", value: stats.done },
    { label: "In Progress", value: stats.inProgress },
    { label: "Overdue", value: stats.overdue, danger: stats.overdue > 0 },
    { label: "On Dashboard", value: stats.onDashboard },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-surface border border-border rounded-xl p-3">
          <div className={`text-2xl font-bold ${c.danger ? "text-danger" : "text-primary"}`}>{c.value}</div>
          <div className="text-xs text-text-muted mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
