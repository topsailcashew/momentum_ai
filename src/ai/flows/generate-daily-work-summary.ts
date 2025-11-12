'use server';

/**
 * @fileOverview Generates a daily work summary using an AI model.
 *
 * - generateDailyWorkSummary - Generates the summary.
 * - GenerateDailyWorkSummaryInput - The input type for the function.
 * - GenerateDailyWorkSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyWorkSummaryInputSchema = z.object({
  startTime: z.string().nullable().describe('The start time of the workday.'),
  endTime: z.string().nullable().describe('The end time of the workday.'),
  completedTasks: z.array(z.string()).describe('A list of names of tasks completed during the day.'),
  inProgressTasks: z.array(z.string()).describe('A list of names of tasks still in progress.'),
});
export type GenerateDailyWorkSummaryInput = z.infer<typeof GenerateDailyWorkSummaryInputSchema>;

const GenerateDailyWorkSummaryOutputSchema = z.object({
  report: z.string().describe('The formatted daily work summary report as a single string.'),
});
export type GenerateDailyWorkSummaryOutput = z.infer<typeof GenerateDailyWorkSummaryOutputSchema>;

export async function generateDailyWorkSummary(input: GenerateDailyWorkSummaryInput): Promise<GenerateDailyWorkSummaryOutput> {
  return generateDailyWorkSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyWorkSummaryPrompt',
  input: {schema: GenerateDailyWorkSummaryInputSchema},
  output: {schema: GenerateDailyWorkSummaryOutputSchema},
  prompt: `You are an assistant that creates professional, concise daily work reports.
  
  Generate a report in Markdown format with the following sections:
  - Summary: A brief, one-sentence overview of the workday.
  - Work Hours: The start and end times. If a time is not provided, state that.
  - Completed Tasks: A bulleted list of completed tasks.
  - In Progress: A bulleted list of tasks that are still in progress.
  - Blockers: A section for the user to manually fill in any blockers.
  
  Here is the data for the day:
  Work Start: {{{startTime}}}
  Work End: {{{endTime}}}
  Completed: {{#each completedTasks}}- {{.}}{{/each}}
  In Progress: {{#each inProgressTasks}}- {{.}}{{/each}}
  
  Your entire output should be a single string.
`,
});

const generateDailyWorkSummaryFlow = ai.defineFlow(
  {
    name: 'generateDailyWorkSummaryFlow',
    inputSchema: GenerateDailyWorkSummaryInputSchema,
    outputSchema: GenerateDailyWorkSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
