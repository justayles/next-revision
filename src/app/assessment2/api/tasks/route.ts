import { createTaskRecord, getTasks } from '../../lib/tasks.server';

export async function GET() {
  return Response.json(await getTasks());
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = await createTaskRecord(body);
  return Response.json(task);
}
