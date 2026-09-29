'use client';

import { notFound } from 'next/navigation';
import { getTask } from '../../../lib/tasks';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Edit task</h1>
      <label className="flex max-w-md flex-col gap-1 text-sm">
        Title
        <input defaultValue={task.title} className="border px-3 py-2" />
      </label>
    </div>
  );
}
