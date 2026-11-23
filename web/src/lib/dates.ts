const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Formats a calendar date (`YYYY-MM-DD`) for display, e.g. "Dec 4, 2026".
 *
 * The parts are passed to `new Date(year, month, day)`, which uses local
 * time. `new Date("2026-12-04")` would be read as midnight UTC and show as
 * Dec 3 for anyone west of Greenwich.
 */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

/** Formats an ISO timestamp as a date, e.g. "Nov 23, 2026". */
export function formatDate(isoTimestamp: string): string {
  return dateFormatter.format(new Date(isoTimestamp));
}

/** Formats an ISO timestamp as date and time, e.g. "Nov 23, 2026, 4:53 PM". */
export function formatDateTime(isoTimestamp: string): string {
  return dateTimeFormatter.format(new Date(isoTimestamp));
}

/** Today's date in the user's time zone, as `YYYY-MM-DD`. */
export function todayDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
