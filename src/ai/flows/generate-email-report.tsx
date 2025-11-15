/** @jsxImportSource react */
'use server';

/**
 * @fileOverview Generates an HTML email report from daily work data.
 *
 * - generateEmailReport - Generates the email content.
 * - GenerateEmailReportInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { DailyReport, Task } from '@/lib/types';
import { EmailTemplate } from '@/components/reports/email-template';
import {render} from '@react-email/render';


const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  category: z.string(),
  energyLevel: z.enum(['Low', 'Medium', 'High']),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  projectId: z.string().optional(),
  deadline: z.string().optional(),
  effort: z.number().optional(),
  focusType: z.enum(['Creative', 'Analytical', 'Physical', 'Administrative']).optional(),
  score: z.number().optional(),
  priority: z.enum(['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Not Urgent & Not Important']).optional(),
});

const DailyReportSchema = z.object({
    date: z.string(),
    userId: z.string(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    generatedReport: z.string().nullable(),
    goals: z.number(),
    completed: z.number(),
});

const GenerateEmailReportInputSchema = z.object({
  report: DailyReportSchema.describe('The daily report object with timings.'),
  tasks: z.array(TaskSchema).describe('An array of tasks for that day.'),
  user: z.object({
    displayName: z.string().nullable().optional(),
  }).describe("The user's display name."),
});
export type GenerateEmailReportInput = z.infer<typeof GenerateEmailReportInputSchema>;

const GenerateEmailReportOutputSchema = z.object({
  greeting: z.string(),
  summary: z.string(),
  collaborators: z.array(z.string()),
});

export async function generateEmailReport(input: GenerateEmailReportInput): Promise<string> {
  const aiResponse = await generateEmailReportFlow(input);
  const emailHtml = render(
    <EmailTemplate
        userName={input.user.displayName || 'User'}
        report={input.report as DailyReport}
        tasks={input.tasks as Task[]}
        aiSummary={aiResponse.summary}
        greeting={aiResponse.greeting}
        collaborators={aiResponse.collaborators}
    />
  );
  return emailHtml;
}

const prompt = ai.definePrompt({
    name: 'generateEmailReportPrompt',
    input: { schema: GenerateEmailReportInputSchema },
    output: { schema: GenerateEmailReportOutputSchema },
    prompt: `You are writing a professional and encouraging daily work report email from the first-person perspective of the user, Nathaniel.
    
    Based on the data provided, generate a brief and concise summary of the day's work. The tone should be positive and professional, suitable for a report to a manager or team lead.

    Data:
    - User: {{user.displayName}}
    - Start Time: {{report.startTime}}
    - End Time: {{report.endTime}}
    - Tasks: {{#each tasks}} - {{name}} (Completed: {{completed}}) {{/each}}
    
    Instructions:
    1.  **Greeting**: Start with a friendly but professional greeting. Address it to "G".
    2.  **Summary**: Write a one-paragraph summary of the user's main focus for the day. Keep it brief and concise. Identify key themes or projects from the task list. Mention significant accomplishments.
    3.  **Collaborators**: Analyze the task names. If a task mentions a name (e.g., "completed with Bitz", "in collaboration with Debby"), extract those names. Return a unique list of collaborator names.
    
    Output the result in the specified JSON format.
    `,
});

const generateEmailReportFlow = ai.defineFlow(
  {
    name: 'generateEmailReportFlow',
    inputSchema: GenerateEmailReportInputSchema,
    outputSchema: GenerateEmailReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate email report content from AI.");
    }
    return output;
  }
);
