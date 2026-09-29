import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TaskToggle } from '../../components/TaskToggle';
import { getCachedTask } from '../../lib/tasks';

type TaskPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TaskPageProps) {
  const id = (await params).id;
  const task = await getCachedTask(id);
  return { title: task ? `${task.title} · TaskFlow` : 'Task · TaskFlow' };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const id = (await params).id;
  const task = await getCachedTask(id);

  if (!task) {
    notFound();
  }

  return (
    <article>
      <h1 className="text-3xl font-semibold">{task.title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Status: {task.done ? 'Done' : 'Open'} · Due {task.dueDate}
      </p>
      <p className="mt-4">{task.description}</p>

      <div className="mt-6 flex gap-3">
        <TaskToggle id={task.id} done={task.done} />
        <Link href={`/assessment2/tasks/${task.id}/edit`}>Edit</Link>
      </div>
    </article>
  );
}
