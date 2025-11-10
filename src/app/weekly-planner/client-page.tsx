'use client';

import * as React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DayColumn } from '@/components/weekly-planner/day-column';
import type { Task, Project, Category } from '@/lib/types';
import { AddTaskDialog } from '@/components/dashboard/add-task-dialog';
import { createTaskAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface WeeklyPlannerClientPageProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
}

export function WeeklyPlannerClientPage({
  tasks: initialTasks,
  projects,
  categories,
}: WeeklyPlannerClientPageProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (!task.deadline) return false;
        return isSameDay(parseISO(task.deadline), day);
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>) => {
    startTransition(async () => {
      try {
        const newTask = await createTaskAction(taskData);
        setTasks(prevTasks => [...prevTasks, newTask]);
        toast({
          title: 'Task created!',
          description: 'Your new task has been added to the planner.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  };

  return (
    <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Weekly Planner</CardTitle>
                <CardDescription>
                    Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </CardDescription>
            </div>
            <AddTaskDialog 
                categories={categories}
                projects={projects}
                onCreateTask={handleCreateTask}
                isPending={isPending}
            />
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDays.map(day => (
                    <DayColumn
                        key={day.toISOString()}
                        day={day}
                        tasks={getTasksForDay(day)}
                    />
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
