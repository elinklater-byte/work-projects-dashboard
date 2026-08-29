export type Status = "Not Started" | "In Progress" | "Blocked" | "Done";

export const STATUSES: Status[] = ["Not Started", "In Progress", "Blocked", "Done"];

export interface Project {
  id: string;
  name: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  date: string | null;
  notes: string;
  status: Status;
  onDashboard: boolean;
  createdAt: string;
  updatedAt: string;
}
