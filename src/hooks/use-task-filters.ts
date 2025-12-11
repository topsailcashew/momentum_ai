/**
 * @fileOverview Custom hook for task filtering logic
 * Reduces duplication of task filtering patterns across components
 */

import { useMemo } from 'react';
import type { Task, EnergyLevel } from '@/lib/types';

export type TaskFilterType = EnergyLevel | 'all';

interface UseTaskFiltersOptions {
  tasks: Task[];
  filterBy?: TaskFilterType;
  includeCompleted?: boolean;
}

interface UseTaskFiltersReturn {
  filteredTasks: Task[];
  incompleteTasks: Task[];
  completedTasks: Task[];
  filterByEnergy: (energyLevel: TaskFilterType) => Task[];
  filterByCompletion: (completed: boolean) => Task[];
}

/**
 * Custom hook for filtering tasks with common patterns
 *
 * @param options - Configuration options for task filtering
 * @returns Filtered task arrays and utility functions
 *
 * @example
 * const { filteredTasks, incompleteTasks, completedTasks } = useTaskFilters({
 *   tasks: allTasks,
 *   filterBy: 'High',
 *   includeCompleted: false
 * });
 */
export function useTaskFilters(options: UseTaskFiltersOptions): UseTaskFiltersReturn {
  const { tasks, filterBy = 'all', includeCompleted = true } = options;

  const incompleteTasks = useMemo(() =>
    tasks.filter(task => !task.completed),
    [tasks]
  );

  const completedTasks = useMemo(() =>
    tasks.filter(task => task.completed),
    [tasks]
  );

  const filterByEnergy = useMemo(() => {
    return (energyLevel: TaskFilterType) => {
      if (energyLevel === 'all') {
        return includeCompleted ? tasks : incompleteTasks;
      }
      const filtered = tasks.filter(task => task.energyLevel === energyLevel);
      return includeCompleted ? filtered : filtered.filter(task => !task.completed);
    };
  }, [tasks, incompleteTasks, includeCompleted]);

  const filterByCompletion = useMemo(() => {
    return (completed: boolean) =>
      tasks.filter(task => task.completed === completed);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return filterByEnergy(filterBy);
  }, [filterByEnergy, filterBy]);

  return {
    filteredTasks,
    incompleteTasks,
    completedTasks,
    filterByEnergy,
    filterByCompletion,
  };
}
