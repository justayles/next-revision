import { Task, TaskSummary } from './types';

export function toTaskSummary(task: Task): TaskSummary {
  const {
    id,
    title,
    description,
    priority,
    done,
    dueDate,
    assigneeName,
    assigneeAvatar,
  } = task;
  return {
    id,
    title,
    description,
    priority,
    done,
    dueDate,
    assigneeName,
    assigneeAvatar,
  };
}
