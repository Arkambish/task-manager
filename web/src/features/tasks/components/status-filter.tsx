import { Button } from "@/components/ui/button";
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "../types";

/** "ALL" shows every task; a status shows only the tasks with that status. */
export type StatusFilterValue = "ALL" | TaskStatus;

export const FILTER_LABELS: Record<StatusFilterValue, string> = {
  ALL: "All",
  ...STATUS_LABELS,
};

const FILTER_VALUES: StatusFilterValue[] = ["ALL", ...TASK_STATUSES];

/** Returns the tasks that match the filter. */
export function filterTasks(tasks: Task[], filter: StatusFilterValue): Task[] {
  return filter === "ALL" ? tasks : tasks.filter((task) => task.status === filter);
}

interface StatusFilterProps {
  /** All tasks, unfiltered: the counts are worked out from these. */
  tasks: Task[];
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

/** A row of buttons that narrows the table to one status. */
export function StatusFilter({ tasks, value, onChange }: StatusFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter tasks by status"
      className="mb-4 flex flex-wrap gap-1"
    >
      {FILTER_VALUES.map((filter) => {
        const isSelected = filter === value;
        return (
          <Button
            key={filter}
            variant={isSelected ? "secondary" : "ghost"}
            // aria-pressed tells screen readers which button is "on".
            aria-pressed={isSelected}
            onClick={() => onChange(filter)}
          >
            {FILTER_LABELS[filter]}
            <span className="text-muted-foreground tabular-nums">
              {filterTasks(tasks, filter).length}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
