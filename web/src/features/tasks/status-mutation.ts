import type { QueryClient } from "@tanstack/react-query";
import type { Task, TaskStatus } from "./types";

export const TASKS_QUERY_KEY = ["tasks"] as const;
export const TASKS_MUTATION_KEY = ["tasks"] as const;
export const STATUS_MUTATION_KEY = ["tasks", "status"] as const;

export function reloadTasksWhenSettled(queryClient: QueryClient) {
  // onSettled runs while its own mutation is still pending. A later
  // mutation will refresh once all optimistic changes have finished.
  if (queryClient.isMutating({ mutationKey: TASKS_MUTATION_KEY }) <= 1) {
    return queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  }
}

export function statusMutationOptions(
  queryClient: QueryClient,
  updateStatus: (id: string, changes: { status: TaskStatus }) => Promise<Task>,
) {
  return {
    mutationKey: STATUS_MUTATION_KEY,
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateStatus(id, { status }),
    onMutate: async ({ id, status }: { id: string; status: TaskStatus }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousStatus = queryClient
        .getQueryData<Task[]>(TASKS_QUERY_KEY)
        ?.find((task) => task.id === id)?.status;
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (tasks) =>
        tasks?.map((task) => (task.id === id ? { ...task, status } : task)),
      );
      return { previousStatus };
    },
    onError: (
      _error: Error,
      { id }: { id: string; status: TaskStatus },
      context: { previousStatus: TaskStatus | undefined } | undefined,
    ) => {
      const previousStatus = context?.previousStatus;
      if (previousStatus === undefined) return;
      // Roll back only this status, preserving other tasks and edited fields.
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (tasks) =>
        tasks?.map((task) =>
          task.id === id ? { ...task, status: previousStatus } : task,
        ),
      );
    },
    onSettled: () => reloadTasksWhenSettled(queryClient),
  };
}
