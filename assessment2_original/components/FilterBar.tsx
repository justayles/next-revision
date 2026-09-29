'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Task } from '../lib/types';

export function FilterBar({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    setOpenCount(tasks.filter((task) => !task.done).length);
  }, [tasks]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div role="search" className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col text-sm">
        Search
        <input
          type="search"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(event) => updateParam('q', event.target.value)}
          className="border px-3 py-2"
        />
      </label>

      <label className="flex flex-col text-sm">
        Priority
        <select
          defaultValue={searchParams.get('priority') ?? ''}
          onChange={(event) => updateParam('priority', event.target.value)}
          className="border px-3 py-2"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <p className="text-sm text-gray-600">{openCount} open tasks</p>
    </div>
  );
}
