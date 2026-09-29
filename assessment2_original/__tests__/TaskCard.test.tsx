import { render, screen } from '@testing-library/react';
import { TaskCard } from '../components/TaskCard';
import { makeTask } from '../testing/fixtures';

jest.mock('../actions', () => ({
  toggleTask: jest.fn(),
  deleteTask: jest.fn(),
}));

// Workaround: importing the real lib/tasks pulls next/cache into jsdom and crashes.
jest.mock('../lib/tasks', () => ({
  getPriorityLabel: () => 'High priority',
}));

describe('TaskCard', () => {
  it('renders the task title as a link', () => {
    render(<TaskCard task={makeTask({ title: 'Fix login' })} />);

    expect(screen.getByRole('link', { name: 'Fix login' }));
  });

  it('shows an overdue badge for late tasks', () => {
    render(<TaskCard task={makeTask({ dueDate: '2020-01-01' })} />);

    expect(screen.queryByText('Overdue'));
  });

  it('does not show an overdue badge for finished tasks', () => {
    render(
      <TaskCard task={makeTask({ dueDate: '2020-01-01', done: true })} />,
    );

    expect(screen.getByText('Overdue')).not.toBeInTheDocument();
  });
});
