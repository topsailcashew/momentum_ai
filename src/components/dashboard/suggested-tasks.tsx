import { CheckCircle } from 'lucide-react';
import type { EnergyLevel, Task } from '@/lib/types';
import { Badge } from '../ui/badge';

interface ScoreAndSuggestTasksOutput {
  suggestedTasks: Task[];
  routineSuggestion?: string;
}

interface SuggestedTasksProps {
  suggestions: ScoreAndSuggestTasksOutput;
  energyLevel?: EnergyLevel;
}

export function SuggestedTasks({ suggestions, energyLevel }: SuggestedTasksProps) {
    const hasSuggestions = suggestions.suggestedTasks.length > 0;

  return (
      <div>
        {hasSuggestions ? (
          <div className="space-y-4">
            {suggestions.suggestedTasks.length > 0 && (
                <div>
                    <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Your Task List</h3>
                    <ul className="space-y-3">
                        {suggestions.suggestedTasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                            <CheckCircle className="mt-1 size-4 shrink-0 text-primary" />
                            <div className='flex-1'>
                                <p className="text-sm font-medium">{task.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <Badge variant={task.energyLevel === energyLevel ? "default" : "secondary"}>
                                        {task.energyLevel} Energy
                                    </Badge>
                                    {task.deadline && (
                                        <Badge variant="outline">
                                            Due: {new Date(task.deadline).toLocaleDateString()}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>{energyLevel ? 'No specific tasks to suggest from your list.' : 'Waiting for energy input...'}</p>
          </div>
        )}
      </div>
  );
}
