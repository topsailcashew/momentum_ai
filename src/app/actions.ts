
'use server';

import { revalidatePath } from 'next/cache';
import type { DailyReport, ScoreAndSuggestTasksInput, Task } from '@/lib/types';
import { scoreAndSuggestTasks as scoreAndSuggestTasksFlow } from '@/ai/flows/suggest-tasks-based-on-energy';
import { updateUserProfile } from '@/lib/data-firestore';
import { generateEmailReport as generateEmailReportFlow } from '@/ai/flows/generate-email-report';
import { EmailTemplate } from '@/components/reports/email-template';
import { Resend } from 'resend';

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

export async function updateUserProfileAction(userId: string, updates: { displayName?: string, photoURL?: string }) {
  const { initializeApp, getApps } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  const { firebaseConfig } = await import('@/firebase/config');

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  const firestore = getFirestore();
  await updateUserProfile(firestore, userId, updates);
  revalidatePath('/profile');
  revalidatePath('/'); // To update name in sidebar etc.
}

export async function getSuggestedTasks(input: ScoreAndSuggestTasksInput) {
    return await scoreAndSuggestTasksFlow(input);
}


export async function generateEmailReportAction(report: DailyReport, tasks: Task[], user: {displayName: string | null | undefined, email: string | null | undefined}) {
    const emailBody = await generateEmailReportFlow({ report, tasks: tasks.map(t => ({ ...t, energyLevel: t.energyLevel || 'Medium', category: t.category || 'personal' })), user });
    return emailBody;
}

export async function emailReportAction(report: DailyReport, emailBody: string, userName: string, userEmail: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Validate email address
    if (!userEmail || !userEmail.includes('@')) {
        console.error('Invalid user email:', userEmail);
        return { success: false, error: 'Invalid email address. Please update your profile.' };
    }

    try {
        await resend.emails.send({
            from: 'Pace Pilot Reports <reports@resend.dev>',
            to: userEmail,
            subject: `Daily Work Report for ${report.date} from ${userName}`,
            html: emailBody,
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: 'Failed to send email.' };
    }
}
