import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickAddTask } from './quick-add-task';

describe('QuickAddTask', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
  });

  describe('rendering', () => {
    it('should render with default placeholder', () => {
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<QuickAddTask onAdd={mockOnAdd} placeholder="Custom placeholder" />);

      const input = screen.getByPlaceholderText('Custom placeholder');
      expect(input).toBeInTheDocument();
    });

    it('should render the Plus icon', () => {
      const { container } = render(<QuickAddTask onAdd={mockOnAdd} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      expect(input).not.toBeDisabled();
    });

    it('should be disabled when isPending is true', () => {
      render(<QuickAddTask onAdd={mockOnAdd} isPending={true} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      expect(input).toBeDisabled();
    });
  });

  describe('task creation', () => {
    it('should call onAdd with task name when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'New Task');
      await user.keyboard('{Enter}');

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
      expect(mockOnAdd).toHaveBeenCalledWith({
        userId: '',
        name: 'New Task',
        state: 'ready',
        stateHistory: [],
      });
    });

    it('should clear input after adding task', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)') as HTMLInputElement;
      await user.type(input, 'New Task{Enter}');

      expect(input.value).toBe('');
    });

    it('should trim whitespace from task name', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, '  Task with spaces  {Enter}');

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Task with spaces',
        })
      );
    });

    it('should not add task when input is empty', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, '{Enter}');

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should not add task when input contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, '   {Enter}');

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should not add task when isPending is true', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} isPending={true} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');

      // Input is disabled, but let's try anyway to ensure the logic works
      fireEvent.change(input, { target: { value: 'New Task' } });
      fireEvent.submit(input.closest('form')!);

      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'Task via Enter{Enter}');

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });

    it('should prevent default form submission behavior', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      const { container } = render(<QuickAddTask onAdd={mockOnAdd} />);
      const form = container.querySelector('form')!;
      form.addEventListener('submit', handleSubmit);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'Test Task{Enter}');

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('input handling', () => {
    it('should update input value as user types', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)') as HTMLInputElement;
      await user.type(input, 'Typing...');

      expect(input.value).toBe('Typing...');
    });

    it('should allow multiple tasks to be added sequentially', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');

      await user.type(input, 'First Task{Enter}');
      await user.type(input, 'Second Task{Enter}');
      await user.type(input, 'Third Task{Enter}');

      expect(mockOnAdd).toHaveBeenCalledTimes(3);
      expect(mockOnAdd).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: 'First Task' }));
      expect(mockOnAdd).toHaveBeenNthCalledWith(2, expect.objectContaining({ name: 'Second Task' }));
      expect(mockOnAdd).toHaveBeenNthCalledWith(3, expect.objectContaining({ name: 'Third Task' }));
    });
  });

  describe('default task data', () => {
    it('should set default state to "ready"', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'Task{Enter}');

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'ready',
        })
      );
    });

    it('should initialize with empty stateHistory', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'Task{Enter}');

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          stateHistory: [],
        })
      );
    });

    it('should set userId to empty string', async () => {
      const user = userEvent.setup();
      render(<QuickAddTask onAdd={mockOnAdd} />);

      const input = screen.getByPlaceholderText('Add a task... (press Enter)');
      await user.type(input, 'Task{Enter}');

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '',
        })
      );
    });
  });
});
