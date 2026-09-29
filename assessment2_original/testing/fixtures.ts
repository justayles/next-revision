import type { Task } from '../lib/types';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-test',
    title: 'Fix login',
    description: 'Users bounce between pages.',
    priority: 'high',
    done: false,
    dueDate: '2099-01-01',
    ownerId: 'u1',
    assigneeName: 'Grace Hopper',
    assigneeEmail: 'grace@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=47',
    internalNotes: '',
    ...overrides,
  };
}
