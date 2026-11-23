import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateOnly, formatDateTime, todayDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Task } from "../types";
import { StatusBadge } from "./status-badge";

interface TasksTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TasksTable({ tasks, onEdit, onDelete }: TasksTableProps) {
  // Read the clock once per render, not once per row.
  const today = todayDateOnly();

  return (
    <TasksTableFrame>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </TasksTableFrame>
  );
}

/**
 * The bordered table with its header row. The loading skeleton uses it too,
 * so the placeholder has exactly the columns of the real table and nothing
 * moves when the data arrives.
 *
 * Narrow screens: "Due" is hidden below `sm` (the date moves under the
 * title) and "Created" is hidden below `md`, so the table fits a phone
 * without sideways scrolling.
 */
export function TasksTableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="pl-4">Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Due</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="pr-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  today: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskRow({ task, today, onEdit, onDelete }: TaskRowProps) {
  // YYYY-MM-DD strings sort the same way as the dates they stand for, so a
  // plain string comparison is enough. A finished task is never overdue.
  const isOverdue =
    task.dueDate !== null && task.status !== "DONE" && task.dueDate < today;

  return (
    <TableRow>
      {/* whitespace-normal: long titles wrap instead of widening the table. */}
      <TableCell className="w-full py-3 pl-4 whitespace-normal">
        <p className="font-medium wrap-anywhere">{task.title}</p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-muted-foreground wrap-anywhere">
            {task.description}
          </p>
        )}
        {task.dueDate && (
          <p className="mt-1 text-xs sm:hidden">
            <span className="text-muted-foreground">Due </span>
            <DueDate dueDate={task.dueDate} isOverdue={isOverdue} />
          </p>
        )}
      </TableCell>

      <TableCell>
        <StatusBadge status={task.status} />
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        {task.dueDate ? (
          <DueDate dueDate={task.dueDate} isOverdue={isOverdue} />
        ) : (
          <NoValue label="No due date" />
        )}
      </TableCell>

      <TableCell className="hidden text-muted-foreground md:table-cell">
        <time dateTime={task.createdAt} title={formatDateTime(task.createdAt)}>
          {formatDate(task.createdAt)}
        </time>
      </TableCell>

      <TableCell className="pr-4">
        <div className="flex justify-end gap-1">
          {/* Icon-only buttons need a label; it names the task so each
              button is unique for screen reader users. */}
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground"
            aria-label={`Edit "${task.title}"`}
            onClick={() => onEdit(task)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete "${task.title}"`}
            onClick={() => onDelete(task)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DueDate({ dueDate, isOverdue }: { dueDate: string; isOverdue: boolean }) {
  return (
    <span className={cn("tabular-nums", isOverdue && "font-medium text-destructive")}>
      <time dateTime={dueDate}>{formatDateOnly(dueDate)}</time>
      {/* The word, not only the red colour, says that the date has passed. */}
      {isOverdue && " · Overdue"}
    </span>
  );
}

/** A dash for sighted users, real words for screen readers. */
function NoValue({ label }: { label: string }) {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
