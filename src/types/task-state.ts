// src/types/task-state.ts
import { Timestamp } from 'firebase/firestore';

export type TaskState =
  | 'ready'        // Ready to work on (default)
  | 'in_progress'  // Currently being worked on
  | 'waiting'      // Blocked, waiting on someone/something
  | 'review'       // Ready for review/feedback
  | 'done';        // Completed

export interface StateHistoryEntry {
  state: TaskState;
  timestamp: Timestamp;
  changedBy: string; // User ID
  note?: string; // Optional context
}

export interface WaitingInfo {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  reason: string; // "What do you need?"
  blockedAt: Timestamp;
}

export interface TaskStateConfig {
  state: TaskState;
  color: string;
  icon: string;
  label: string;
  animation?: 'pulse' | 'breathe' | 'shimmer' | 'none';
}

export const TASK_STATE_CONFIGS: Record<TaskState, TaskStateConfig> = {
  ready: {
    state: 'ready',
    color: 'bg-green-500',
    icon: '🟢',
    label: 'Ready',
    animation: 'none',
  },
  in_progress: {
    state: 'in_progress',
    color: 'bg-blue-500',
    icon: '🔵',
    label: 'In Progress',
    animation: 'pulse',
  },
  waiting: {
    state: 'waiting',
    color: 'bg-yellow-500',
    icon: '🟡',
    label: 'Waiting',
    animation: 'breathe',
  },
  review: {
    state: 'review',
    color: 'bg-purple-500',
    icon: '🟣',
    label: 'Review',
    animation: 'shimmer',
  },
  done: {
    state: 'done',
    color: 'bg-gray-400',
    icon: '⚪',
    label: 'Done',
    animation: 'none',
  },
};

// Valid state transitions
export const STATE_TRANSITIONS: Record<TaskState, TaskState[]> = {
  ready: ['in_progress', 'waiting'],
  in_progress: ['done', 'waiting', 'review'],
  waiting: ['ready', 'in_progress'],
  review: ['in_progress', 'done'],
  done: [],
};

export function canTransitionTo(from: TaskState, to: TaskState): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

export function getValidTransitions(currentState: TaskState): TaskState[] {
  return STATE_TRANSITIONS[currentState];
}
