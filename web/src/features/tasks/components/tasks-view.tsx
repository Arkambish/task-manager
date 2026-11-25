"use client";

import { ClipboardList, Plus, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiErrorAlert } from "@/components/api-error-alert";
import { Button } from "@/components/ui/button";
import { useReturnFocus } from "@/hooks/use-return-focus";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useChangeTaskStatus, useTasks } from "../hooks";
import { STATUS_LABELS, type Task, type TaskStatus } from "../types";
import { DeleteTaskDialog } from "./delete-task-dialog";
import {
  FILTER_LABELS,
  StatusFilter,
  filterTasks,
  type StatusFilterValue,
} from "./status-filter";
import { TaskFormDialog } from "./task-form-dialog";
import { TasksTable } from "./tasks-table";
import { TasksTableSkeleton } from "./tasks-table-skeleton";

/** The whole tasks screen: heading, the list in its current state, dialogs. */
export function TasksView() {
  const tasks = useTasks();
  const changeTaskStatus = useChangeTaskStatus();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  // When a dialog closes, focus goes back to the button that opened it. If
  // that button is gone (the row of a deleted task), it goes to "New task".
  const newTaskButtonRef = useRef<HTMLButtonElement>(null);
  const dialogFocus = useReturnFocus(newTaskButtonRef);

  // Each dialog has two pieces of state: whether it is open, and which task
  // it is about. They are separate so that closing only flips `open`; the
  // task stays in place and the text does not change while the dialog fades
  // out.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  function openCreateForm() {
    dialogFocus.rememberFocus();
    setTaskToEdit(null);
    setIsFormOpen(true);
  }

  function openEditForm(task: Task) {
    dialogFocus.rememberFocus();
    setTaskToEdit(task);
    setIsFormOpen(true);
  }

  function openDeleteConfirmation(task: Task) {
    dialogFocus.rememberFocus();
    setTaskToDelete(task);
    setIsDeleteOpen(true);
  }

  // The table has already changed by the time this runs (see
  // useChangeTaskStatus). What is left is to tell the user how it ended.
  // mutateAsync gives one promise per click, so every click gets its own
  // toast even when several statuses are changed in quick succession.
  async function changeStatus(task: Task, status: TaskStatus) {
    try {
      await changeTaskStatus.mutateAsync({ id: task.id, status });
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
    } catch (error) {
      toast.error("Couldn't change the status", {
        description:
          error instanceof ApiError ? error.message : "Something went wrong.",
      });
    }
  }

  function renderTaskList() {
    // isPending means "no data yet and no error yet": the first load.
    if (tasks.isPending) {
      return <TasksTableSkeleton />;
    }
    // The first load failed. The error message above is all there is to show.
    if (!tasks.data) {
      return null;
    }
    if (tasks.data.length === 0) {
      return <EmptyState onCreate={openCreateForm} />;
    }

    const visibleTasks = filterTasks(tasks.data, statusFilter);
    return (
      <>
        <StatusFilter
          tasks={tasks.data}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        {visibleTasks.length === 0 ? (
          <NoMatches
            filter={statusFilter}
            onShowAll={() => setStatusFilter("ALL")}
          />
        ) : (
          <TasksTable
            tasks={visibleTasks}
            onEdit={openEditForm}
            onDelete={openDeleteConfirmation}
            onStatusChange={changeStatus}
          />
        )}
      </>
    );
  }

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, update and track your work.
          </p>
        </div>
        <Button ref={newTaskButtonRef} size="lg" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          New task
        </Button>
      </header>

      {/* An error can come with or without data. The first load failing
          leaves nothing to show. A later refresh failing leaves the tasks
          loaded earlier, which stay on screen under the message instead of
          disappearing. */}
      {tasks.isError && (
        <div className="mb-4">
          <ApiErrorAlert
            title={tasks.data ? "Couldn't refresh your tasks" : "Couldn't load your tasks"}
            error={tasks.error}
          >
            <Button
              variant="outline"
              className="mt-2 text-foreground"
              onClick={() => tasks.refetch()}
              disabled={tasks.isFetching}
            >
              <RotateCw
                aria-hidden="true"
                className={cn(tasks.isFetching && "animate-spin")}
              />
              Try again
            </Button>
          </ApiErrorAlert>
        </div>
      )}

      {renderTaskList()}

      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={taskToEdit}
        onCloseAutoFocus={dialogFocus.returnFocus}
      />
      <DeleteTaskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        task={taskToDelete}
        onCloseAutoFocus={dialogFocus.returnFocus}
      />
    </>
  );
}

interface NoMatchesProps {
  filter: StatusFilterValue;
  onShowAll: () => void;
}

/** Shown when there are tasks, but none with the status being filtered on. */
function NoMatches({ filter, onShowAll }: NoMatchesProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">
        No tasks are marked “{FILTER_LABELS[filter]}”.
      </p>
      <Button variant="outline" className="mt-4" onClick={onShowAll}>
        Show all tasks
      </Button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <ClipboardList aria-hidden="true" className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 font-medium">No tasks yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first task to start tracking your work.
      </p>
      <Button variant="outline" className="mt-5" onClick={onCreate}>
        <Plus aria-hidden="true" />
        New task
      </Button>
    </div>
  );
}
