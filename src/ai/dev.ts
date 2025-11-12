import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-tasks-based-on-energy.ts';
import '@/ai/flows/calculate-daily-momentum-score.ts';
import '@/ai/flows/generate-daily-work-summary.ts';
import '@/ai/flows/visualize-flow-alignment.ts';
