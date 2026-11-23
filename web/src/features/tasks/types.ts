/** Mirrors the API's TaskStatus enum. The order is the order shown in the form. */
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

/** A task as the API returns it. */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Calendar date, `YYYY-MM-DD`. */
  dueDate: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** The body sent to POST /tasks and PATCH /tasks/:id. */
export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
}
