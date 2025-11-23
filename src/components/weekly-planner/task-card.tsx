'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap, ZapOff, Battery } from 'lucide-react';

const energyIcons = {
  Low: ZapOff,
  Medium: Battery,
  High: Zap,
};

const energyColors = {
  Low: 'bg-blue-200 text-blue-800',
  Medium: 'bg-amber-200 text-amber-800',
  High: 'bg-red-200 text-red-800',
};

export function TaskCard({ task }: { task: Task }) {
  const Icon = energyIcons[task.energyLevel ?? 'Medium'];

  return (
    <Card className="p-2 cursor-pointer hover:bg-card-foreground/5 transition-colors">
      <p className="text-xs font-semibold leading-tight">{task.name}</p>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="secondary" className="text-xs">{task.category}</Badge>
        <Icon className={cn("h-3 w-3",
          task.energyLevel === 'Low' && 'text-blue-500',
          task.energyLevel === 'Medium' && 'text-amber-500',
          task.energyLevel === 'High' && 'text-red-500',
        )} />
      </div>
    </Card>
  );
}
