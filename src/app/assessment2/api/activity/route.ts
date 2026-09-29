import { getActivity } from '../../lib/tasks.server';

export async function GET() {
  return Response.json(await getActivity());
}
