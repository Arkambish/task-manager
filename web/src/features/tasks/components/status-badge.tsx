import { Circle, CircleCheck, CircleDot, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type TaskStatus } from "../types";

// Each status has its own icon as well as its own colour, so the badge can
// still be told apart by people who do not see the colours.
export const STATUS_STYLES: Record<TaskStatus, { icon: LucideIcon; className: string }> = {
  TODO: {
    icon: Circle,
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  IN_PROGRESS: {
    icon: CircleDot,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  DONE: {
    icon: CircleCheck,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

interface StatusBadgeProps {
  status: TaskStatus;
  /** Extra content after the label, e.g. the chevron of the status menu. */
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const { icon: Icon, className } = STATUS_STYLES[status];

  return (
    <Badge variant="outline" className={cn("border-transparent", className)}>
      <Icon aria-hidden="true" />
      {STATUS_LABELS[status]}
      {children}
    </Badge>
  );
}
