'use client';

import * as React from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskCard } from './task-card';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DayColumnProps {
  day: Date;
  tasks: Task[];
  onAddTaskClick: (day: Date) => void;
}

export function DayColumn({ day, tasks, onAddTaskClick }: DayColumnProps) {
  return (
    <div className={cn("rounded-lg p-2 flex flex-col h-full", isToday(day) ? 'bg-primary/10' : 'bg-secondary/50')}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={cn("font-semibold text-sm", isToday(day) && "text-primary")}>
          {format(day, 'eee')}
        </h3>
        <span className="text-xs text-muted-foreground">{format(day, 'd')}</span>
      </div>
      <ScrollArea className="flex-grow">
        <div className="space-y-2 pr-2">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
