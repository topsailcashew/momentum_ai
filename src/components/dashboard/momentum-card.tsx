'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { TrendingUp, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MomentumScore, EnergyLog, Project, Task } from '@/lib/types';
import { EnergyInput } from './energy-input';
import { SuggestionsDialog } from './suggestions-dialog';
import { getSuggestedTasks } from '@/app/actions';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser } from '@/firebase';

interface ScoreAndSuggestTasksOutput {
  suggestedTasks: Task[];
  routineSuggestion?: string;
}


export function MomentumCard() {
  const { user } = useUser();
  const {
    tasks,
    projects,
    todayEnergy: initialTodayEnergy,
    latestMomentum: initialLatestMomentum,
  } = useDashboardData();
  const userId = user!.uid;

  const [latestMomentum, setLatestMomentum] = React.useState(initialLatestMomentum);
  const [todayEnergy, setTodayEnergy] = React.useState(initialTodayEnergy);
  const [suggestions, setSuggestions] = React.useState<ScoreAndSuggestTasksOutput>({
    suggestedTasks: [],
    routineSuggestion: undefined,
  });
  const [, startTransition] = useTransition();

  React.useEffect(() => {
    setLatestMomentum(initialLatestMomentum);
  }, [initialLatestMomentum]);
  
  React.useEffect(() => {
    setTodayEnergy(initialTodayEnergy);
  }, [initialTodayEnergy]);

  React.useEffect(() => {
    if (todayEnergy) {
      startTransition(async () => {
        const suggestionData = await getSuggestedTasks({
            energyLevel: todayEnergy.level,
            tasks,
            projects,
            completedTasks: tasks.filter(t => t.completed)
        });
        setSuggestions(suggestionData);
      });
    }
  }, [todayEnergy?.level, tasks, projects]);


  const score = latestMomentum?.score ?? 0;
  const streak = latestMomentum?.streak ?? 0;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-grow">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="text-primary size-5" />
                Daily Momentum
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your daily overview and task-energy alignment.</CardDescription>
          </div>
          {todayEnergy && (
            <div className="self-start sm:self-auto">
              <SuggestionsDialog suggestions={suggestions} energyLevel={todayEnergy.level} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-around text-center p-4 sm:p-5 rounded-lg bg-secondary/30">
                <div>
                    <p className="text-3xl sm:text-4xl font-bold text-primary">{score}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Points</p>
                </div>
                <Separator orientation="vertical" className="h-10 sm:h-12" />
                <div>
                    <p className="text-3xl sm:text-4xl font-bold text-accent">{streak}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Day Streak</p>
                </div>
            </div>
            <EnergyInput todayEnergy={todayEnergy} userId={userId} />
        </div>

        {suggestions.routineSuggestion && (
            <div className="p-3 text-xs rounded-lg bg-muted text-muted-foreground border border-primary/20">
                <div className="flex items-start gap-2">
                    <BrainCircuit className="size-4 shrink-0 mt-0.5 text-primary" />
                    <p><span className="font-semibold text-foreground">Pattern Detected:</span> {suggestions.routineSuggestion}</p>
                </div>
            </div>
        )}

        {latestMomentum?.summary && (
             <div className="p-3 text-sm rounded-lg bg-muted text-muted-foreground border border-primary/20">
                <div className="flex items-start gap-3">
                    <BrainCircuit className="size-4 shrink-0 mt-0.5 text-primary" />
                    <p className="whitespace-pre-wrap"><span className="font-semibold text-foreground">AI Summary:</span> {latestMomentum.summary}</p>
                </div>
            </div>
        )}
         {!latestMomentum && !suggestions.routineSuggestion && !todayEnergy && (
            <div className="p-3 text-sm text-center rounded-lg bg-muted text-muted-foreground">
                <p>Select your energy level to get started!</p>
            </div>
        )}
         {!latestMomentum && todayEnergy && (
            <div className="p-3 text-sm text-center rounded-lg bg-muted text-muted-foreground">
                <p>Complete a task to see your first momentum score.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
