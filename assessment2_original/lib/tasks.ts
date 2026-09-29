import { unstable_cache } from 'next/cache';
import type { ActivityItem, Priority, Task } from './types';

// Pretend these configure a real database client.
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

export const dbConfig = {
  url: DATABASE_URL ?? 'memory://taskflow',
  adminToken: ADMIN_API_TOKEN,
};

const tasks: Task[] = [
  {
    id: 't1',
    title: 'Fix login redirect loop',
    description:
      'Users bounce between /login and /dashboard after the session expires.',
    priority: 'high',
    done: false,
    dueDate: '2026-09-20',
    ownerId: 'u1',
    assigneeName: 'Grace Hopper',
    assigneeEmail: 'grace@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=47',
    internalNotes:
      'Big customer is threatening to churn. Do not share outside the team.',
  },
  {
    id: 't2',
    title: 'Write the Next 15 upgrade guide',
    description:
      '<b>Async request APIs</b>, caching defaults, and React 19 changes.',
    priority: 'medium',
    done: false,
    dueDate: '2026-10-15',
    ownerId: 'u1',
    assigneeName: 'Ada Lovelace',
    assigneeEmail: 'ada@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=5',
    internalNotes: 'Waiting on legal to approve the migration timeline.',
  },
  {
    id: 't3',
    title: 'Audit third-party scripts',
    description:
      'Looks harmless <img src="x" onerror="alert(document.cookie)" /> but it is not.',
    priority: 'high',
    done: false,
    dueDate: '2026-10-02',
    ownerId: 'u2',
    assigneeName: 'Linus Torvalds',
    assigneeEmail: 'linus@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=12',
    internalNotes: 'Contractor account may have leaked credentials.',
  },
  {
    id: 't4',
    title: 'Set up Jest and Testing Library',
    description: 'Configure next/jest, jsdom, and jest-dom matchers.',
    priority: 'low',
    done: true,
    dueDate: '2026-09-10',
    ownerId: 'u2',
    assigneeName: 'Grace Hopper',
    assigneeEmail: 'grace@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=47',
    internalNotes: '',
  },
  {
    id: 't5',
    title: 'Reduce dashboard bundle size',
    description: 'Move chart code behind a dynamic import.',
    priority: 'medium',
    done: false,
    dueDate: '2026-11-01',
    ownerId: 'u1',
    assigneeName: 'Ada Lovelace',
    assigneeEmail: 'ada@taskflow.dev',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=5',
    internalNotes: 'Performance budget is a KPI this quarter.',
  },
];

const activity: ActivityItem[] = [
  {
    id: 'a1',
    message: 'Grace closed "Set up Jest and Testing Library"',
    at: '2026-09-28T16:20:00Z',
  },
  {
    id: 'a2',
    message: 'Ada created "Reduce dashboard bundle size"',
    at: '2026-09-28T11:05:00Z',
  },
  {
    id: 'a3',
    message: 'Linus commented on "Audit third-party scripts"',
    at: '2026-09-27T09:41:00Z',
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTasks(): Promise<Task[]> {
  await delay(80);
  return tasks;
}

export async function getTask(id: string): Promise<Task | undefined> {
  await delay(40);
  return tasks.find((task) => task.id === id);
}

export const getCachedTask = unstable_cache(
  async (id: string) => getTask(id),
  ['task'],
  { tags: ['tasks'] },
);

export async function getActivity(): Promise<ActivityItem[]> {
  await delay(400);
  return activity;
}

export async function createTaskRecord(input: {
  title: string;
  description: string;
  priority: Priority;
  ownerId: string;
}): Promise<Task> {
  await delay(60);
  const task: Task = {
    id: `t${crypto.randomUUID().slice(0, 8)}`,
    done: false,
    dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    assigneeName: 'Unassigned',
    assigneeEmail: '',
    assigneeAvatar: 'https://i.pravatar.cc/96?img=1',
    internalNotes: '',
    ...input,
  };
  tasks.push(task);
  return task;
}

export async function updateTaskDone(id: string, done: boolean) {
  const task = tasks.find((item) => item.id === id);
  if (task) task.done = done;
}

export async function deleteTaskRecord(id: string) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index !== -1) tasks.splice(index, 1);
}

export function getPriorityLabel(priority: Priority) {
  switch (priority) {
    case 'high':
      return 'High priority';
    case 'medium':
      return 'Medium priority';
    default:
      return 'Low priority';
  }
}
