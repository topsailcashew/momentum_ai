
'use server';

import { revalidatePath } from 'next/cache';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  setTodayEnergy,
  getEnergyLog,
  getTodayEnergy,
  getLatestMomentum,
  saveMomentumScore,
  addProject,
  getProjects,
  updateProject,
  deleteProject,
  addRecurringTask,
  updateRecurringTask,
  getRecurringTasks,
  updateTodaysReport,
  updateUserProfile,
  getTodaysReport,
} from '@/lib/data-firestore-server';
import type { DailyReport, EnergyLevel, Project, RecurringTask, Task, ScoreAndSuggestTasksInput } from '@/lib/types';
import { scoreAndSuggestTasks as scoreAndSuggestTasksFlow } from '@/ai/flows/suggest-tasks-based-on-energy';
import { calculateDailyMomentumScore } from '@/ai/flows/calculate-daily-momentum-score';
import { visualizeFlowAlignment } from '@/ai/flows/visualize-flow-alignment';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { getDb } from '@/firebase/server-init';

// Note: Using data-firestore-server.ts which is compatible with Firebase Admin SDK
// This is required because Next.js server actions cannot use client-side Firebase


export async function setEnergyLevelAction(userId: string, level: EnergyLevel) {
  await setTodayEnergy(getDb(), userId, level);
  revalidatePath('/');
}

export async function createTaskAction(userId: string, data: Omit<Task, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt'>): Promise<Task> {
  const db = getDb();
  const newTask = await addTask(db, userId, data);
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/reports');
  revalidatePath('/weekly-planner');
  return newTask;
}

export async function updateTaskAction(userId: string, taskId: string, data: Partial<Omit<Task, 'id'>>) {
  await updateTask(getDb(), userId, taskId, data);
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/reports');
  revalidatePath('/weekly-planner');
}

export async function deleteTaskAction(userId: string, taskId: string) {
    await deleteTask(getDb(), userId, taskId);
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
}


async function calculateAndSaveMomentumScore(userId: string) {
    const db = getDb();
    const today = format(new Date(), 'yyyy-MM-dd');
    const allTasks = await getTasks(db, userId);
    const todayEnergy = await getTodayEnergy(db, userId);

    if (!todayEnergy) return;

    const completedToday = allTasks.filter(task => task.completed && task.completedAt && isSameDay(parseISO(task.completedAt), new Date()));
    if(completedToday.length === 0) return;

    const latestMomentum = await getLatestMomentum(db, userId);
    let streak = 1;
    let streakBonus = 0;

    if (latestMomentum) {
        const lastScoreDate = parseISO(latestMomentum.date);
        const yesterday = subDays(new Date(), 1);
        if (isSameDay(lastScoreDate, yesterday)) {
            streak = (latestMomentum.streak || 1) + 1;
        }
    }
    streakBonus = streak > 1 ? streak * 10 : 0;

    const scoreInput = {
        energyLevel: todayEnergy.level,
        completedTasks: completedToday.map(t => ({ taskId: t.id, taskName: t.name, energyLevel: t.energyLevel })),
        streakBonus,
    };

    const aiResult = await calculateDailyMomentumScore(scoreInput);

    await saveMomentumScore(db, userId, {
        score: aiResult.dailyScore,
        summary: aiResult.summary,
        streak: streak
    });
}

export async function completeTaskAction(userId: string, taskId: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;
  await updateTask(getDb(), userId, taskId, { completed, completedAt });

  if (completed) {
      await calculateAndSaveMomentumScore(userId);
  }

  // Update report after completing a task
  await getTodaysReport(getDb(), userId);

  revalidatePath('/');
  revalidatePath('/analytics');
  revalidatePath('/projects');
  revalidatePath('/reports');
  revalidatePath('/weekly-planner');
}

export type ScoreAndSuggestTasksOutput = Awaited<ReturnType<typeof getSuggestedTasks>>;
export async function getSuggestedTasks(input: ScoreAndSuggestTasksInput) {
  const suggestions = await scoreAndSuggestTasksFlow(input);
  return suggestions;
}

export async function getFlowAlignmentReport(userId: string) {
    const db = getDb();
    const [taskData, energyRatingData] = await Promise.all([
        getTasks(db, userId),
        getEnergyLog(db, userId),
    ]);

    const result = await visualizeFlowAlignment({
        taskData: JSON.stringify(taskData),
        energyRatingData: JSON.stringify(energyRatingData),
    });

    return result;
}

export async function createProjectAction(userId: string, name: string): Promise<Project> {
    const db = getDb();
    const newProject = await addProject(db, userId, { name, priority: 'Medium' });
    revalidatePath('/projects');
    revalidatePath('/');
    return newProject;
}

export async function updateProjectAction(userId: string, projectId: string, updates: Partial<Project>) {
    await updateProject(getDb(), userId, projectId, updates);
    revalidatePath('/projects');
    revalidatePath('/');
}

export async function deleteProjectAction(userId: string, projectId: string) {
    await deleteProject(getDb(), userId, projectId);
    revalidatePath('/projects');
    revalidatePath('/');
}

export async function createRecurringTaskAction(userId: string, data: Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId'>): Promise<RecurringTask> {
    const db = getDb();
    const newTask = await addRecurringTask(db, userId, data);
    revalidatePath('/recurring');
    return newTask;
}

export async function completeRecurringTaskAction(userId: string, taskId: string) {
    await updateRecurringTask(getDb(), userId, taskId, { lastCompleted: new Date().toISOString() });
    revalidatePath('/recurring');
}

export async function updateReportAction(userId: string, updates: Partial<DailyReport>) {
  const updatedReport = await updateTodaysReport(getDb(), userId, updates);
  revalidatePath('/');
  revalidatePath('/reports');
  return updatedReport;
}

export async function updateUserProfileAction(userId: string, updates: { displayName: string }) {
  const db = getDb();
  await updateUserProfile(db, userId, updates);
  revalidatePath('/profile');
  revalidatePath('/'); // To update name in sidebar etc.
}
