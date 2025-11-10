'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Zap, ZapOff, BatteryMedium, Edit } from 'lucide-react';
import { setEnergyLevelAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import type { EnergyLevel, EnergyLog } from '@/lib/types';

const energyLevels: { level: EnergyLevel; icon: React.ElementType; description: string }[] = [
  { level: 'Low', icon: ZapOff, description: 'Gentle tasks' },
  { level: 'Medium', icon: BatteryMedium, description: 'Steady pace' },
  { level: 'High', icon: Zap, description: 'Full power' },
];

interface EnergyInputProps {
    todayEnergy?: EnergyLog;
}

export function EnergyInput({ todayEnergy }: EnergyInputProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = React.useState(!todayEnergy);

  React.useEffect(() => {
    if (!todayEnergy) {
      setIsEditing(true);
    }
  }, [todayEnergy]);

  const handleSetEnergy = (level: EnergyLevel) => {
    startTransition(() => {
      setEnergyLevelAction(level);
      setIsEditing(false);
    });
  };
  
  if (todayEnergy && !isEditing) {
    const currentLevel = energyLevels.find(e => e.level === todayEnergy.level);
    return (
      <div className="p-4 rounded-lg bg-secondary/30 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Today's Vibe</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2"/>
                Change
            </Button>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background">
             {currentLevel?.icon && <currentLevel.icon className="size-8 text-primary" />}
            <div>
              <p className="font-semibold text-lg">{currentLevel?.level}</p>
              <p className="text-sm text-muted-foreground">{currentLevel?.description}</p>
            </div>
          </div>
      </div>
    );
  }

  return (
     <div className="p-4 rounded-lg bg-secondary/30 h-full flex flex-col justify-center">
        <h3 className="font-semibold text-foreground mb-2">How are you feeling?</h3>
        <p className="text-sm text-muted-foreground mb-4">Select your energy level for task suggestions.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
        </div>
      </div>
  );
}
