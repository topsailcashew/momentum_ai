'use server';

/**
 * @fileOverview Extracts strategic plan information from PDF content.
 *
 * - extractStrategicPlan - Analyzes PDF text and extracts structured data.
 * - ExtractStrategicPlanInput - Input type.
 * - ExtractStrategicPlanOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractStrategicPlanInputSchema = z.object({
  pdfText: z.string().describe('The text content extracted from the PDF document.'),
  ministryName: z.string().describe('The name of the ministry this plan belongs to.'),
});
export type ExtractStrategicPlanInput = z.infer<typeof ExtractStrategicPlanInputSchema>;

const GoalSchema = z.object({
  title: z.string().describe('The goal title or objective'),
  description: z.string().optional().describe('Detailed description of the goal'),
  targetDate: z.string().optional().describe('Target completion date (YYYY-MM-DD format if available)'),
  priority: z.enum(['high', 'medium', 'low']).describe('Priority level of this goal'),
});

const MetricSchema = z.object({
  goalTitle: z.string().describe('The goal this metric belongs to'),
  name: z.string().describe('The metric name or KPI'),
  targetValue: z.number().describe('Target value to achieve'),
  currentValue: z.number().describe('Current value (0 if not specified)'),
  unit: z.string().describe('Unit of measurement (e.g., people, events, dollars)'),
});

const MilestoneSchema = z.object({
  goalTitle: z.string().describe('The goal this milestone belongs to'),
  title: z.string().describe('Milestone title'),
  dueDate: z.string().optional().describe('Due date (YYYY-MM-DD format if available)'),
  description: z.string().optional().describe('Milestone description'),
});

const ExtractStrategicPlanOutputSchema = z.object({
  title: z.string().describe('The strategic plan title'),
  visionStatement: z.string().optional().describe('Vision statement if found'),
  missionStatement: z.string().optional().describe('Mission statement if found'),
  startDate: z.string().optional().describe('Plan start date (YYYY-MM-DD format)'),
  endDate: z.string().optional().describe('Plan end date (YYYY-MM-DD format)'),
  goals: z.array(GoalSchema).describe('Array of strategic goals extracted from the plan'),
  metrics: z.array(MetricSchema).describe('Array of metrics/KPIs extracted'),
  milestones: z.array(MilestoneSchema).describe('Array of milestones extracted'),
});
export type ExtractStrategicPlanOutput = z.infer<typeof ExtractStrategicPlanOutputSchema>;

export async function extractStrategicPlan(input: ExtractStrategicPlanInput): Promise<ExtractStrategicPlanOutput> {
  return extractStrategicPlanFlow(input);
}

const prompt = ai.definePrompt({
    name: 'extractStrategicPlanPrompt',
    input: { schema: ExtractStrategicPlanInputSchema },
    output: { schema: ExtractStrategicPlanOutputSchema },
    prompt: `You are an AI assistant specialized in analyzing church ministry strategic planning documents.

Your task is to carefully read the provided strategic plan document text and extract structured information.

**Instructions:**
1. Identify the plan title (if not explicitly stated, create one based on the ministry name and content)
2. Look for vision and mission statements
3. Extract all strategic goals, objectives, or initiatives
4. Identify any metrics, KPIs, or measurable targets
5. Find milestones, deadlines, or timeline items
6. Look for start and end dates for the overall plan
7. Infer priority levels based on context (e.g., words like "critical", "primary", "key" indicate high priority)

**Important:**
- If dates are not in YYYY-MM-DD format, convert them if possible
- If a goal doesn't have an explicit priority, use "medium" as default
- For metrics, if current value is not specified, use 0
- Try to associate each metric and milestone with its parent goal based on context
- Be thorough but accurate - don't make up information that isn't in the document

**Ministry Context:**
Ministry Name: {{ministryName}}

**Document Text:**
{{pdfText}}
`,
});

const extractStrategicPlanFlow = ai.defineFlow(
  {
    name: 'extractStrategicPlanFlow',
    inputSchema: ExtractStrategicPlanInputSchema,
    outputSchema: ExtractStrategicPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to extract strategic plan data.");
    }

    return output;
  }
);
