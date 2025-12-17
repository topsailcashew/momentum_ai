'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { TrendingUp, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Task, EnergyLevel } from '@/lib/types';
import { SuggestionsDialog } from './suggestions-dialog';
import { EnergyBatteryIcon } from '@/components/workday/energy-battery-icon';
import { getSuggestedTasks } from '@/app/actions';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser } from '@/firebase';

interface ScoreAndSuggestTasksOutput {
  suggestedTasks: Task[];
  routineSuggestion?: string;
}

interface MomentumCardProps {
  currentEnergy?: EnergyLevel | null;
}

export function MomentumCard({ currentEnergy }: MomentumCardProps) {
  const { user } = useUser();
  const {
    tasks,
    projects,
    todayEnergy,
    latestMomentum,
  } = useDashboardData();

  const [suggestions, setSuggestions] = React.useState<ScoreAndSuggestTasksOutput>({
    suggestedTasks: [],
    routineSuggestion: undefined,
  });
  const [, startTransition] = useTransition();

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-primary size-5" />
          Daily Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Current Energy & Stats Combined */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
          <EnergyBatteryIcon energyLevel={currentEnergy} showLabel={true} />
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{streak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>
        </div>

        {latestMomentum?.summary && (
             <div className="p-2.5 text-xs rounded-lg bg-muted/50 text-muted-foreground border border-primary/10">
                <div className="flex items-start gap-2">
                    <BrainCircuit className="size-3.5 shrink-0 mt-0.5 text-primary" />
                    <p className="whitespace-pre-wrap text-foreground/80">{latestMomentum.summary}</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
