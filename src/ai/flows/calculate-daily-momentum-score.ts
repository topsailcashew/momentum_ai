'use server';

/**
 * @fileOverview Calculates a daily momentum score based on task-energy alignment.
 *
 * - calculateDailyMomentumScore - Calculates the daily momentum score.
 * - CalculateDailyMomentumScoreInput - The input type for calculateDailyMomentumScore.
 * - CalculateDailyMomentumScoreOutput - The return type for calculateDailyMomentumScore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { validateAIResponseWithFallback } from '@/ai/validation-helpers';

const CalculateDailyMomentumScoreInputSchema = z.object({
  energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The user\'s reported energy level for the day.'),
  completedTasks: z.array(
    z.object({
      taskId: z.string().describe('The ID of the completed task.'),
      taskName: z.string().describe('The name of the completed task'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level associated with the task.'),
    })
  ).describe('An array of tasks completed on the given day, along with their associated energy levels.'),
  streakBonus: z.number().min(0).describe('Bonus to add for maintaining a score streak'),
});
export type CalculateDailyMomentumScoreInput = z.infer<typeof CalculateDailyMomentumScoreInputSchema>;

const CalculateDailyMomentumScoreOutputSchema = z.object({
  dailyScore: z.number().describe('The calculated daily momentum score.'),
  summary: z.string().describe('A summary of the user\'s task-energy alignment for the day.'),
});
export type CalculateDailyMomentumScoreOutput = z.infer<typeof CalculateDailyMomentumScoreOutputSchema>;

export async function calculateDailyMomentumScore(input: CalculateDailyMomentumScoreInput): Promise<CalculateDailyMomentumScoreOutput> {
  return calculateDailyMomentumScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateDailyMomentumScorePrompt',
  input: {schema: CalculateDailyMomentumScoreInputSchema},
  output: {schema: CalculateDailyMomentumScoreOutputSchema},
  prompt: `You are an AI assistant that analyzes a user's task completion data for the day and calculates a daily momentum score based on how well their completed tasks aligned with their reported energy levels. The score reflects how effectively the user is using their energy and identifies areas for improvement.

  Energy Level: {{{energyLevel}}}
  Completed Tasks: {{#each completedTasks}}- Task Id: {{taskId}}, Task Name: {{taskName}}, Energy Level: {{energyLevel}}{{/each}}

  Streak Bonus: {{{streakBonus}}}

  Consider how many tasks match the reported energy level and incorporate the streak bonus.  Provide a summary that provides encouragement and suggestions for improvement.
`,
});

const calculateDailyMomentumScoreFlow = ai.defineFlow(
  {
    name: 'calculateDailyMomentumScoreFlow',
    inputSchema: CalculateDailyMomentumScoreInputSchema,
    outputSchema: CalculateDailyMomentumScoreOutputSchema,
  },
  async input => {
    
    const { completedTasks, energyLevel, streakBonus } = input;
    const totalTasks = completedTasks.length;

    if (totalTasks === 0) {
      return { dailyScore: 0, summary: "No tasks completed yet. Let's get started!" };
    }

    const alignedTasks = completedTasks.filter(task => task.energyLevel === energyLevel).length;

    const baseScore = (alignedTasks / totalTasks) * 100;
    
    // Apply streak bonus, ensuring score doesn't exceed a cap (e.g., 150)
    const finalScore = Math.min(150, Math.round(baseScore + streakBonus));

    const {output} = await prompt(input);

    // Validate the AI-generated summary with fallback
    const validatedOutput = validateAIResponseWithFallback(
      output,
      CalculateDailyMomentumScoreOutputSchema,
      { dailyScore: finalScore, summary: "Task-energy alignment summary unavailable." },
      'calculateDailyMomentumScore'
    );

    // Use calculated score but validated summary
    return {
      dailyScore: finalScore,
      summary: validatedOutput.summary,
    };
  }
);
