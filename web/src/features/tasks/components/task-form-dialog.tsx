"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ApiErrorAlert } from "@/components/api-error-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/lib/api-client";
import { useSaveTask } from "../hooks";
import {
  taskFormSchema,
  toFormValues,
  toTaskInput,
  type TaskFormValues,
} from "../schema";
import { STATUS_LABELS, TASK_STATUSES, type Task } from "../types";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task to edit, or null to create a new one. */
  task: Task | null;
}

/** The dialog used for both "New task" and "Edit task". */
export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const saveTask = useSaveTask();
  const isEditing = task !== null;

  // Called by the dialog for Escape, the X button and clicks outside.
  function handleOpenChange(nextOpen: boolean) {
    if (saveTask.isPending) {
      return; // do not close while a save is on its way
    }
    if (!nextOpen) {
      saveTask.reset(); // forget a failed save so the next open starts clean
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: TaskFormValues) {
    saveTask.mutate(
      { id: task?.id ?? null, input: toTaskInput(values) },
      {
        onSuccess: () => {
          toast.success(isEditing ? "Task updated" : "Task created");
          onOpenChange(false);
        },
        // On failure nothing is done here: the dialog stays open with what
        // the user typed, and `saveTask.error` is shown inside the form.
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Change the details, then save."
              : "Only the title is required."}
          </DialogDescription>
        </DialogHeader>

        {/* DialogContent only exists while the dialog is open, so TaskForm is
            created again on every open and starts from the current task. */}
        <TaskForm
          task={task}
          isSaving={saveTask.isPending}
          error={saveTask.error}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface TaskFormProps {
  task: Task | null;
  isSaving: boolean;
  /** The error from the last save attempt, if it failed. */
  error: ApiError | null;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
}

/** The fields and buttons. Knows nothing about the API. */
function TaskForm({ task, isSaving, error, onSubmit, onCancel }: TaskFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    // The zod schema decides what is valid. handleSubmit only calls
    // onSubmit when it passes, and focuses the first invalid field if not.
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(task),
  });

  return (
    // noValidate: show our own messages instead of the browser's bubbles.
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {error && <ApiErrorAlert title="Couldn't save the task" error={error} />}

      <div className="grid gap-2">
        <Label htmlFor="task-title">
          Title
          <span aria-hidden="true" className="-ml-1 text-destructive">
            *
          </span>
        </Label>
        <Input
          id="task-title"
          autoComplete="off"
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "task-title-error" : undefined}
          {...register("title")}
        />
        <FieldError id="task-title-error" message={errors.title?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          className="max-h-48"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "task-description-error" : undefined}
          {...register("description")}
        />
        <FieldError
          id="task-description-error"
          message={errors.description?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="task-status">Status</Label>
          {/* Select is not a native input, so react-hook-form cannot
              register it. Controller passes the value in and changes out. */}
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="task-status"
                  className="w-full"
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="task-due-date">Due date</Label>
          <Input
            id="task-due-date"
            type="date"
            aria-invalid={errors.dueDate ? true : undefined}
            aria-describedby={errors.dueDate ? "task-due-date-error" : undefined}
            {...register("dueDate")}
          />
          <FieldError id="task-due-date-error" message={errors.dueDate?.message} />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 aria-hidden="true" className="animate-spin" />}
          {isSaving ? "Saving…" : task ? "Save changes" : "Create task"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A validation message under its field. The input points at `id`. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
