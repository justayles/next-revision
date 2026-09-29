import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { ActivityFeed } from './components/ActivityFeed';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { isOverdue } from './lib/format';
import { getTaskStats } from './lib/stats';
import type { Task } from './lib/types';

type BoardPageProps = {
  searchParams: Promise<{ q?: string; priority?: string }>;
};

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const query = (await searchParams).q?.toLowerCase() ?? '';
  const priority = (await searchParams).priority ?? '';

  const res = await fetch('/assessment2/api/tasks');
  const tasks: Task[] = await res.json();

  if (tasks.some((task) => isOverdue(task.dueDate, task.done))) {
    // Keep the overdue badges fresh for everyone.
    revalidatePath('/assessment2');
  }

  const stats = await getTaskStats(tasks);

  const visible = tasks.filter((task) => {
    const matchesQuery = task.title.toLowerCase().includes(query);
    const matchesPriority = priority ? task.priority === priority : true;
    return matchesQuery && matchesPriority;
  });

  return (
    <div>
      <div className="mb-6 rounded border border-gray-200 p-4 text-sm">
        <p>
          {stats.done} of {stats.total} tasks done · {stats.overdue} overdue
        </p>
      </div>

      <h1 className="mb-4 text-3xl font-semibold">Board</h1>

      <Suspense fallback={<p>Loading filters…</p>}>
        <FilterBar tasks={visible} />
      </Suspense>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visible.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} />
          </li>
        ))}
      </ul>

      <Suspense fallback={<p className="mt-8">Loading activity…</p>}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
