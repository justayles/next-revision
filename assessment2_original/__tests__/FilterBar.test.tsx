import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../components/FilterBar';
import { makeTask } from '../testing/fixtures';

describe('FilterBar', () => {
  const tasks = [
    makeTask({ id: '1', done: false }),
    makeTask({ id: '2', done: true }),
    makeTask({ id: '3', done: false }),
  ];

  it('shows how many tasks are still open', () => {
    render(<FilterBar tasks={tasks} />);

    expect(screen.getByText('2 open tasks')).toBeInTheDocument();
  });

  it('updates the URL when the priority changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar tasks={tasks} />);

    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

    // TODO: assert that router.replace was called with ?priority=high
  });
});
