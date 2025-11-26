'use server';

/**
 * @fileOverview Generates an end-of-day report based on completed and incomplete tasks with notes.
 *
 * - generateEndOfDayReport - Generates a comprehensive daily report.
 * - GenerateEndOfDayReportInput - The input type for generateEndOfDayReport.
 * - GenerateEndOfDayReportOutput - The return type for generateEndOfDayReport.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEndOfDayReportInputSchema = z.object({
  completedTasks: z.array(
    z.object({
      taskId: z.string().describe('The ID of the completed task.'),
      taskName: z.string().describe('The name of the completed task'),
      category: z.string().describe('The category of the task'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level associated with the task.'),
      notes: z.string().describe('User notes about the task'),
      completedAt: z.string().optional().describe('The ISO timestamp when the task was completed'),
      deadline: z.string().optional().describe('The deadline for the task if one was set'),
    })
  ).describe('Tasks completed today with user notes'),
  incompleteTasks: z.array(
    z.object({
      taskId: z.string().describe('The ID of the incomplete task.'),
      taskName: z.string().describe('The name of the incomplete task'),
      category: z.string().describe('The category of the task'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The energy level associated with the task.'),
      notes: z.string().describe('User notes about why the task was not completed'),
      deadline: z.string().optional().describe('The deadline for the task if one was set'),
    })
  ).describe('Tasks not completed today with user notes'),
});
export type GenerateEndOfDayReportInput = z.infer<typeof GenerateEndOfDayReportInputSchema>;

const GenerateEndOfDayReportOutputSchema = z.object({
  report: z.string().describe('A comprehensive, encouraging daily report summarizing the user\'s workday'),
});
export type GenerateEndOfDayReportOutput = z.infer<typeof GenerateEndOfDayReportOutputSchema>;

export async function generateEndOfDayReport(input: GenerateEndOfDayReportInput): Promise<GenerateEndOfDayReportOutput> {
  return generateEndOfDayReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEndOfDayReportPrompt',
  input: {schema: GenerateEndOfDayReportInputSchema},
  output: {schema: GenerateEndOfDayReportOutputSchema},
  prompt: `You are an encouraging AI productivity coach generating an end-of-day report for the user.

Create a comprehensive but concise report that:
1. Celebrates what was accomplished today, including WHEN tasks were completed (show completion times)
2. Summarizes key learnings or progress from the user's notes
3. Acknowledges incomplete tasks with empathy and encouragement, noting any missed deadlines
4. Provides 2-3 actionable insights or suggestions for tomorrow
5. Ends with an encouraging, motivating message

Keep the tone supportive, personal, and energizing. Format the report with clear sections and markdown.

## Today's Tasks

### Completed Tasks:
{{#each completedTasks}}
- **{{taskName}}** ({{category}} | {{energyLevel}} Energy){{#if completedAt}} - Completed at {{completedAt}}{{/if}}{{#if deadline}} - Deadline: {{deadline}}{{/if}}
  Notes: {{notes}}
{{/each}}

### Incomplete Tasks:
{{#each incompleteTasks}}
- **{{taskName}}** ({{category}} | {{energyLevel}} Energy){{#if deadline}} - Deadline: {{deadline}}{{/if}}
  Notes: {{notes}}
{{/each}}

When generating the report:
- For completed tasks, mention the completion time to help the user see their daily activity timeline
- Highlight any tasks completed before/after their deadlines
- For incomplete tasks with deadlines, acknowledge the deadline in your summary

Generate a report that helps the user reflect on their day and feel motivated for tomorrow.
`,
});

const generateEndOfDayReportFlow = ai.defineFlow(
  {
    name: 'generateEndOfDayReportFlow',
    inputSchema: GenerateEndOfDayReportInputSchema,
    outputSchema: GenerateEndOfDayReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      return { report: 'Unable to generate report. Please try again.' };
    }
    return output;
  }
);
