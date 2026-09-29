'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './lib/auth';
import {
  createTaskRecord,
  deleteTaskRecord,
  updateTaskDone,
} from './lib/tasks';
import type { ActionState, Priority } from './lib/types';

export const MAX_TITLE_LENGTH = 80;

export async function createTask(formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priority = String(formData.get('priority') ?? 'medium') as Priority;

  if (!title) {
    return { error: 'Title is required' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  }

  await createTaskRecord({ title, description, priority, ownerId: user.id });

  revalidatePath('/assessment2');
  redirect('/assessment2');
}

export async function toggleTask(id: string, done: boolean) {
  await updateTaskDone(id, done);
}

export async function deleteTask(id: string) {
  await deleteTaskRecord(id);
  revalidatePath('/assessment2');
}
