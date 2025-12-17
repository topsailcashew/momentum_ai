import { z } from 'zod';
import type { TaskState, StateHistoryEntry, WaitingInfo } from '@/types/task-state';

export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type ProjectPriority = 'Low' | 'Medium' | 'High';
export type EisenhowerMatrix = 'Urgent & Important' | 'Important & Not Urgent' | 'Urgent & Not Important' | 'Not Urgent & Not Important';

export interface Task {
  id: string;
  userId: string;
  name: string;
  category?: string;
  energyLevel?: EnergyLevel;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  projectId?: string;
  ministryId?: string;
  owner?: string;
  startDate?: string;
  deadline?: string;
  collaboration?: string;
  details?: string;
  score?: number; // AI-generated score
  priority?: EisenhowerMatrix;
  status?: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  notes?: string;
  focusedTimeMs?: number; // NEW - cumulative focused time across all instances
  lastFocusedAt?: string; // NEW
  timeSpentMs?: number; // Time spent on specific workday instance (merged from WorkdayTask)

  // NEW STATE FIELDS
  state: TaskState;
  stateHistory: StateHistoryEntry[];

  // ENHANCED COLLABORATION FIELDS
  assignedTo?: string; // User ID
  assignedToName?: string; // Cached display name
  assignedToPhotoURL?: string; // Cached avatar

  waitingOn?: WaitingInfo;

  blockedTasks?: string[]; // Task IDs that are waiting on this one
}

export interface Category {
  id: string;
  name: string;
}

export interface EnergyLog {
  date: string; // YYYY-MM-DD
  level: EnergyLevel;
  userId: string;
}

export interface MomentumScore {
  date: string; // YYYY-MM-DD
  score: number;
  streak: number;
  summary: string;
  userId: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  priority: ProjectPriority;
  ministryId?: string;
  owner?: string;
  startDate?: string;
  dueDate?: string;
  status?: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  description?: string;
}

export interface RecurringTask {
  id: string;
  userId: string;
  name: string;
  category?: string;
  energyLevel?: EnergyLevel;
  frequency: 'Weekly' | 'Monthly';
  lastCompleted: string | null;
  createdAt: string;
  projectId?: string;
  ministryId?: string;
  owner?: string;
  startDate?: string;
  deadline?: string;
  collaboration?: string;
  details?: string;
  priority?: EisenhowerMatrix;
  status?: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  notes?: string;
  focusedTimeMs?: number; // NEW
  lastFocusedAt?: string; // NEW
}

export interface WorkdayTask {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  taskId: string; // References task in tasks or recurring-tasks collection
  taskType: 'regular' | 'recurring';
  notes: string | null; // Notes added at end of day
  addedAt: string; // ISO timestamp
  timeSpentMs?: number; // NEW: Time spent on this specific workday instance
  completedAt?: string; // NEW: ISO - when marked complete today
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  userId: string;
  startTime: string | null;
  endTime: string | null;
  generatedReport: string | null;
  goals: number;
  completed: number;
  taskNotes?: Record<string, string>; // Map of taskId to notes
  completedTaskIds?: string[];
  incompletedTaskIds?: string[];
  workdayStartTime?: string; // NEW: ISO - set ONLY by morning modal
  workdayEndTime?: string; // EXISTING: Set by end day dialog (redundant with endTime?) keep consistent
  currentFocusedTaskId?: string; // NEW: Currently focused task
  currentFocusedTaskType?: 'regular' | 'recurring'; // NEW
  focusStartedAt?: string; // NEW: ISO - when current focus began
  currentEnergyLevel?: EnergyLevel; // Current energy level
  energyHistory?: Array<{ level: EnergyLevel; timestamp: string }>; // Energy level changes throughout the day
  lastEnergyCheck?: string; // ISO timestamp of last energy check
  dailyGoalsText?: string; // NEW: User's written goals from morning modal
}

export interface UserPreferences {
  timerChimesEnabled: boolean;
  notificationsEnabled: boolean;
  hasSeenMorningModal: string; // YYYY-MM-DD
}

export const ScoreAndSuggestTasksInputSchema = z.object({
  energyLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe("The user's selected energy level (Low, Medium, or High)."),
  tasks: z.array(z.custom<Task>()).describe('The list of available tasks.'),
  projects: z.array(z.custom<Project>()).describe('The list of available projects.'),
  completedTasks: z.array(z.custom<Task>()).describe('A list of recently completed tasks to learn from.'),
});
export type ScoreAndSuggestTasksInput = z.infer<typeof ScoreAndSuggestTasksInputSchema>;

// Ministry Types
export interface Ministry {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  color?: string;
}

export interface StrategicPlan {
  id: string;
  ministryId: string;
  userId: string;
  title: string;
  visionStatement?: string;
  missionStatement?: string;
  startDate?: string;
  endDate?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  extractedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicGoal {
  id: string;
  planId: string;
  ministryId: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface StrategicMetric {
  id: string;
  goalId: string;
  planId: string;
  ministryId: string;
  userId: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  lastUpdated: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  planId: string;
  ministryId: string;
  userId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  description?: string;
}

// Notification Types
export type NotificationType =
  | 'task_deadline'
  | 'end_day_reminder'
  | 'recurring_task'
  | 'milestone_achieved'
  | 'incomplete_tasks'
  | 'weekly_planning';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  relatedTaskId?: string;
  relatedProjectId?: string;
}
