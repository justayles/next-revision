import Link from 'next/link';

export default function TaskNotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Task not found</h1>
      <Link href="/assessment2">Back to the board</Link>
    </div>
  );
}
