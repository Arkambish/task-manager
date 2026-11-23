"use client";

import { ClipboardList, Plus, RotateCw } from "lucide-react";
import { useState } from "react";
import { ApiErrorAlert } from "@/components/api-error-alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTasks } from "../hooks";
import type { Task } from "../types";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { TasksTable } from "./tasks-table";
import { TasksTableSkeleton } from "./tasks-table-skeleton";

/** The whole tasks screen: heading, the list in its current state, dialogs. */
export function TasksView() {
  const tasks = useTasks();

  // Each dialog has two pieces of state: whether it is open, and which task
  // it is about. They are separate so that closing only flips `open`; the
  // task stays in place and the text does not change while the dialog fades
  // out.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  function openCreateForm() {
    setTaskToEdit(null);
    setIsFormOpen(true);
  }

  function openEditForm(task: Task) {
    setTaskToEdit(task);
    setIsFormOpen(true);
  }

  function openDeleteConfirmation(task: Task) {
    setTaskToDelete(task);
    setIsDeleteOpen(true);
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
    return (
      <TasksTable
        tasks={tasks.data}
        onEdit={openEditForm}
        onDelete={openDeleteConfirmation}
      />
    );
  }

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.data ? summarize(tasks.data) : "Create, update and track your work."}
          </p>
        </div>
        <Button size="lg" onClick={openCreateForm}>
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
      />
      <DeleteTaskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        task={taskToDelete}
      />
    </>
  );
}

/** "3 tasks · 1 done" */
function summarize(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "No tasks yet.";
  }
  const done = tasks.filter((task) => task.status === "DONE").length;
  const noun = tasks.length === 1 ? "task" : "tasks";
  return `${tasks.length} ${noun} · ${done} done`;
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
