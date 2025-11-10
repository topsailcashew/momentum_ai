'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting tasks based on the user's self-reported energy level.
 *
 * It exports:
 * - `scoreAndSuggestTasks`: An async function to generate task suggestions based on energy level and other factors.
 * - `ScoreAndSuggestTasksInput`: The TypeScript type for the input schema.
 * - `ScoreAndSuggestTasksOutput`: The TypeScript type for the output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Project, Task } from '@/lib/types';

const ScoreAndSuggestTasksInputSchema = z.object({
  energyLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe("The user's selected energy level (Low, Medium, or High)."),
  tasks: z.array(z.custom<Task>()).describe('The list of available tasks.'),
  projects: z.array(z.custom<Project>()).describe('The list of available projects.'),
  completedTasks: z.array(z.custom<Task>()).describe('A list of recently completed tasks to learn from.'),
});
export type ScoreAndSuggestTasksInput = z.infer<typeof ScoreAndSuggestTasksInputSchema>;

const ScoreAndSuggestTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.custom<Task>())
    .describe('An array of task objects that are most appropriate for the given energy level and other factors, sorted by score.'),
});
export type ScoreAndSuggestTasksOutput = z.infer<typeof ScoreAndSuggestTasksOutputSchema>;

export async function scoreAndSuggestTasks(
  input: ScoreAndSuggestTasksInput
): Promise<ScoreAndSuggestTasksOutput> {
  return scoreAndSuggestTasksFlow(input);
}

const scoreAndSuggestTasksFlow = ai.defineFlow(
  {
    name: 'scoreAndSuggestTasksFlow',
    inputSchema: ScoreAndSuggestTasksInputSchema,
    outputSchema: ScoreAndSuggestTasksOutputSchema,
  },
  async ({tasks, projects, energyLevel, completedTasks}) => {

    const relevantCompletedTasks = completedTasks.filter(task => task.energyLevel === energyLevel);
    
    let preferredFocus: string | null = null;
    let preferredEffort: number | null = null;

    if (relevantCompletedTasks.length > 0) {
        const focusCounts: Record<string, number> = {};
        const effortCounts: Record<string, number> = {};

        relevantCompletedTasks.forEach(task => {
            if (task.focusType) {
                focusCounts[task.focusType] = (focusCounts[task.focusType] || 0) + 1;
            }
            if (task.effort) {
                effortCounts[task.effort] = (effortCounts[task.effort] || 0) + 1;
            }
        });

        if (Object.keys(focusCounts).length > 0) {
            preferredFocus = Object.keys(focusCounts).reduce((a, b) => focusCounts[a] > focusCounts[b] ? a : b);
        }
        if (Object.keys(effortCounts).length > 0) {
            const preferredEffortStr = Object.keys(effortCounts).reduce((a, b) => effortCounts[a] > effortCounts[b] ? a : b);
            preferredEffort = parseInt(preferredEffortStr, 10);
        }
    }


    const scoredTasks = tasks
        .filter(task => !task.completed)
        .map(task => {
            const energyMatch = task.energyLevel === energyLevel ? 1 : 0;

            let urgency = 0;
            if (task.deadline) {
                const deadline = new Date(task.deadline);
                const today = new Date();
                const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 1) urgency = 1;
                else if (diffDays <= 3) urgency = 0.7;
                else if (diffDays <= 7) urgency = 0.4;
                else urgency = 0.1;
            }

            const project = projects.find(p => p.id === task.projectId);
            const projectPriority = project?.priority === 'High' ? 1 : (project?.priority === 'Medium' ? 0.5 : 0.1);
            
            const focusMatch = (preferredFocus && task.focusType === preferredFocus) ? 0.2 : 0;
            const effortMatch = (preferredEffort && task.effort === preferredEffort) ? 0.1 : 0;
            const adaptiveBonus = focusMatch + effortMatch;

            const score = (energyMatch * 0.5) + (urgency * 0.3) + (projectPriority * 0.2) + adaptiveBonus;

            return {...task, score};
        });

    const sortedTasks = scoredTasks.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
        suggestedTasks: sortedTasks.slice(0, 5) // Return top 5 suggestions
    }
  }
);
