'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import type { Task } from '@/lib/types';

type TaskData = Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>;

interface QuickAddTaskProps {
  onAdd: (data: TaskData) => void;
  isPending?: boolean;
  placeholder?: string;
}

export function QuickAddTask({ onAdd, isPending, placeholder = "Add a task... (press Enter)" }: QuickAddTaskProps) {
  const [taskName, setTaskName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && !isPending) {
      onAdd({
        userId: '', // Will be set by the parent
        name: taskName.trim(),
      });
      setTaskName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder={placeholder}
          disabled={isPending}
          className="pl-10"
        />
      </div>
    </form>
  );
}
