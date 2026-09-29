'use client';

import { use } from 'react';
import type { ActivityItem } from '../lib/types';

export function ActivityFeed() {
  const items: ActivityItem[] = use(
    fetch('/assessment2/api/activity').then((res) => res.json()),
  );

  return (
    <section aria-labelledby="activity-heading" className="mt-8">
      <h2 id="activity-heading" className="mb-2 text-lg font-medium">
        Recent activity
      </h2>
      <ul className="space-y-1 text-sm text-gray-700">
        {items.map((item) => (
          <li key={item.id}>{item.message}</li>
        ))}
      </ul>
    </section>
  );
}
