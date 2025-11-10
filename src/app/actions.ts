'use server';

import { revalidatePath } from 'next/cache';
import {
  getTasks,
  addTask,
  updateTask,
  setTodayEnergy,
  getEnergyLog,
  getTodayEnergy,
  getLatestMomentum,
  saveMomentumScore,
  getCategories,
  addProject,
  getProjects,
} from '@/lib/data';
import type { EnergyLevel, Task } from '@/lib/types';
import { scoreAndSuggestTasks, ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';
import { calculateDailyMomentumScore } from '@/ai/flows/calculate-daily-momentum-score';
import { visualizeFlowAlignment } from '@/ai/flows/visualize-flow-alignment';
import { subDays, format, isSameDay, parseISO } from 'date-fns';

export async function setEnergyLevelAction(level: EnergyLevel) {
  await setTodayEnergy(level);
  revalidatePath('/');
}

export async function createTaskAction(data: Omit<Task, 'id'| 'completed' | 'completedAt' | 'createdAt'>) {
  await addTask(data);
  revalidatePath('/');
  revalidatePath('/projects');
}

async function calculateAndSaveMomentumScore() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allTasks = await getTasks();
    const todayEnergy = await getTodayEnergy();

    if (!todayEnergy) return;

    const completedToday = allTasks.filter(task => task.completed && task.completedAt && isSameDay(parseISO(task.completedAt), new Date()));
    if(completedToday.length === 0) return;

    const latestMomentum = await getLatestMomentum();
    let streak = 1;
    let streakBonus = 0;

    if (latestMomentum) {
        const lastScoreDate = parseISO(latestMomentum.date);
        const yesterday = subDays(new Date(), 1);
        if (isSameDay(lastScoreDate, yesterday)) {
            streak = latestMomentum.streak + 1;
        }
    }
    streakBonus = streak > 1 ? streak * 10 : 0;

    const scoreInput = {
        energyLevel: todayEnergy.level,
        completedTasks: completedToday.map(t => ({ taskId: t.id, taskName: t.name, energyLevel: t.energyLevel })),
        streakBonus,
    };

    const aiResult = await calculateDailyMomentumScore(scoreInput);

    await saveMomentumScore({
        score: aiResult.dailyScore,
        summary: aiResult.summary,
        streak: streak
    });
}

export async function completeTaskAction(taskId: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;
  await updateTask(taskId, { completed, completedAt });

  if (completed) {
      await calculateAndSaveMomentumScore();
  }

  revalidatePath('/');
  revalidatePath('/analytics');
  revalidatePath('/projects');
}

export async function getSuggestedTasks(energyLevel: EnergyLevel): Promise<ScoreAndSuggestTasksOutput> {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);
  const completedTasks = tasks.filter(t => t.completed);

  const suggestions = await scoreAndSuggestTasks({
    energyLevel,
    tasks: tasks,
    projects: projects,
    completedTasks: completedTasks,
  });

  return suggestions;
}

export async function getFlowAlignmentReport() {
    const [taskData, energyRatingData] = await Promise.all([
        getTasks(),
        getEnergyLog(),
    ]);

    const result = await visualizeFlowAlignment({
        taskData: JSON.stringify(taskData),
        energyRatingData: JSON.stringify(energyRatingData),
    });

    return result;
}

export async function createProjectAction(name: string) {
    await addProject({ name, priority: 'Medium' });
    revalidatePath('/projects');
    revalidatePath('/');
}
