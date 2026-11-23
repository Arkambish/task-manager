import { apiRequest } from "@/lib/api-client";
import type { Task, TaskInput } from "./types";

// One function per endpoint. Components never build URLs themselves.

export function listTasks(): Promise<Task[]> {
  return apiRequest<Task[]>("/tasks");
}

export function createTask(input: TaskInput): Promise<Task> {
  return apiRequest<Task>("/tasks", { method: "POST", body: input });
}

export function updateTask(id: string, input: TaskInput): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
