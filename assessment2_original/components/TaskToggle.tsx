'use client';

import { useOptimistic } from 'react';
import { toggleTask } from '../actions';

export function TaskToggle({ id, done }: { id: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  async function handleClick() {
    setOptimisticDone(!optimisticDone);
    await toggleTask(id, !done);
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
