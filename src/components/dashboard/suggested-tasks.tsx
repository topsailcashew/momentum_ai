import { Lightbulb, CheckCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { EnergyLevel, Task } from '@/lib/types';
import { Badge } from '../ui/badge';
import type { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';

interface SuggestedTasksProps {
  suggestions: ScoreAndSuggestTasksOutput;
  energyLevel?: EnergyLevel;
}

export function SuggestedTasks({ suggestions, energyLevel }: SuggestedTasksProps) {
    const hasSuggestions = suggestions.suggestedTasks.length > 0 || suggestions.microSuggestions.length > 0;

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

            {suggestions.microSuggestions.length > 0 && (
                 <div>
                    <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Ideas</h3>
                    <ul className="space-y-2">
                        {suggestions.microSuggestions.map((suggestion, index) => (
                            <li key={`micro-${index}`} className="flex items-center gap-3 p-2 text-sm rounded-md bg-secondary/30">
                                <Sparkles className="size-4 shrink-0 text-accent" />
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>{energyLevel ? 'No specific tasks to suggest.' : 'Waiting for energy input...'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
