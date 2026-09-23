"use client";

import { useEffect, useState } from "react";
import { useData } from "@/lib/DataContext";
import type { Item } from "@/lib/types";
import { TaskItem } from "./TaskItem";

// Remembers which tasks/subtasks are collapsed, per browser, across refreshes.
const COLLAPSED_KEY = "wpd:collapsed-items";

function readCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function useExpanded(id: string) {
  const [expanded, setExpandedState] = useState(true);

  // Read after mount so server and client render the same markup.
  useEffect(() => {
    setExpandedState(!readCollapsed().has(id));
  }, [id]);

  const setExpanded = (value: boolean) => {
    setExpandedState(value);
    try {
      const collapsed = readCollapsed();
      if (value) collapsed.delete(id);
      else collapsed.add(id);
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(collapsed)));
    } catch {
      /* storage unavailable — state still works for this session */
    }
  };

  return [expanded, setExpanded] as const;
}

function TaskNode({ item, projectId, depth }: { item: Item; projectId: string; depth: number }) {
  const { items } = useData();
  const [expanded, setExpanded] = useExpanded(item.id);
  const childCount = items.filter((i) => i.parentId === item.id).length;

  return (
    <div className="py-0.5">
      <TaskItem
        item={item}
        expanded={expanded}
        onToggleExpanded={() => setExpanded(!expanded)}
        childCount={childCount}
      />
      {expanded && <TaskTree projectId={projectId} parentId={item.id} depth={depth + 1} />}
    </div>
  );
}

export function TaskTree({
  projectId,
  parentId,
  depth,
}: {
  projectId: string;
  parentId: string | null;
  depth: number;
}) {
  const { items, addItem } = useData();
  const [newTitle, setNewTitle] = useState("");

  const children = items
    .filter((i) => i.projectId === projectId && i.parentId === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const label = depth === 0 ? "task" : depth === 1 ? "subtask" : "sub-subtask";

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    await addItem({ projectId, parentId, title });
  };

  return (
    <div className={depth > 0 ? "pl-5 border-l border-border ml-2" : ""}>
      {children.map((item) => (
        <TaskNode key={item.id} item={item} projectId={projectId} depth={depth} />
      ))}
      <div className="flex items-center gap-2 py-1 pl-1">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          onBlur={handleAdd}
          placeholder={`+ Add ${label}`}
          className="text-sm bg-transparent border-none outline-none text-text-muted placeholder:text-text-muted focus:text-text w-full py-1"
        />
      </div>
    </div>
  );
}
