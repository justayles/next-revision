'use client';

import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

const categories = ['home', 'stationery', 'audio', 'bags'];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';

  function update(next: { q?: string; category?: string }) {
    const params = new URLSearchParams();
    const query = next.q ?? q;
    const selectedCategory = next.category ?? category;

    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);

    router.push(`/assessment?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        className="border px-3 py-2"
        placeholder="Search products"
        defaultValue={q}
        onChange={(event) => update({ q: event.target.value })}
      />
      <select
        className="border px-3 py-2"
        value={category}
        onChange={(event) => update({ category: event.target.value })}
      >
        <option value="">All categories</option>
        {categories.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
    </div>
  );
}
