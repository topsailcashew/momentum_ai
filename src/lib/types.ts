import { z } from 'zod';

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
  deadline?: string;
  collaboration?: string;
  details?: string;
  score?: number; // AI-generated score
  priority?: EisenhowerMatrix;
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
  deadline?: string;
  collaboration?: string;
  details?: string;
  priority?: EisenhowerMatrix;
}

export interface WorkdayTask {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  taskId: string; // References task in tasks or recurring-tasks collection
  taskType: 'regular' | 'recurring';
  notes: string | null; // Notes added at end of day
  addedAt: string; // ISO timestamp
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
