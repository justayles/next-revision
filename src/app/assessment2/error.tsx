'use client';

export default function TaskFlowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
      <button type="button" onClick={() => reset()} className="mt-3 border px-3 py-1">
        Try again
      </button>
    </div>
  );
}
