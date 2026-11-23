import { TasksView } from "@/features/tasks/components/tasks-view";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <TasksView />
    </main>
  );
}
