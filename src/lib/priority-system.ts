import type { Task, EisenhowerMatrix, EnergyLevel } from './types';
import { parseISO, differenceInDays, isPast } from 'date-fns';

/**
 * Priority Focus System
 *
 * Calculates task priority based on multiple factors:
 * 1. Eisenhower Matrix (Urgent/Important quadrants)
 * 2. Deadline proximity
 * 3. Energy level matching
 * 4. Task dependencies (subtasks)
 */

interface PriorityFactors {
  eisenhowerScore: number;  // 0-40 points
  deadlineScore: number;    // 0-30 points
  energyScore: number;      // 0-20 points
  dependencyScore: number;  // 0-10 points
}

/**
 * Calculate priority score for a task (0-100)
 * Higher score = higher priority
 */
export function calculateTaskPriority(
  task: Task,
  currentEnergy?: EnergyLevel,
  allTasks?: Task[]
): number {
  // If user manually set priority, use that
  if (task.manualPriorityOverride !== undefined) {
    return task.manualPriorityOverride;
  }

  const factors = calculatePriorityFactors(task, currentEnergy, allTasks);

  const totalScore =
    factors.eisenhowerScore +
    factors.deadlineScore +
    factors.energyScore +
    factors.dependencyScore;

  return Math.min(100, Math.max(0, totalScore));
}

/**
 * Calculate individual priority factors
 */
function calculatePriorityFactors(
  task: Task,
  currentEnergy?: EnergyLevel,
  allTasks?: Task[]
): PriorityFactors {
  return {
    eisenhowerScore: calculateEisenhowerScore(task.priority),
    deadlineScore: calculateDeadlineScore(task.deadline),
    energyScore: calculateEnergyScore(task.energyLevel, currentEnergy),
    dependencyScore: calculateDependencyScore(task, allTasks),
  };
}

/**
 * Eisenhower Matrix scoring (0-40 points)
 */
function calculateEisenhowerScore(priority?: EisenhowerMatrix): number {
  if (!priority) return 15; // Default to medium priority

  const scores: Record<EisenhowerMatrix, number> = {
    'Urgent & Important': 40,           // Do First
    'Important & Not Urgent': 30,       // Schedule
    'Urgent & Not Important': 20,       // Delegate (but still needs attention)
    'Not Urgent & Not Important': 10,   // Eliminate (lowest priority)
  };

  return scores[priority];
}

/**
 * Deadline proximity scoring (0-30 points)
 * Closer deadlines = higher score
 */
function calculateDeadlineScore(deadline?: string): number {
  if (!deadline) return 5; // No deadline = low urgency bonus

  const deadlineDate = parseISO(deadline);
  const daysUntilDeadline = differenceInDays(deadlineDate, new Date());

  // Overdue tasks get maximum score
  if (isPast(deadlineDate)) {
    return 30;
  }

  // Score based on days until deadline
  if (daysUntilDeadline <= 1) return 28;      // Today/Tomorrow
  if (daysUntilDeadline <= 3) return 24;      // This week
  if (daysUntilDeadline <= 7) return 18;      // Next week
  if (daysUntilDeadline <= 14) return 12;     // Two weeks
  if (daysUntilDeadline <= 30) return 8;      // This month

  return 5; // More than a month away
}

/**
 * Energy level matching score (0-20 points)
 * Tasks that match current energy level get higher score
 */
function calculateEnergyScore(
  taskEnergy?: EnergyLevel,
  currentEnergy?: EnergyLevel
): number {
  if (!taskEnergy || !currentEnergy) return 10; // No energy info = neutral

  // Perfect match gets full points
  if (taskEnergy === currentEnergy) return 20;

  // Partial matches
  if (taskEnergy === 'Medium') return 15; // Medium tasks are always reasonable
  if (currentEnergy === 'High' && taskEnergy === 'Medium') return 18; // High energy can do medium
  if (currentEnergy === 'Medium' && taskEnergy === 'Low') return 16; // Medium can do low
  if (currentEnergy === 'Low' && taskEnergy === 'Medium') return 8; // Low energy struggles with medium

  return 5; // Mismatch (e.g., low energy, high task)
}

/**
 * Dependency scoring (0-10 points)
 * Subtasks that are blocking parent tasks get higher priority
 */
function calculateDependencyScore(task: Task, allTasks?: Task[]): number {
  if (!allTasks || allTasks.length === 0) return 5; // No context = neutral

  // If this is a subtask and its parent is high priority
  if (task.isSubtask && task.parentTaskId) {
    const parent = allTasks.find(t => t.id === task.parentTaskId);
    if (parent) {
      const parentPriority = parent.autoCalculatedPriority || 0;
      // Higher parent priority = higher subtask priority
      if (parentPriority >= 70) return 10;
      if (parentPriority >= 50) return 8;
      return 6;
    }
  }

  // If this task has incomplete subtasks, slightly lower priority
  // (focus on subtasks first)
  if (task.subtaskIds && task.subtaskIds.length > 0) {
    const hasIncompleteSubtasks = task.subtaskIds.some(subtaskId => {
      const subtask = allTasks.find(t => t.id === subtaskId);
      return subtask && !subtask.completed;
    });

    if (hasIncompleteSubtasks) return 3; // Lower priority, do subtasks first
  }

  return 5; // Neutral
}

/**
 * Sort tasks by priority (highest to lowest)
 */
export function sortTasksByPriority(
  tasks: Task[],
  currentEnergy?: EnergyLevel
): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityA = a.autoCalculatedPriority ?? calculateTaskPriority(a, currentEnergy, tasks);
    const priorityB = b.autoCalculatedPriority ?? calculateTaskPriority(b, currentEnergy, tasks);

    // Higher priority first
    return priorityB - priorityA;
  });
}

/**
 * Get the next recommended task based on priority
 * Excludes completed tasks and subtasks if parent should be focused
 */
export function getNextRecommendedTask(
  tasks: Task[],
  currentEnergy?: EnergyLevel
): Task | null {
  const incompleteTasks = tasks.filter(t => !t.completed);

  if (incompleteTasks.length === 0) return null;

  const sortedTasks = sortTasksByPriority(incompleteTasks, currentEnergy);

  // Return the highest priority task
  return sortedTasks[0] || null;
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: number): string {
  if (priority >= 80) return 'Critical';
  if (priority >= 60) return 'High';
  if (priority >= 40) return 'Medium';
  if (priority >= 20) return 'Low';
  return 'Very Low';
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: number): string {
  if (priority >= 80) return 'destructive'; // Red
  if (priority >= 60) return 'warning';     // Orange/Yellow
  if (priority >= 40) return 'default';     // Blue
  return 'secondary';                       // Gray
}
