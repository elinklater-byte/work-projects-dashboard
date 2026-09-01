"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Item, Project } from "./types";

interface DataContextValue {
  projects: Project[];
  items: Item[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProject: (name: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  toggleProjectArchived: (id: string, archived: boolean) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addItem: (input: { projectId: string; parentId: string | null; title: string }) => Promise<void>;
  updateItemFields: (id: string, updates: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  sendToDailyDashboard: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load data");
      setProjects(data.projects);
      setItems(data.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProject = useCallback(async (name: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const project = await res.json();
    if (!res.ok) {
      setError(project.error);
      return;
    }
    setProjects((prev) => [...prev, project]);
  }, []);

  const renameProject = useCallback(async (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }, []);

  const toggleProjectArchived = useCallback(async (id: string, archived: boolean) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived } : p)));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
  }, []);

  const removeProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) => prev.filter((i) => i.projectId !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  }, []);

  const addItem = useCallback(
    async (input: { projectId: string; parentId: string | null; title: string }) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const item = await res.json();
      if (!res.ok) {
        setError(item.error);
        return;
      }
      setItems((prev) => [...prev, item]);
    },
    []
  );

  const updateItemFields = useCallback(async (id: string, updates: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }, []);

  const removeItem = useCallback(
    async (id: string) => {
      setItems((prev) => {
        const idsToRemove = new Set<string>([id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const it of prev) {
            if (it.parentId && idsToRemove.has(it.parentId) && !idsToRemove.has(it.id)) {
              idsToRemove.add(it.id);
              changed = true;
            }
          }
        }
        return prev.filter((i) => !idsToRemove.has(i.id));
      });
      await fetch(`/api/items/${id}`, { method: "DELETE" });
    },
    []
  );

  // Pushes a one-way copy of this task into the separate Daily Dashboard app's
  // Google Sheet (Category: Work, Priority: Moderate, Due date: the task's own date).
  // This does not delete/undo anything if unmarked later — it's a "send", not a live sync.
  const sendToDailyDashboard = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.sentToDailyDashboard) return;
      const project = projects.find((p) => p.id === item.projectId);

      const res = await fetch("/api/daily-dashboard/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          dueDate: item.date,
          notes: item.notes,
          projectName: project?.name ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send to Daily Dashboard");
        return;
      }

      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, sentToDailyDashboard: true } : i)));
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentToDailyDashboard: true }),
      });
    },
    [items, projects]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      projects,
      items,
      loading,
      error,
      refresh,
      addProject,
      renameProject,
      toggleProjectArchived,
      removeProject,
      addItem,
      updateItemFields,
      removeItem,
      sendToDailyDashboard,
    }),
    [
      projects,
      items,
      loading,
      error,
      refresh,
      addProject,
      renameProject,
      toggleProjectArchived,
      removeProject,
      addItem,
      updateItemFields,
      removeItem,
      sendToDailyDashboard,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
