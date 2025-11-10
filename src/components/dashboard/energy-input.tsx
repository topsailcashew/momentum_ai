'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Zap, ZapOff, BatteryMedium, Sparkles, Edit } from 'lucide-react';
import { setEnergyLevelAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EnergyLevel, EnergyLog } from '@/lib/types';
import type { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';
import { SuggestedTasks } from './suggested-tasks';

const energyLevels: { level: EnergyLevel; icon: React.ElementType; description: string }[] = [
  { level: 'Low', icon: ZapOff, description: 'Gentle tasks' },
  { level: 'Medium', icon: BatteryMedium, description: 'Steady pace' },
  { level: 'High', icon: Zap, description: 'Full power' },
];

interface EnergyInputProps {
    todayEnergy?: EnergyLog;
    suggestions: ScoreAndSuggestTasksOutput;
}

export function EnergyInput({ todayEnergy, suggestions }: EnergyInputProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSetEnergy = (level: EnergyLevel) => {
    startTransition(() => {
      setEnergyLevelAction(level);
      setIsEditing(false);
    });
  };
  
  if (todayEnergy && !isEditing) {
    const currentLevel = energyLevels.find(e => e.level === todayEnergy.level);
    return (
       <Card className="bg-secondary/50 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="text-primary"/>
                Today's Vibe
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2"/>
                Change
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background mb-4">
             {currentLevel?.icon && <currentLevel.icon className="size-6 text-primary" />}
            <div>
              <p className="font-semibold">{currentLevel?.level}</p>
              <p className="text-xs text-muted-foreground">{currentLevel?.description}</p>
            </div>
          </div>
          <SuggestedTasks suggestions={suggestions} energyLevel={todayEnergy.level} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">How are you feeling?</CardTitle>
        <CardDescription>Select your energy level for task suggestions.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {energyLevels.map(({ level, icon: Icon, description }) => (
          <Button
            key={level}
            variant="outline"
            className="h-auto p-3 flex flex-col gap-1 items-center justify-center text-center"
            onClick={() => handleSetEnergy(level)}
            disabled={isPending}
            aria-label={`Set energy to ${level}`}
          >
            <Icon className="w-6 h-6 text-primary" />
            <span className="font-semibold">{level}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
