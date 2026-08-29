"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/DataContext";
import { ProjectCard } from "./ProjectCard";
import { Toggle } from "./ui/Toggle";

export function ProjectList() {
  const { projects, addProject } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const [newName, setNewName] = useState("");

  const visible = useMemo(
    () => projects.filter((p) => showArchived || !p.archived).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [projects, showArchived]
  );

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    await addProject(name);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-secondary">Projects</h2>
        <Toggle checked={showArchived} onChange={setShowArchived} label="Show archived" />
      </div>
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New project name..."
          className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-surface outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90"
        >
          Add Project
        </button>
      </div>
      <div className="space-y-3">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        {visible.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted">
            No projects yet. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
