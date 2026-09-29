import { reviews } from '@/app/assessment/lib/reviews';

export default async function GET() {
  return Response.json(reviews);
}

export async function POST(request: Request) {
  const body = await request.json();
  reviews.push(body);
  return Response.json({ ok: true });
}
