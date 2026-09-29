import { getTaskStats } from '../lib/stats';
import { makeTask } from '../testing/fixtures';

describe('getTaskStats', () => {
  it('counts total and done tasks', async () => {
    const tasks = [makeTask({ done: true }), makeTask({ done: false })];

    await expect(getTaskStats(tasks)).resolves.toMatchObject({
      total: 2,
      done: 1,
    });
  });

  it('rejects when a task has an invalid due date', async () => {
    try {
      await getTaskStats([makeTask({ dueDate: 'not-a-date' })]);
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
    }
  });
});
