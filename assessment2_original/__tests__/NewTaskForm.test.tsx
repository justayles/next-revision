import { fireEvent, render, screen } from '@testing-library/react';
import { NewTaskForm } from '../components/NewTaskForm';

jest.mock('../actions', () => ({
  createTask: jest.fn(),
}));

describe('NewTaskForm', () => {
  it('lets the user type a title', () => {
    const { container } = render(<NewTaskForm />);

    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Ship it' } });

    expect(input.value).toBe('Ship it');
  });

  it('renders a styled submit button', () => {
    render(<NewTaskForm />);

    const button = screen.getByTestId('submit-button');
    expect(button.className).toContain('bg-black');
    expect(button.textContent).toBe('Create task');
  });

  it('has a priority dropdown defaulting to medium', () => {
    const { container } = render(<NewTaskForm />);

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('medium');
    expect(container.querySelectorAll('option')).toHaveLength(3);
  });
});
