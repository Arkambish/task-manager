export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/**
 * A task as it is stored and as it is returned by the API.
 *
 * Optional fields are `null` (never missing) so every response has the same
 * shape and clients do not have to tell "missing" and "empty" apart.
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Calendar date as `YYYY-MM-DD`. No time part, so no time zone shifts. */
  dueDate: string | null;
  /** Full ISO 8601 timestamp, set once by the server. */
  createdAt: string;
}
