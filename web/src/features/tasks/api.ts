import { apiRequest } from "@/lib/api-client";
import type { Task, TaskInput } from "./types";

// One function per endpoint. Components never build URLs themselves.

export function listTasks(): Promise<Task[]> {
  return apiRequest<Task[]>("/tasks");
}

export function createTask(input: TaskInput): Promise<Task> {
  return apiRequest<Task>("/tasks", { method: "POST", body: input });
}

/** Sends only the fields in `changes`; the API leaves the others as they are. */
export function updateTask(id: string, changes: Partial<TaskInput>): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: changes,
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
