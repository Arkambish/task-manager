// NEXT_PUBLIC_ variables are inlined into the browser bundle at build time,
// so this must never hold a secret. It is only the address of the API.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

/**
 * The one error type the UI has to handle. Every failed request becomes an
 * ApiError, whether the API answered with an error or never answered at all.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when no response arrived. */
  readonly status: number;
  /** One entry per problem, e.g. one per invalid field. Never empty. */
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(" "));
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Sent as JSON when present. */
  body?: unknown;
}

/** Calls the API and returns the parsed JSON body. Throws ApiError on failure. */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const signal = AbortSignal.timeout(15_000);
  let response: Response | undefined;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new ApiError(response.status, await readErrorMessages(response));
    }
    // 204 No Content (DELETE) has no body to parse.
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal.aborted) {
      throw new ApiError(0, [
        "The request timed out. Check the task list before retrying; the server may have saved your change.",
      ]);
    }
    if (response) {
      throw new ApiError(response.status, [
        "The API returned an unreadable response. Refresh the task list before trying again.",
      ]);
    }
    throw new ApiError(0, [
      `Could not reach the API at ${API_URL}. Check that it is running, then try again.`,
    ]);
  }
}

/**
 * NestJS error bodies look like `{ statusCode, message, error }`, where
 * `message` is a string for most errors and a string array for validation
 * errors. This always returns an array so callers have one shape to handle.
 */
async function readErrorMessages(response: Response): Promise<string[]> {
  const fallback = [`The request failed (status ${response.status}).`];

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallback; // not JSON, e.g. an HTML error page from a proxy
  }

  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message === "string" && message !== "") {
    return [message];
  }
  if (Array.isArray(message)) {
    const messages = message.filter((item) => typeof item === "string");
    if (messages.length > 0) {
      return messages;
    }
  }
  return fallback;
}
