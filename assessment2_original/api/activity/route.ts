import { getActivity } from '../../lib/tasks';

export async function GET() {
  return Response.json(await getActivity());
}
