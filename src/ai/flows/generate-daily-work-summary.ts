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
  prompt: `You are an encouraging and positive AI assistant that creates professional, yet motivational, daily work reports. Embellish the summary with positive affirmations and insights based on the user's activity.
  
  Generate a report with the following sections, using the exact section headers including the '##':
  - ## Summary ##: A brief, encouraging overview of the workday (e.g., "Great progress today! You knocked out some important tasks.").
  - ## Work Hours ##: The start and end times. If a time is not provided, state that.
  - ## Completed Tasks ##: A bulleted list of completed tasks, with each task on a new line starting with a '-'. Celebrate the accomplishments.
  - ## What's Next ##: A bulleted list of tasks that are still in progress, with each task on a new line starting with a '-'.
  - ## Blockers ##: A section for the user to manually fill in any blockers.
  - ## Closing Note ##: A final motivational note.
  
  Here is the data for the day:
  Work Start: {{{startTime}}}
  Work End: {{{endTime}}}
  Completed: {{#each completedTasks}}- {{.}}\n{{/each}}
  In Progress: {{#each inProgressTasks}}- {{.}}\n{{/each}}
  
  Your entire output should be a single string, ready to be displayed. Do not use any Markdown formatting like '#', '**', or any other special characters besides the '##' for headers and '-' for lists as specified.
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
