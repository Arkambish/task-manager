"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiErrorAlert } from "@/components/api-error-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTask } from "../hooks";
import type { Task } from "../types";

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task the user asked to delete. */
  task: Task | null;
  /** Decides where keyboard focus goes once the dialog has closed. */
  onCloseAutoFocus: (event: Event) => void;
}

/** Asks for confirmation before a task is deleted. */
export function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
  onCloseAutoFocus,
}: DeleteTaskDialogProps) {
  const deleteTask = useDeleteTask();

  function handleOpenChange(nextOpen: boolean) {
    if (deleteTask.isPending) {
      return; // do not close while the delete is on its way
    }
    if (!nextOpen) {
      deleteTask.reset(); // forget a failed attempt
    }
    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    if (!task) {
      return;
    }
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted");
        onOpenChange(false);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground wrap-anywhere">
              {task?.title}
            </span>{" "}
            will be deleted for good. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteTask.error && (
          <ApiErrorAlert title="Couldn't delete the task" error={deleteTask.error} />
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTask.isPending}>
            Cancel
          </AlertDialogCancel>
          {/* A plain Button, not AlertDialogAction: that one closes the
              dialog on click, before we know whether the delete worked. */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteTask.isPending}
          >
            {deleteTask.isPending && (
              <Loader2 aria-hidden="true" className="animate-spin" />
            )}
            {deleteTask.isPending ? "Deleting…" : "Delete task"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
