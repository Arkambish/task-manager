import { z } from "zod";
import { TASK_STATUSES, type Task, type TaskInput } from "./types";

// Same limits as the API's DTOs (api/src/tasks/dto/task-rules.ts). The API
// is the authority; these rules exist so the user gets an answer under the
// field straight away instead of after a round trip.
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(TITLE_MAX_LENGTH, `Use ${TITLE_MAX_LENGTH} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, `Use ${DESCRIPTION_MAX_LENGTH} characters or fewer.`),
  status: z.enum(TASK_STATUSES),
  // <input type="date"> gives "" when empty and YYYY-MM-DD otherwise.
  dueDate: z.union([z.literal(""), z.iso.date("Enter a valid date.")]),
});

/** What the form holds. Empty fields are "" because inputs cannot hold null. */
export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Starting values for the form: the task being edited, or a blank task. */
export function toFormValues(task: Task | null): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "TODO",
    dueDate: task?.dueDate ?? "",
  };
}

/** Converts form values to the API body: empty strings become null. */
export function toTaskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title,
    description: values.description || null,
    status: values.status,
    dueDate: values.dueDate || null,
  };
}
