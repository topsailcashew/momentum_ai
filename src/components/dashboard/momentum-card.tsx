import { TrendingUp, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MomentumScore, EnergyLog, EnergyLevel } from '@/lib/types';
import { EnergyInput } from './energy-input';
import { SuggestionsDialog } from './suggestions-dialog';
import type { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';


interface MomentumCardProps {
    latestMomentum?: MomentumScore;
    routineSuggestion?: string;
    todayEnergy?: EnergyLog;
    suggestions?: ScoreAndSuggestTasksOutput;
}

export function MomentumCard({ latestMomentum, routineSuggestion, todayEnergy, suggestions }: MomentumCardProps) {
  const score = latestMomentum?.score ?? 0;
  const streak = latestMomentum?.streak ?? 0;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="text-primary" />
                Daily Momentum
            </CardTitle>
            <CardDescription>Your daily overview and task-energy alignment.</CardDescription>
          </div>
          {todayEnergy && suggestions && (
            <SuggestionsDialog suggestions={suggestions} energyLevel={todayEnergy.level} />
          )}
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center justify-around text-center">
                <div>
                    <p className="text-4xl font-bold text-primary">{score}</p>
                    <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                    <p className="text-4xl font-bold text-accent">{streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
            </div>
             {routineSuggestion && (
                <div className="p-3 text-xs rounded-lg bg-muted text-muted-foreground border border-primary/20">
                    <div className="flex items-start gap-2">
                        <BrainCircuit className="size-4 shrink-0 mt-0.5 text-primary" />
                        <p><span className="font-semibold text-foreground">Pattern Detected:</span> {routineSuggestion}</p>
                    </div>
                </div>
            )}
        </div>
        
        <div className="md:col-span-2">
            <EnergyInput todayEnergy={todayEnergy} />
        </div>

        {latestMomentum?.summary && (
             <div className="md:col-span-3 p-3 text-sm rounded-lg bg-muted text-muted-foreground border border-primary/20">
                <div className="flex items-start gap-3">
                    <BrainCircuit className="size-4 shrink-0 mt-0.5 text-primary" />
                    <p className="whitespace-pre-wrap"><span className="font-semibold text-foreground">AI Summary:</span> {latestMomentum.summary}</p>
                </div>
            </div>
        )}
         {!latestMomentum && !routineSuggestion && (
            <div className="md:col-span-3 p-3 text-sm text-center rounded-lg bg-muted text-muted-foreground">
                <p>Complete tasks to see your score!</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
