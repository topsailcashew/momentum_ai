
'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Zap, ZapOff, BatteryMedium, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EnergyLevel, EnergyLog } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { setTodayEnergy } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const energyLevels: { level: EnergyLevel; icon: React.ElementType; description: string }[] = [
  { level: 'Low', icon: ZapOff, description: 'Gentle tasks' },
  { level: 'Medium', icon: BatteryMedium, description: 'Steady pace' },
  { level: 'High', icon: Zap, description: 'Full power' },
];

interface EnergyInputProps {
    todayEnergy: EnergyLog | undefined;
    onEnergyChange: (newEnergy: EnergyLog) => void;
    userId: string;
}

export function EnergyInput({ todayEnergy, onEnergyChange, userId }: EnergyInputProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSetEnergy = (level: EnergyLevel) => {
    if (!firestore) return;

    const newEnergyLog = {
        date: new Date().toISOString(), // This will be overwritten by server but useful for optimistic update
        level: level,
        userId: userId,
    };
    // Optimistic update
    onEnergyChange(newEnergyLog);
    setOpen(false);

    startTransition(async () => {
      try {
        await setTodayEnergy(firestore, userId, level);
        await onClientWrite();
      } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'Could not save your energy level.',
        });
        // Revert optimistic update if necessary
        onEnergyChange(todayEnergy!);
      }
    });
  };
  
  if (!todayEnergy) {
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

  const currentLevel = energyLevels.find(e => e.level === todayEnergy.level);

  return (
    <div className="p-4 rounded-lg bg-secondary/30 h-full flex flex-col justify-center">
        <h3 className="font-semibold text-foreground mb-2">Today's Vibe</h3>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex items-center gap-4 p-3 rounded-lg bg-background w-full justify-start h-auto", isPending && "animate-pulse")}>
                    {currentLevel?.icon && <currentLevel.icon className="size-8 text-primary" />}
                    <div className='text-left'>
                        <p className="font-semibold text-lg">{currentLevel?.level}</p>
                        <p className="text-sm text-muted-foreground">{currentLevel?.description}</p>
                    </div>
                    <ChevronDown className="ml-auto size-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2">
                 <div className="grid grid-cols-1 gap-2">
                    {energyLevels.map(({ level, icon: Icon, description }) => (
                    <Button
                        key={level}
                        variant="ghost"
                        className="h-auto p-3 flex flex-row gap-2 items-center justify-start"
                        onClick={() => handleSetEnergy(level)}
                        disabled={isPending}
                        aria-label={`Set energy to ${level}`}
                    >
                        <Icon className="w-5 h-5 text-primary" />
                        <div className='text-left'>
                            <span className="font-semibold">{level}</span>
                            <span className="block text-xs text-muted-foreground">{description}</span>
                        </div>
                    </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    </div>
  );
}
