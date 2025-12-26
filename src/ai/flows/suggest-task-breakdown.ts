import { ai } from '../genkit';
import { z } from 'zod';

const SuggestTaskBreakdownInputSchema = z.object({
  taskName: z.string().describe('The name of the task to break down'),
  taskDetails: z.string().optional().describe('Additional details about the task'),
  projectContext: z.string().optional().describe('Context about the project this task belongs to'),
});

const SuggestTaskBreakdownOutputSchema = z.object({
  subtasks: z.array(
    z.object({
      name: z.string().describe('Name of the subtask'),
      details: z.string().optional().describe('Brief description of what this subtask involves'),
      estimatedEnergy: z.enum(['Low', 'Medium', 'High']).describe('Estimated energy level needed'),
      order: z.number().describe('Suggested order (1, 2, 3, etc.)'),
    })
  ).describe('Suggested subtasks to break down the main task'),
  reasoning: z.string().describe('Brief explanation of the breakdown approach'),
});

export const suggestTaskBreakdown = ai.defineFlow(
  {
    name: 'suggestTaskBreakdown',
    inputSchema: SuggestTaskBreakdownInputSchema,
    outputSchema: SuggestTaskBreakdownOutputSchema,
  },
  async (input) => {
    const { response } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `You are a productivity assistant helping users break down large tasks into manageable subtasks.

Task to break down:
Name: ${input.taskName}
${input.taskDetails ? `Details: ${input.taskDetails}` : ''}
${input.projectContext ? `Project Context: ${input.projectContext}` : ''}

Please suggest 3-6 logical subtasks that:
1. Break the main task into clear, actionable steps
2. Follow a logical sequence (what should be done first, second, etc.)
3. Are small enough to complete in one focused work session (1-3 hours)
4. Have clear completion criteria

For each subtask, estimate the energy level needed:
- High: Requires deep focus, creative thinking, or complex problem-solving
- Medium: Requires moderate concentration and effort
- Low: Routine work, simple tasks, or administrative work

Provide a brief explanation of your breakdown approach.`,
      output: {
        schema: SuggestTaskBreakdownOutputSchema,
      },
    });

    return response;
  }
);
