import { cookies } from 'next/headers';
import { deleteTaskRecord, getTask } from '../../../lib/tasks.server';
import { getCurrentUser } from '@/app/assessment2/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const task = await getTask((await params).id);

  if (!task) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // check here that user is admin, etc
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const task = await getTask((await params).id);
  if (!task) {
    return { error: 'Task not found' };
  }
  if (user.role !== 'admin' && task.ownerId !== user.id) {
    return { error: 'Forbidden' };
  }

  await deleteTaskRecord((await params).id);
  return new Response(null, { status: 204 });
}
