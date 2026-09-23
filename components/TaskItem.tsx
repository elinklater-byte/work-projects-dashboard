"use client";

import { useState } from "react";
import { useData } from "@/lib/DataContext";
import { STATUSES, GOAL_OPTIONS, type Item, type Status, type Goal } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function TaskItem({
  item,
  expanded = true,
  onToggleExpanded,
  childCount = 0,
}: {
  item: Item;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  childCount?: number;
}) {
  const { updateItemFields, removeItem, sendToDailyDashboard } = useData();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [preDoneStatus, setPreDoneStatus] = useState<Status | null>(null);
  const [sending, setSending] = useState(false);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== item.title) {
      updateItemFields(item.id, { title: trimmed });
    } else {
      setTitle(item.title);
    }
  };

  const handleToggleComplete = (checked: boolean) => {
    if (checked) {
      setPreDoneStatus(item.status);
      updateItemFields(item.id, { status: "Done" });
    } else {
      updateItemFields(item.id, { status: preDoneStatus ?? "Not Started" });
    }
  };

  const handleSend = async () => {
    if (item.sentToDailyDashboard || sending) return;
    setSending(true);
    await sendToDailyDashboard(item.id);
    setSending(false);
  };

  const goalLabel = GOAL_OPTIONS.find((g) => g.value === item.goal)?.label;

  return (
    <div className="group">
      <div className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg">
        {onToggleExpanded && (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="w-4 shrink-0 text-text-muted hover:text-text"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
          >
            {expanded ? "▾" : "▸"}
          </button>
        )}
        <input
          type="checkbox"
          checked={item.status === "Done"}
          onChange={(e) => handleToggleComplete(e.target.checked)}
          title="Mark complete"
          className="h-4 w-4 accent-success shrink-0"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className={`flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm ${
            item.status === "Done" ? "line-through text-text-muted" : "text-text"
          }`}
        />
        {!expanded && childCount > 0 && (
          <span className="text-xs text-text-muted whitespace-nowrap" title={`${childCount} hidden`}>
            ({childCount})
          </span>
        )}
        {item.date && (
          <span className="hidden sm:inline text-xs text-text-muted whitespace-nowrap">{item.date}</span>
        )}
        <StatusBadge status={item.status} />
        {item.goal !== "none" && (
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent whitespace-nowrap"
            title={`Goal: ${goalLabel}`}
          >
            🎯 {goalLabel}
          </span>
        )}
        {item.sentToDailyDashboard && (
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap"
            title="Sent to your Daily Dashboard app"
          >
            ↗ Sent
          </span>
        )}
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className={`text-xs px-1.5 py-1 rounded-lg border ${
            detailsOpen || item.notes ? "border-primary text-primary" : "border-border text-text-muted"
          }`}
          title="Date, status, goal, notes, and more"
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`Delete "${item.title}" and everything under it?`) && removeItem(item.id)}
          className="text-xs px-1.5 py-1 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
        >
          Delete
        </button>
      </div>

      {detailsOpen && (
        <div className="ml-6 mt-1 mb-2 p-3 rounded-lg border border-border bg-surface space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              Date
              <input
                type="date"
                value={item.date ?? ""}
                onChange={(e) => updateItemFields(item.id, { date: e.target.value || null })}
                className="text-xs border border-border rounded-lg px-1.5 py-1 bg-bg text-text"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              Status
              <select
                value={item.status}
                onChange={(e) => updateItemFields(item.id, { status: e.target.value as Status })}
                className="text-xs border border-border rounded-lg px-1.5 py-1 bg-bg text-text"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              Goal
              <select
                value={item.goal}
                onChange={(e) => updateItemFields(item.id, { goal: e.target.value as Goal })}
                className="text-xs border border-border rounded-lg px-1.5 py-1 bg-bg text-text"
              >
                {GOAL_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={item.onDashboard}
                onChange={(e) => updateItemFields(item.id, { onDashboard: e.target.checked })}
                className="h-3.5 w-3.5 accent-accent"
              />
              Pin to top (this app)
            </label>
            <label
              className={`flex items-center gap-1.5 text-xs ${
                item.sentToDailyDashboard ? "text-primary" : "text-text-muted cursor-pointer"
              }`}
              title="Creates a task in your Daily Dashboard app: category Work, priority Moderate, due date = this task's date"
            >
              <input
                type="checkbox"
                checked={item.sentToDailyDashboard}
                disabled={item.sentToDailyDashboard || sending}
                onChange={handleSend}
                className="h-3.5 w-3.5 accent-primary"
              />
              {item.sentToDailyDashboard ? "Sent to Daily Dashboard" : sending ? "Sending…" : "Send to Daily Dashboard"}
            </label>
          </div>

          <textarea
            defaultValue={item.notes}
            onBlur={(e) => updateItemFields(item.id, { notes: e.target.value })}
            placeholder="Notes..."
            rows={2}
            className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-bg text-text outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}
