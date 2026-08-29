"use client";

import { useState } from "react";
import { useData } from "@/lib/DataContext";
import { TaskItem } from "./TaskItem";

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
        <div key={item.id} className="py-0.5">
          <TaskItem item={item} />
          <TaskTree projectId={projectId} parentId={item.id} depth={depth + 1} />
        </div>
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
