import { Lightbulb, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { EnergyLevel } from '@/lib/types';

interface SuggestedTasksProps {
  suggestedTasks: string[];
  energyLevel?: EnergyLevel;
}

export function SuggestedTasks({ suggestedTasks, energyLevel }: SuggestedTasksProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="text-accent"/>
            Suggested for you
        </CardTitle>
        <CardDescription>
            {energyLevel 
                ? `AI suggestions for your ${energyLevel.toLowerCase()} energy.`
                : 'Set energy to get suggestions.'
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suggestedTasks.length > 0 ? (
          <ul className="space-y-2">
            {suggestedTasks.map((task, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="mt-1 size-3.5 shrink-0 text-primary" />
                <span className="text-sm">{task}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>{energyLevel ? 'No specific tasks to suggest.' : 'Waiting for energy input...'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
