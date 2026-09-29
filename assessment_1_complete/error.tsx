'use client';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="rounded border border-red-300 p-6">
      <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
    </div>
  );
}
