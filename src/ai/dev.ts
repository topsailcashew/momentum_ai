import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-tasks-based-on-energy.ts';
import '@/ai/flows/calculate-daily-momentum-score.ts';
import '@/ai/flows/visualize-flow-alignment.ts';
import '@/ai/flows/generate-email-report.tsx';
