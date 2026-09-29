import { daysUntil, isOverdue, truncate } from '../lib/format';

describe('isOverdue', () => {
  it('is not overdue when the due date is in the future', () => {
    expect(isOverdue('2026-10-15', false)).toBe(false);
  });

  it('is overdue when the due date has passed', () => {
    expect(isOverdue('2026-09-20', false)).toBe(true);
  });

  it('is never overdue once the task is done', () => {
    expect(isOverdue('2020-01-01', true)).toBe(false);
  });
});

describe('daysUntil', () => {
  it('counts the days until the due date', () => {
    expect(daysUntil('2026-10-01')).toBe(2);
  });
});

describe('truncate', () => {
  it('leaves short text alone', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('adds an ellipsis when the text is too long', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
  });
});
