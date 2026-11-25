import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsTaskStatusPending } from "../hooks";
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "../types";
import { STATUS_STYLES, StatusBadge } from "./status-badge";

interface StatusMenuProps {
  task: Task;
  onChange: (task: Task, status: TaskStatus) => void;
}

/**
 * The status badge as a button. Clicking it opens a menu with the three
 * statuses, so a task can be moved without opening the edit dialog.
 */
export function StatusMenu({ task, onChange }: StatusMenuProps) {
  const isPending = useIsTaskStatusPending(task.id);

  function handleValueChange(value: string) {
    // The menu only offers the values in TASK_STATUSES, so the cast is safe.
    const status = value as TaskStatus;
    if (!isPending && status !== task.status) {
      onChange(task, status);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* The badge is only 20px tall. The padding makes the clickable area
            36px, and the negative margin cancels the padding out so the row
            keeps its size. */}
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          aria-label={`Status of "${task.title}": ${STATUS_LABELS[task.status]}. Change status`}
          className="disabled:cursor-wait disabled:opacity-60 -m-2 rounded-full p-2 outline-none transition-opacity hover:opacity-75 focus-visible:opacity-75 [&:focus-visible>span]:ring-3 [&:focus-visible>span]:ring-ring/50"
        >
          <StatusBadge status={task.status}>
            <ChevronDown aria-hidden="true" className="opacity-60" />
          </StatusBadge>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-40 whitespace-nowrap">
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        {/* A radio group: exactly one status is selected at a time, and the
            menu marks the current one with a check. */}
        <DropdownMenuRadioGroup value={task.status} onValueChange={handleValueChange}>
          {TASK_STATUSES.map((status) => {
            const Icon = STATUS_STYLES[status].icon;
            return (
              <DropdownMenuRadioItem key={status} value={status}>
                <Icon aria-hidden="true" />
                {STATUS_LABELS[status]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
