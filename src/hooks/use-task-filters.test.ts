import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskFilters } from './use-task-filters';
import { createMockTask } from '@/test/fixtures';

describe('useTaskFilters', () => {
  const mockTasks = [
    createMockTask({ name: 'High Energy Task', energyLevel: 'High', completed: false }),
    createMockTask({ name: 'Medium Energy Task', energyLevel: 'Medium', completed: false }),
    createMockTask({ name: 'Low Energy Task', energyLevel: 'Low', completed: false }),
    createMockTask({ name: 'Completed High Task', energyLevel: 'High', completed: true }),
    createMockTask({ name: 'Completed Medium Task', energyLevel: 'Medium', completed: true }),
  ];

  describe('basic filtering', () => {
    it('should return all tasks when filterBy is "all" and includeCompleted is true', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'all', includeCompleted: true })
      );

      expect(result.current.filteredTasks).toHaveLength(5);
    });

    it('should exclude completed tasks when includeCompleted is false', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'all', includeCompleted: false })
      );

      expect(result.current.filteredTasks).toHaveLength(3);
      expect(result.current.filteredTasks.every(t => !t.completed)).toBe(true);
    });

    it('should use default values when options are not provided', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks })
      );

      // Default: filterBy='all', includeCompleted=true
      expect(result.current.filteredTasks).toHaveLength(5);
    });
  });

  describe('energy level filtering', () => {
    it('should filter by High energy level', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'High', includeCompleted: true })
      );

      expect(result.current.filteredTasks).toHaveLength(2);
      expect(result.current.filteredTasks.every(t => t.energyLevel === 'High')).toBe(true);
    });

    it('should filter by Medium energy level', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'Medium', includeCompleted: true })
      );

      expect(result.current.filteredTasks).toHaveLength(2);
      expect(result.current.filteredTasks.every(t => t.energyLevel === 'Medium')).toBe(true);
    });

    it('should filter by Low energy level', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'Low', includeCompleted: true })
      );

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0].energyLevel).toBe('Low');
    });

    it('should filter by energy level and exclude completed', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, filterBy: 'High', includeCompleted: false })
      );

      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0].completed).toBe(false);
      expect(result.current.filteredTasks[0].energyLevel).toBe('High');
    });
  });

  describe('separated task arrays', () => {
    it('should provide incompleteTasks array', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks })
      );

      expect(result.current.incompleteTasks).toHaveLength(3);
      expect(result.current.incompleteTasks.every(t => !t.completed)).toBe(true);
    });

    it('should provide completedTasks array', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks })
      );

      expect(result.current.completedTasks).toHaveLength(2);
      expect(result.current.completedTasks.every(t => t.completed)).toBe(true);
    });
  });

  describe('utility functions', () => {
    it('should provide filterByEnergy function', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, includeCompleted: true })
      );

      const highEnergyTasks = result.current.filterByEnergy('High');
      expect(highEnergyTasks).toHaveLength(2);
      expect(highEnergyTasks.every(t => t.energyLevel === 'High')).toBe(true);
    });

    it('filterByEnergy should respect includeCompleted option', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks, includeCompleted: false })
      );

      const highEnergyTasks = result.current.filterByEnergy('High');
      expect(highEnergyTasks).toHaveLength(1);
      expect(highEnergyTasks[0].completed).toBe(false);
    });

    it('should provide filterByCompletion function', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: mockTasks })
      );

      const completed = result.current.filterByCompletion(true);
      const incomplete = result.current.filterByCompletion(false);

      expect(completed).toHaveLength(2);
      expect(incomplete).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty task array', () => {
      const { result } = renderHook(() =>
        useTaskFilters({ tasks: [] })
      );

      expect(result.current.filteredTasks).toHaveLength(0);
      expect(result.current.incompleteTasks).toHaveLength(0);
      expect(result.current.completedTasks).toHaveLength(0);
    });

    it('should handle tasks with missing energy levels', () => {
      const tasksWithMissingEnergy = [
        createMockTask({ energyLevel: undefined as any }),
      ];

      const { result } = renderHook(() =>
        useTaskFilters({ tasks: tasksWithMissingEnergy, filterBy: 'High' })
      );

      expect(result.current.filteredTasks).toHaveLength(0);
    });

    it('should update when tasks prop changes', () => {
      const { result, rerender } = renderHook(
        ({ tasks }) => useTaskFilters({ tasks }),
        { initialProps: { tasks: mockTasks } }
      );

      expect(result.current.filteredTasks).toHaveLength(5);

      const newTasks = [createMockTask()];
      rerender({ tasks: newTasks });

      expect(result.current.filteredTasks).toHaveLength(1);
    });

    it('should update when filterBy changes', () => {
      const { result, rerender } = renderHook(
        ({ filterBy }) => useTaskFilters({ tasks: mockTasks, filterBy }),
        { initialProps: { filterBy: 'all' as const } }
      );

      expect(result.current.filteredTasks).toHaveLength(5);

      rerender({ filterBy: 'High' });

      expect(result.current.filteredTasks).toHaveLength(2);
    });
  });
});
