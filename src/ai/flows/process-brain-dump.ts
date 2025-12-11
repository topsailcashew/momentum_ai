'use server';

/**
 * @fileOverview Processes unstructured brain dump text to extract goals and tasks.
 *
 * - processBrainDump - Extracts structured tasks and goals from unstructured text.
 * - ProcessBrainDumpInput - The input type for processBrainDump.
 * - ProcessBrainDumpOutput - The return type for processBrainDump.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { EnergyLevel, EisenhowerMatrix } from '@/lib/types';

const ProcessBrainDumpInputSchema = z.object({
  brainDumpText: z.string().describe('The unstructured text containing thoughts, tasks, and goals.'),
  existingProjects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ).describe('List of user\'s existing projects to match tasks against.'),
});
export type ProcessBrainDumpInput = z.infer<typeof ProcessBrainDumpInputSchema>;

const ProcessBrainDumpOutputSchema = z.object({
  goals: z.array(z.string()).describe('Extracted daily goals or intentions from the brain dump.'),
  tasks: z.array(
    z.object({
      name: z.string().describe('The task name/description.'),
      energyLevel: z.enum(['Low', 'Medium', 'High']).describe('Suggested energy level required for this task.'),
      category: z.enum(['work', 'personal', 'learning', 'health', 'chore']).describe('The category of the task.'),
      priority: z.enum(['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Not Urgent & Not Important'])
        .describe('The priority using Eisenhower Matrix.'),
      suggestedProjectId: z.string().optional().describe('ID of existing project if task matches one, or empty if should create new project.'),
      suggestedProjectName: z.string().optional().describe('Name of new project if no existing project matches.'),
      details: z.string().optional().describe('Additional context or details about the task.'),
      deadline: z.string().optional().describe('Suggested deadline if mentioned (YYYY-MM-DD format).'),
    })
  ).describe('Extracted tasks with suggested metadata.'),
});
export type ProcessBrainDumpOutput = z.infer<typeof ProcessBrainDumpOutputSchema>;

export async function processBrainDump(input: ProcessBrainDumpInput): Promise<ProcessBrainDumpOutput> {
  return processBrainDumpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processBrainDumpPrompt',
  input: {schema: ProcessBrainDumpInputSchema},
  output: {schema: ProcessBrainDumpOutputSchema},
  prompt: `You are an AI assistant that helps users organize their thoughts by analyzing unstructured brain dump text and extracting actionable goals and tasks.

The user has written the following brain dump:

{{{brainDumpText}}}

Their existing projects are:
{{#each existingProjects}}
- ID: {{id}}, Name: {{name}}
{{/each}}

Your task is to:

1. **Extract Goals**: Identify high-level goals or intentions for the day/week. These should be broader statements of what the user wants to achieve.

2. **Extract Tasks**: Break down the brain dump into specific, actionable tasks. For each task:
   - Create a clear, concise task name
   - Suggest an appropriate energy level (Low for simple tasks, Medium for moderate effort, High for complex/challenging tasks)
   - Categorize the task (work, personal, learning, health, or chore)
   - Assign priority using Eisenhower Matrix:
     * "Urgent & Important": Critical tasks with deadlines
     * "Important & Not Urgent": Important long-term goals
     * "Urgent & Not Important": Interruptions and busy work
     * "Not Urgent & Not Important": Time wasters
   - If the task relates to an existing project, use that project's ID
   - If the task suggests a new project area, suggest a project name
   - Extract any mentioned deadlines or timeframes
   - Add relevant details or context

Guidelines:
- Be intelligent about grouping related items into single tasks
- Don't create duplicate tasks
- Extract deadlines mentioned in the text (convert to YYYY-MM-DD format)
- If the brain dump mentions stress or overwhelm, acknowledge it in the goals
- Prioritize tasks that will reduce stress and create clarity
- Look for patterns and connections between different thoughts
- If something is vague, make reasonable assumptions based on context

Return the extracted goals and tasks in a structured format.`,
});

const processBrainDumpFlow = ai.defineFlow(
  {
    name: 'processBrainDumpFlow',
    inputSchema: ProcessBrainDumpInputSchema,
    outputSchema: ProcessBrainDumpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Provide fallback empty arrays if AI doesn't return anything
    return {
      goals: output?.goals || [],
      tasks: output?.tasks || [],
    };
  }
);
