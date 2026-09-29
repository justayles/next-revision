import type { Priority } from './types';

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
