import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ApiError } from "@/lib/api-client";

interface ApiErrorAlertProps {
  /** What failed, in the user's words, e.g. "Couldn't save the task". */
  title: string;
  error: ApiError;
  /** Optional recovery action, such as a "Try again" button. */
  children?: React.ReactNode;
}

/**
 * Shows an API error where it happened. The Alert has role="alert", so screen
 * readers announce it as soon as it appears.
 */
export function ApiErrorAlert({ title, error, children }: ApiErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {error.messages.length === 1 ? (
          <p>{error.messages[0]}</p>
        ) : (
          // Validation errors: one line per invalid field.
          <ul className="list-disc pl-4">
            {error.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        {children}
      </AlertDescription>
    </Alert>
  );
}
