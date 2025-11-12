'use server';

import { revalidatePath } from 'next/cache';
import {
  getTasks,
  updateTodaysReport,
  updateUserProfile,
} from '@/lib/data-firestore-server';
import type { DailyReport } from '@/lib/types';
import { scoreAndSuggestTasks as scoreAndSuggestTasksFlow } from '@/ai/flows/suggest-tasks-based-on-energy';
import { visualizeFlowAlignment } from '@/ai/flows/visualize-flow-alignment';
import { generateDailyWorkSummary as generateDailyWorkSummaryFlow } from '@/ai/flows/generate-daily-work-summary';
import { getDb } from '@/firebase/server-init';
import { format, parseISO } from 'date-fns';

// This function is called from a client-side data mutation, so it needs to revalidate paths
// and perform any server-side logic after a task is completed.
export async function onTaskCompleted(userId: string) {
    // Momentum score is now calculated on the client side.
    // This server action is now only responsible for revalidating paths.
    revalidatePath('/');
    revalidatePath('/analytics');
    revalidatePath('/projects');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
}

export async function onClientWrite() {
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/recurring');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
    revalidatePath('/profile');
    revalidatePath('/analytics');
}

export async function updateUserProfileAction(userId: string, updates: { displayName: string }) {
  const db = getDb();
  await updateUserProfile(db, userId, updates);
  revalidatePath('/profile');
  revalidatePath('/'); // To update name in sidebar etc.
}


export async function generateReportAction(userId: string, reportDate: string) {
  const db = getDb();
  const allTasks = await getTasks(db, userId);

  // Note: This logic assumes tasks for the report are those created on that day.
  // This could be adjusted based on more complex business logic if needed.
  const relevantTasks = (allTasks || []).filter(t => t.createdAt && format(parseISO(t.createdAt), 'yyyy-MM-dd') === reportDate);
  const completedTasks = relevantTasks.filter(t => t.completed).map(t => t.name);
  const inProgressTasks = relevantTasks.filter(t => !t.completed).map(t => t.name);

  const reportRef = db.collection('users').doc(userId).collection('reports').doc(reportDate);
  const reportSnap = await reportRef.get();
  const reportData = reportSnap.data() as DailyReport;

  const result = await generateDailyWorkSummaryFlow({
    startTime: reportData?.startTime ? format(parseISO(reportData.startTime), 'p') : null,
    endTime: reportData?.endTime ? format(parseISO(reportData.endTime), 'p') : null,
    completedTasks,
    inProgressTasks,
  });

  if (result.report) {
    await updateTodaysReport(db, userId, { generatedReport: result.report }, reportDate);
  }

  revalidatePath('/reports');

  return result.report;
}
