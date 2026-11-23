import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api-client";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import type { Task, TaskInput } from "./types";

// The cache key for the task list. Every hook below refers to it, so a
// change made by one of them is seen by all components that show the list.
const TASKS_QUERY_KEY = ["tasks"] as const;

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
 * back in line with the server. Returning the promise keeps the mutation
 * "pending" until the fresh list has arrived, so a dialog closes onto an
 * up-to-date table.
 */
function useReloadTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
}

/**
 * Saves the task form. One hook for create and edit because the form is the
 * same for both: `id` is null for a new task and the task's id for an edit.
 */
export function useSaveTask() {
  const reloadTasks = useReloadTasks();
  return useMutation<Task, ApiError, { id: string | null; input: TaskInput }>({
    mutationFn: ({ id, input }) =>
      id === null ? createTask(input) : updateTask(id, input),
    onSettled: reloadTasks,
  });
}

export function useDeleteTask() {
  const reloadTasks = useReloadTasks();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteTask,
    onSettled: reloadTasks,
  });
}
