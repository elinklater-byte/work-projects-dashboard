export type Status = "Not Started" | "In Progress" | "Blocked" | "Done";

export const STATUSES: Status[] = ["Not Started", "In Progress", "Blocked", "Done"];

export type Goal = "none" | "today" | "week" | "month" | "twoMonths";

export const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "none", label: "None" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "twoMonths", label: "Next 2 Months" },
];

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
  goal: Goal;
  sentToDailyDashboard: boolean;
  createdAt: string;
  updatedAt: string;
}
