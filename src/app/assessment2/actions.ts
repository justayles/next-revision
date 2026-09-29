'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './lib/auth';
import {
  createTaskRecord,
  deleteTaskRecord,
  updateTaskDone,
} from './lib/tasks.server';
import type { ActionState, Priority } from './lib/types';

// export const MAX_TITLE_LENGTH = 80;
const MAX_TITLE_LENGTH = 80;

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in' };
  }

  // const title = String(formData.get('title') ?? '').trim();
  // const description = String(formData.get('description') ?? '').trim();
  // const priority = String(formData.get('priority') ?? 'medium') as Priority;

  // if (!title) {
  //   return { error: 'Title is required' };
  // }

  const values = {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    priority: String(formData.get('priority') ?? 'medium'),
  };

  if (!values.title) {
    return { error: 'Title is required', values };
  }

  if (values.title.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      values,
    };
  }

  await createTaskRecord({
    title: values.title,
    description: values.description,
    priority: values.priority as Priority,
    ownerId: user.id,
  });

  revalidatePath('/assessment2');
  redirect('/assessment2');
}

export async function toggleTask(id: string, done: boolean) {
  await updateTaskDone(id, done);
  revalidateTag('tasks');
  revalidatePath('/assessment2');
}

export async function deleteTask(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in' };
  }
  await deleteTaskRecord(id);
  revalidatePath('/assessment2');
}
