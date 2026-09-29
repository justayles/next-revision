import { isOverdue } from './format';
import type { Task } from './types';

export async function getTaskStats(tasks: Task[]) {
  // Pretend this calls an analytics service.
  await Promise.resolve();

  return {
    total: tasks.length,
    done: tasks.filter((task) => task.done).length,
    overdue: tasks.filter((task) => isOverdue(task.dueDate, task.done)).length,
  };
}
