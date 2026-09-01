"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/DataContext";
import type { Project } from "@/lib/types";
import { TaskTree } from "./TaskTree";

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr || status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function ProjectCard({ project }: { project: Project }) {
  const { items, renameProject, toggleProjectArchived, removeProject } = useData();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(project.name);

  const projectItems = useMemo(() => items.filter((i) => i.projectId === project.id), [items, project.id]);
  const total = projectItems.length;
  const done = projectItems.filter((i) => i.status === "Done").length;
  const inProgress = projectItems.filter((i) => i.status === "In Progress").length;
  const overdue = projectItems.filter((i) => isOverdue(i.date, i.status)).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) renameProject(project.id, trimmed);
    else setName(project.name);
  };

  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${project.archived ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-text-muted shrink-0" aria-label="Toggle project">
          {open ? "▾" : "▸"}
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none font-semibold"
        />
        <button
          type="button"
          onClick={() => toggleProjectArchived(project.id, !project.archived)}
          className="text-xs px-2 py-1 rounded-lg border border-border text-text-muted hover:text-text"
        >
          {project.archived ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`Delete project "${project.name}" and all its tasks?`) && removeProject(project.id)}
          className="text-xs px-2 py-1 rounded-lg text-text-muted hover:text-danger"
        >
          Delete
        </button>
      </div>

      {/* Per-project completion stats — visible even when the project is collapsed */}
      <div className="px-3 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
        <div className="flex items-center gap-2 w-full sm:w-40">
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
          </div>
          <span className="w-9 text-right font-medium text-text">{rate}%</span>
        </div>
        <span>
          {done}/{total} done
        </span>
        {inProgress > 0 && <span>{inProgress} in progress</span>}
        {overdue > 0 && <span className="text-danger font-medium">{overdue} overdue</span>}
      </div>

      {open && (
        <div className="px-3 pb-3">
          <TaskTree projectId={project.id} parentId={null} depth={0} />
        </div>
      )}
    </div>
  );
}
