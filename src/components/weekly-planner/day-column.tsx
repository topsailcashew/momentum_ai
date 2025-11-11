'use client';

import * as React from 'react';
import { format, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskCard } from './task-card';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

interface DayColumnProps {
  day: Date;
  tasks: Task[];
  isPending: boolean;
  onAddTask: (taskName: string, day: Date) => void;
}

export function DayColumn({ day, tasks, isPending, onAddTask }: DayColumnProps) {
  const [taskName, setTaskName] = React.useState('');
  const [showInput, setShowInput] = React.useState(false);

  const handleAddTask = () => {
    if (taskName.trim()) {
      onAddTask(taskName.trim(), day);
      setTaskName('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setTaskName('');
    }
  };

  return (
    <div className={cn("rounded-lg p-2 flex flex-col", isToday(day) ? 'bg-primary/10' : 'bg-secondary/50')}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={cn("font-semibold text-sm", isToday(day) && "text-primary")}>
          {format(day, 'eee')}
        </h3>
        <span className="text-xs text-muted-foreground">{format(day, 'd')}</span>
      </div>
      <ScrollArea className="flex-grow h-64">
        <div className="space-y-2 pr-2">
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
      </ScrollArea>
       <div className="mt-2">
        {showInput ? (
          <div className="space-y-2">
            <Input
              autoFocus
              type="text"
              placeholder="New task name..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-xs"
              disabled={isPending}
            />
            <div className="flex items-center gap-2">
                <Button onClick={handleAddTask} size="sm" className="h-7 text-xs flex-1" disabled={isPending || !taskName.trim()}>
                    {isPending ? "Adding..." : "Add Task"}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowInput(false)} disabled={isPending}>
                    Cancel
                </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setShowInput(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  );
}
