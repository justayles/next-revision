const DAY_MS = 86_400_000;

export function isOverdue(dueDate: string, done: boolean): boolean {
  if (done) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function daysUntil(dueDate: string): number {
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / DAY_MS);
}

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
