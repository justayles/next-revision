export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  done: boolean;
  dueDate: string;
  ownerId: string;
  assigneeName: string;
  assigneeEmail: string;
  assigneeAvatar: string;
  internalNotes: string;
};

export type ActivityItem = {
  id: string;
  message: string;
  at: string;
};

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'member';
};

export type ActionState = {
  error: string | null;
  values?: {
    title: string;
    description: string;
    priority: string;
  };
};

export type TaskSummary = Pick<
  Task,
  | 'id'
  | 'title'
  | 'description'
  | 'priority'
  | 'done'
  | 'dueDate'
  | 'assigneeName'
  | 'assigneeAvatar'
>;
