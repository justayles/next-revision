import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toggleTask } from '../actions';
import { TaskToggle } from '../components/TaskToggle';

jest.mock('../actions', () => ({
  toggleTask: jest.fn().mockResolvedValue(undefined),
}));

describe('TaskToggle', () => {
  it('optimistically flips the label after a click', () => {
    const user = userEvent.setup();
    render(<TaskToggle id="1" done={false} />);

    user.click(screen.getByRole('button', { name: /mark as done/i }));

    expect(
      screen.getByRole('button', { name: /mark as open/i }),
    ).toBeInTheDocument();
  });

  it('calls the server action with the new value', async () => {
    render(<TaskToggle id="1" done={false} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button'));
      expect(toggleTask).toHaveBeenCalledWith('1', true);
    });
  });
});
