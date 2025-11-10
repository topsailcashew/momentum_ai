'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Zap, ZapOff, BatteryMedium, Sparkles } from 'lucide-react';
import { setEnergyLevelAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EnergyLevel, EnergyLog } from '@/lib/types';

const energyLevels: { level: EnergyLevel; icon: React.ElementType; description: string }[] = [
  { level: 'Low', icon: ZapOff, description: 'Gentle tasks' },
  { level: 'Medium', icon: BatteryMedium, description: 'Steady pace' },
  { level: 'High', icon: Zap, description: 'Full power' },
];

export function EnergyInput({ todayEnergy }: { todayEnergy?: EnergyLog }) {
  const [isPending, startTransition] = useTransition();

  const handleSetEnergy = (level: EnergyLevel) => {
    startTransition(() => {
      setEnergyLevelAction(level);
    });
  };
  
  if (todayEnergy) {
    const currentLevel = energyLevels.find(e => e.level === todayEnergy.level);
    return (
       <Card className="bg-secondary/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="text-primary"/>
            Today's Vibe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background">
             {currentLevel?.icon && <currentLevel.icon className="size-6 text-primary" />}
            <div>
              <p className="font-semibold">{currentLevel?.level}</p>
              <p className="text-xs text-muted-foreground">{currentLevel?.description}</p>
            </div>
          </div>
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
