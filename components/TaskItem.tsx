"use client";

import { useState } from "react";
import { useData } from "@/lib/DataContext";
import { STATUSES, type Item, type Status } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function TaskItem({ item }: { item: Item }) {
  const { updateItemFields, removeItem } = useData();
  const [notesOpen, setNotesOpen] = useState(false);
  const [title, setTitle] = useState(item.title);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== item.title) {
      updateItemFields(item.id, { title: trimmed });
    } else {
      setTitle(item.title);
    }
  };

  return (
    <div className="group">
      <div className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg">
        <input
          type="checkbox"
          checked={item.onDashboard}
          onChange={(e) => updateItemFields(item.id, { onDashboard: e.target.checked })}
          title="Show on Daily Dashboard"
          className="h-4 w-4 accent-accent shrink-0"
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
        <input
          type="date"
          value={item.date ?? ""}
          onChange={(e) => updateItemFields(item.id, { date: e.target.value || null })}
          className="text-xs border border-border rounded-lg px-1.5 py-1 bg-surface text-text-muted"
        />
        <select
          value={item.status}
          onChange={(e) => updateItemFields(item.id, { status: e.target.value as Status })}
          className="text-xs border border-border rounded-lg px-1.5 py-1 bg-surface"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <StatusBadge status={item.status} />
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className={`text-xs px-1.5 py-1 rounded-lg border ${
            item.notes ? "border-primary text-primary" : "border-border text-text-muted"
          }`}
          title="Notes"
        >
          Notes
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`Delete "${item.title}" and everything under it?`) && removeItem(item.id)}
          className="text-xs px-1.5 py-1 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
        >
          Delete
        </button>
      </div>
      {notesOpen && (
        <textarea
          defaultValue={item.notes}
          onBlur={(e) => updateItemFields(item.id, { notes: e.target.value })}
          placeholder="Notes..."
          rows={2}
          className="w-full text-sm border border-border rounded-lg px-2 py-1.5 mt-1 bg-surface outline-none focus:border-primary"
        />
      )}
    </div>
  );
}
