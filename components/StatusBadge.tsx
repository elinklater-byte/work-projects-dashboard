import type { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  "Not Started": "bg-border/60 text-text-muted",
  "In Progress": "bg-primary/15 text-primary",
  Blocked: "bg-danger/15 text-danger",
  Done: "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STYLES[status]}`}>
      {status}
    </span>
  );
}
