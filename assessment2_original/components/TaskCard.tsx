'use client';

import Link from 'next/link';
import { deleteTask } from '../actions';
import { formatDueDate, isOverdue } from '../lib/format';
import { getPriorityLabel } from '../lib/tasks';
import type { Task } from '../lib/types';
import { Avatar } from './Avatar';
import { useSession } from './SessionProvider';
import { TaskToggle } from './TaskToggle';

export function TaskCard({ task }: { task: Task }) {
  const { user } = useSession();
  const descriptionId = `description-${Math.random().toString(36).slice(2)}`;
  const overdue = isOverdue(task.dueDate, task.done);

  return (
    <article
      aria-describedby={descriptionId}
      className="rounded border border-gray-200 p-4"
    >
      <header className="flex items-center gap-3">
        <Avatar src={task.assigneeAvatar} name={task.assigneeName} />
        <div>
          <h3 className="font-medium">
            <Link href={`/assessment2/tasks/${task.id}`}>{task.title}</Link>
          </h3>
          <p className="text-xs text-gray-500">
            {task.assigneeName} · {getPriorityLabel(task.priority)}
          </p>
        </div>
      </header>

      <div
        id={descriptionId}
        className="mt-3 text-sm"
        dangerouslySetInnerHTML={{ __html: task.description }}
      />

      <p className="mt-2 text-xs">
        Due {formatDueDate(task.dueDate)}
        {overdue && <span className="ml-2 text-red-600">Overdue</span>}
      </p>

      <div className="mt-3 flex gap-2">
        <TaskToggle id={task.id} done={task.done} />
        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => deleteTask(task.id)}
            className="border border-red-600 px-3 py-1 text-sm text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
