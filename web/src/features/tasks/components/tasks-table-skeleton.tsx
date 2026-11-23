import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { TasksTableFrame } from "./tasks-table";

// Different title widths so the placeholder looks like text, not a grid.
const TITLE_WIDTHS = ["w-48", "w-64", "w-40", "w-56"];

/** Placeholder shown while the task list is loading for the first time. */
export function TasksTableSkeleton() {
  return (
    // role="status" makes screen readers announce the hidden text below.
    <div role="status">
      <span className="sr-only">Loading tasks…</span>
      <div aria-hidden="true">
        <TasksTableFrame>
          {TITLE_WIDTHS.map((width) => (
            <TableRow key={width} className="hover:bg-transparent">
              <TableCell className="w-full py-3 pl-4">
                <Skeleton className={`h-4 max-w-full ${width}`} />
                <Skeleton className="mt-2 h-3 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <Skeleton className="size-9" />
                  <Skeleton className="size-9" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TasksTableFrame>
      </div>
    </div>
  );
}
