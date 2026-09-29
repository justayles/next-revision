import { render, screen } from '@testing-library/react';
import { NewTaskForm } from '../components/NewTaskForm';
import userEvent from '@testing-library/user-event';

jest.mock('../actions', () => ({
  createTask: jest.fn(),
}));

describe('NewTaskForm', () => {
  // it('lets the user type a title', () => {
  //   const { container } = render(<NewTaskForm />);

  //   const input = container.querySelector(
  //     'input[name="title"]',
  //   ) as HTMLInputElement;
  //   fireEvent.change(input, { target: { value: 'Ship it' } });

  //   expect(input.value).toBe('Ship it');
  // });

  it('lets the user type a title', async () => {
    const user = userEvent.setup();
    render(<NewTaskForm />);

    await user.type(screen.getByLabelText(/title/i), 'Ship it');

    expect(screen.getByLabelText(/title/i)).toHaveValue('Ship it');
  });

  // it('renders a styled submit button', () => {
  //   render(<NewTaskForm />);

  //   const button = screen.getByTestId('submit-button');
  //   expect(button.className).toContain('bg-black');
  //   expect(button.textContent).toBe('Create task');
  // });

  it('renders an enabled submit button', () => {
    render(<NewTaskForm />);
    expect(screen.getByRole('button', { name: /create task/i })).toBeEnabled();
  });

  // it('has a priority dropdown defaulting to medium', () => {
  //   const { container } = render(<NewTaskForm />);

  //   const select = container.querySelector('select') as HTMLSelectElement;
  //   expect(select.value).toBe('medium');
  //   expect(container.querySelectorAll('option')).toHaveLength(3);
  // });

  it('defaults the priority to medium', () => {
    render(<NewTaskForm />);
    expect(screen.getByLabelText(/priority/i)).toHaveDisplayValue('Medium');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });
});
