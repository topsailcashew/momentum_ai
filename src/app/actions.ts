'use server';

import { revalidatePath } from 'next/cache';
import {
  getTasks,
  addProject,
  getProjects,
  updateProject,
  deleteProject,
  addRecurringTask,
  getRecurringTasks,
  updateTodaysReport,
  updateUserProfile,
  getTodaysReport,
  getEnergyLog,
  getLatestMomentum,
  setTodayEnergy,
  saveMomentumScore,
  deleteTask,
} from '@/lib/data-firestore-server';
import type { EnergyLevel, Project, RecurringTask, Task, ScoreAndSuggestTasksInput, DailyReport } from '@/lib/types';
import { scoreAndSuggestTasks as scoreAndSuggestTasksFlow } from '@/ai/flows/suggest-tasks-based-on-energy';
import { calculateDailyMomentumScore } from '@/ai/flows/calculate-daily-momentum-score';
import { visualizeFlowAlignment } from '@/ai/flows/visualize-flow-alignment';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { getDb } from '@/firebase/server-init';

// Note: Using data-firestore-server.ts which is compatible with Firebase Admin SDK
// This is required because Next.js server actions cannot use client-side Firebase


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

// This function is called from a client-side data mutation, so it needs to revalidate paths
// and perform any server-side logic after a task is completed.
export async function onTaskCompleted(userId: string) {
    await calculateAndSaveMomentumScore(userId);
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


export async function onClientWrite() {
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/recurring');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
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
