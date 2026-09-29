'use client';

import type { Metadata } from 'next';
import { NewTaskForm } from '../../components/NewTaskForm';

export const metadata: Metadata = {
  title: 'New task · TaskFlow',
};

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">New task</h1>
      <NewTaskForm />
    </div>
  );
}
