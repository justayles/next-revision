'use client';

import { useOptimistic, startTransition } from 'react';
import { toggleTask } from '../actions';

export function TaskToggle({ id, done }: { id: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  async function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!done);
      await toggleTask(id, !done);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={optimisticDone}
      className="border border-gray-900 px-3 py-1 text-sm"
    >
      {optimisticDone ? 'Mark as open' : 'Mark as done'}
    </button>
  );
}
