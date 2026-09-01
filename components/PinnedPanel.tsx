"use client";

import { useMemo } from "react";
import { useData } from "@/lib/DataContext";
import { StatusBadge } from "./StatusBadge";
import { STATUSES, type Status } from "@/lib/types";

export function PinnedPanel() {
  const { items, projects, updateItemFields } = useData();

  const flagged = useMemo(() => {
    return [...items]
      .filter((i) => i.onDashboard)
      .sort((a, b) => {
        if (a.date && b.date) return a.date.localeCompare(b.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [items]);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Unknown project";

  if (flagged.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted">
        Nothing pinned yet. Open a task's "Details" panel and check "Pin to top" to see it here.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl divide-y divide-border">
      {flagged.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-3 p-3">
          <input
            type="checkbox"
            checked={item.status === "Done"}
            onChange={(e) => updateItemFields(item.id, { status: e.target.checked ? "Done" : "In Progress" })}
            className="h-5 w-5 accent-primary shrink-0"
            title="Mark done"
          />
          <div className="flex-1 min-w-[140px]">
            <div className={`font-medium truncate ${item.status === "Done" ? "line-through text-text-muted" : ""}`}>
              {item.title}
            </div>
            <div className="text-xs text-text-muted truncate">{projectName(item.projectId)}</div>
          </div>
          {item.date && <span className="text-xs text-text-muted whitespace-nowrap">{item.date}</span>}
          <select
            value={item.status}
            onChange={(e) => updateItemFields(item.id, { status: e.target.value as Status })}
            className="hidden sm:block text-xs border border-border rounded-lg px-2 py-1 bg-bg"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <StatusBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}
