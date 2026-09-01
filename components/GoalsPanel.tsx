"use client";

import { useMemo } from "react";
import { useData } from "@/lib/DataContext";
import { GOAL_OPTIONS, type Goal, type Item } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

const COLUMNS: Goal[] = ["today", "week", "month", "twoMonths"];

export function GoalsPanel() {
  const { items, projects, updateItemFields } = useData();

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Unknown project";

  const grouped = useMemo(() => {
    const map: Record<Goal, Item[]> = { none: [], today: [], week: [], month: [], twoMonths: [] };
    for (const item of items) {
      if (item.goal !== "none") map[item.goal].push(item);
    }
    const byDate = (a: Item, b: Item) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    };
    for (const key of COLUMNS) map[key].sort(byDate);
    return map;
  }, [items]);

  const hasAny = COLUMNS.some((c) => grouped[c].length > 0);

  return (
    <div>
      <h2 className="text-base font-semibold text-secondary mb-3">Goals</h2>
      {!hasAny ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted">
          No goals set yet. Open a task's "Details" panel and pick a timeframe under Goal to see it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLUMNS.map((col) => (
            <div key={col} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-border font-medium text-sm text-secondary">
                {GOAL_OPTIONS.find((g) => g.value === col)?.label}
                <span className="ml-1.5 text-xs text-text-muted font-normal">({grouped[col].length})</span>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {grouped[col].length === 0 ? (
                  <div className="p-3 text-xs text-text-muted">Nothing here yet.</div>
                ) : (
                  grouped[col].map((item) => (
                    <div key={item.id} className="flex items-start gap-2 p-2.5">
                      <input
                        type="checkbox"
                        checked={item.status === "Done"}
                        onChange={(e) =>
                          updateItemFields(item.id, { status: e.target.checked ? "Done" : "In Progress" })
                        }
                        className="h-4 w-4 accent-success shrink-0 mt-0.5"
                        title="Mark complete"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm truncate ${
                            item.status === "Done" ? "line-through text-text-muted" : ""
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {projectName(item.projectId)}
                          {item.date ? ` · ${item.date}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
