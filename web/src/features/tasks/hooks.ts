import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-client";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import type { Task, TaskInput } from "./types";

import {
  TASKS_QUERY_KEY,
  TASKS_MUTATION_KEY,
  STATUS_MUTATION_KEY,
  reloadTasksWhenSettled,
  statusMutationOptions,
} from "./status-mutation";

/** Loads the task list. Gives `data`, `isPending`, `error` and `refetch`. */
export function useTasks() {
  return useQuery<Task[], ApiError>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: listTasks,
  });
}

/**
 * Returns a function that reloads the task list from the API.
 *
 * The mutations call it in `onSettled`, i.e. after success AND after
 * failure. After a failure the list may be out of date too (for example the
 * task was already deleted in another tab), so the table is always brought
 * back in line with the server. Overlapping mutations defer the refresh
 * until the last one settles, preserving pending optimistic changes.
 */
function useReloadTasks() {
  const queryClient = useQueryClient();
  return () => reloadTasksWhenSettled(queryClient);
}

/**
 * Saves the task form. One hook for create and edit because the form is the
 * same for both: `id` is null for a new task and the task's id for an edit.
 */
export function useSaveTask() {
  const reloadTasks = useReloadTasks();
  return useMutation<Task, ApiError, { id: string | null; input: TaskInput }>({
    mutationKey: TASKS_MUTATION_KEY,
    mutationFn: ({ id, input }) =>
      id === null ? createTask(input) : updateTask(id, input),
    onSettled: reloadTasks,
  });
}

/**
 * Changes one task's status, optimistically: the table shows the new status
 * at once, without waiting for the API. If the API then refuses, the table
 * goes back to how it was.
 *
 * The form and the delete dialog do not work this way on purpose. They have
 * a visible "Saving…" state and can show an error next to what the user
 * typed. A status click has nowhere to wait, so it has to feel instant.
 */
export function useChangeTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation(statusMutationOptions(queryClient, updateTask));
}

export function useIsTaskStatusPending(id: string) {
  return useIsMutating({
    mutationKey: STATUS_MUTATION_KEY,
    predicate: (mutation) =>
      (mutation.state.variables as { id?: string } | undefined)?.id === id,
  }) > 0;
}

export function useDeleteTask() {
  const reloadTasks = useReloadTasks();
  return useMutation<void, ApiError, string>({
    mutationKey: TASKS_MUTATION_KEY,
    mutationFn: deleteTask,
    onSettled: reloadTasks,
  });
}
