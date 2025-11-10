'use client';

import * as React from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SuggestedTasks } from './suggested-tasks';
import type { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';
import type { EnergyLevel } from '@/lib/types';

interface SuggestionsDialogProps {
  suggestions: ScoreAndSuggestTasksOutput;
  energyLevel: EnergyLevel;
}

export function SuggestionsDialog({ suggestions, energyLevel }: SuggestionsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Lightbulb className="text-accent" />
           <span className="sr-only">Show Suggestions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent"/>
            Suggested for you
          </DialogTitle>
          <DialogDescription>
             AI suggestions for your {energyLevel.toLowerCase()} energy.
          </DialogDescription>
        </DialogHeader>
        <SuggestedTasks suggestions={suggestions} energyLevel={energyLevel} />
      </DialogContent>
    </Dialog>
  );
}
