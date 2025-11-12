
'use server';

import { revalidatePath } from 'next/cache';
import type { DailyReport, ScoreAndSuggestTasksInput, Task } from '@/lib/types';
import { scoreAndSuggestTasks as scoreAndSuggestTasksFlow } from '@/ai/flows/suggest-tasks-based-on-energy';
import { generateDailyWorkSummary as generateDailyWorkSummaryFlow } from '@/ai/flows/generate-daily-work-summary';
import { getDb } from '@/firebase/server-init';
import { format, parseISO } from 'date-fns';
import { doc, updateDoc } from 'firebase-admin/firestore';

// This function is called from a client-side data mutation, so it needs to revalidate paths
// and perform any server-side logic after a task is completed.
export async function onTaskCompleted(userId: string) {
    // Momentum score is now calculated on the client side.
    // This server action is now only responsible for revalidating paths.
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
    revalidatePath('/profile');
}

export async function onClientWrite() {
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/recurring');
    revalidatePath('/reports');
    revalidatePath('/weekly-planner');
    revalidatePath('/profile');
}

export async function updateUserProfileAction(userId: string, updates: { displayName: string }) {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  revalidatePath('/profile');
  revalidatePath('/'); // To update name in sidebar etc.
}

interface GenerateReportActionInput {
  userId: string;
  report: DailyReport;
  tasks: Task[];
}

export async function generateReportAction({ userId, report, tasks }: GenerateReportActionInput): Promise<string | null> {
  const completedTasks = (tasks || []).filter(t => t.completed).map(t => t.name);
  const inProgressTasks = (tasks || []).filter(t => !t.completed).map(t => t.name);

  const result = await generateDailyWorkSummaryFlow({
    startTime: report?.startTime ? format(parseISO(report.startTime), 'p') : null,
    endTime: report?.endTime ? format(parseISO(report.endTime), 'p') : null,
    completedTasks,
    inProgressTasks,
  });

  if (result.report) {
    // Return the generated report text to the client to save.
    revalidatePath('/reports');
    return result.report;
  }

  return null;
}


export async function getSuggestedTasks(input: ScoreAndSuggestTasksInput) {
    return await scoreAndSuggestTasksFlow(input);
}
