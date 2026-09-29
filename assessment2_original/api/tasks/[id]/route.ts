import { cookies } from 'next/headers';
import { deleteTaskRecord, getTask } from '../../../lib/tasks';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const task = await getTask(params.id);

  if (!task) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteTaskRecord(params.id);
  return new Response(null, { status: 204 });
}
