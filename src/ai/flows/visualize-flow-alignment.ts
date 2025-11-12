'use server';

/**
 * @fileOverview Visualizes task-energy alignment over time.
 *
 * - visualizeFlowAlignment - Generates a chart visualization and summary.
 * - VisualizeFlowAlignmentInput - Input type.
 * - VisualizeFlowAlignmentOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { media, Part } from 'genkit/experimental';
import type { Task, EnergyLog } from '@/lib/types';


const VisualizeFlowAlignmentInputSchema = z.object({
  tasks: z.array(z.custom<Task>()).describe('An array of all tasks completed by the user.'),
  energyLog: z.array(z.custom<EnergyLog>()).describe('A log of the user\'s self-reported energy levels over time.'),
});
export type VisualizeFlowAlignmentInput = z.infer<typeof VisualizeFlowAlignmentInputSchema>;


const VisualizeFlowAlignmentOutputSchema = z.object({
  visualizationUri: z.string().describe('A data URI of the generated chart image (e.g., PNG).'),
  report: z.string().describe('A textual summary and interpretation of the user\'s flow alignment.'),
});
export type VisualizeFlowAlignmentOutput = z.infer<typeof VisualizeFlowAlignmentOutputSchema>;


export async function visualizeFlowAlignment(input: VisualizeFlowAlignmentInput): Promise<VisualizeFlowAlignmentOutput> {
  return visualizeFlowAlignmentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'visualizeFlowAlignmentPrompt',
    input: { schema: VisualizeFlowAlignmentInputSchema },
    output: { schema: z.object({ report: VisualizeFlowAlignmentOutputSchema.shape.report }) },
    prompt: `You are a productivity coach AI. Your goal is to help users understand their 'flow state' by analyzing how well their completed tasks align with their self-reported energy levels over time.
    
    Analyze the provided data which includes completed tasks (with their required energy level) and a daily log of the user's energy.
    
    Based on the chart you just created from the data, generate a concise report with the following sections:
    1.  **Overall Alignment**: Give a percentage or a qualitative score (e.g., "Good," "Needs Improvement").
    2.  **Positive Patterns**: Identify days or periods where the user successfully matched high-energy tasks with high-energy days (or low with low) and praise them for it.
    3.  **Areas for Improvement**: Point out instances of mismatch (e.g., tackling a high-energy task on a low-energy day) and gently suggest how they could optimize their task selection in the future.
    4.  **Actionable Tip**: Provide one simple, actionable tip to help them improve their task-energy alignment.
    
    Keep the tone encouraging and supportive.
    
    Here is the data:
    - User's Energy Log: {{#each energyLog}}Date: {{date}}, Level: {{level}}; {{/each}}
    - Completed Tasks: {{#each tasks}}Task: {{name}}, Required Energy: {{energyLevel}}, Completed At: {{completedAt}}; {{/each}}
    `,
});

const visualizeFlowAlignmentFlow = ai.defineFlow(
  {
    name: 'visualizeFlowAlignmentFlow',
    inputSchema: VisualizeFlowAlignmentInputSchema,
    outputSchema: VisualizeFlowAlignmentOutputSchema,
  },
  async (input) => {
    // 1. Data Preparation for Charting
    const chartData = input.energyLog.map(log => {
        const date = new Date(log.date);
        const tasksOnDay = input.tasks.filter(t => 
            t.completedAt && new Date(t.completedAt).toISOString().startsWith(log.date)
        );
        const highEnergyTasks = tasksOnDay.filter(t => t.energyLevel === 'High').length;
        const mediumEnergyTasks = tasksOnDay.filter(t => t.energyLevel === 'Medium').length;
        const lowEnergyTasks = tasksOnDay.filter(t => t.energyLevel === 'Low').length;
        
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            "User Energy": log.level === 'High' ? 3 : log.level === 'Medium' ? 2 : 1,
            "High-Energy Tasks": highEnergyTasks,
            "Medium-Energy Tasks": mediumEnergyTasks,
            "Low-Energy Tasks": lowEnergyTasks
        };
    }).slice(-30); // Limit to last 30 entries for readability

    // 2. Generate Chart using an external tool/library prompt
    const chartPrompt = `
      Create a combination bar and line chart visualizing the user's energy-task alignment over the past ${chartData.length} days.
      - The X-axis should represent the 'date'.
      - Use a line chart for "User Energy". The Y-axis for this should be categorical (1=Low, 2=Medium, 3=High).
      - Use a stacked bar chart for the tasks, with different colors for "High-Energy Tasks", "Medium-Energy Tasks", and "Low-Energy Tasks".
      - The chart should have a clear title: "Task-Energy Flow Alignment".
      - Use colors: Line (primary theme color), High-energy bar (red/orange), Medium-energy bar (yellow/amber), Low-energy bar (blue/green).
      - Data: ${JSON.stringify(chartData)}
    `;
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview', // Hypothetical model that can generate charts
        prompt: chartPrompt,
        config: {
            responseModalities: ['IMAGE'],
        },
    });

    if (!media?.url) {
        // Fallback or throw error if image generation fails
        throw new Error("Failed to generate visualization.");
    }
    
    const visualizationUri = media.url;

    // 3. Generate textual report based on the data
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate report.");
    }

    return {
      visualizationUri,
      report: output.report,
    };
  }
);
