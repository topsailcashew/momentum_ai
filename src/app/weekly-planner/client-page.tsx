'use client';

import * as React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DayColumn } from '@/components/weekly-planner/day-column';
import type { Task, Project, Category } from '@/lib/types';
import { TaskFormDialog } from '@/components/dashboard/task-form-dialog';
import { createTaskAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface WeeklyPlannerClientPageProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  userId: string;
}

export function WeeklyPlannerClientPage({
  tasks: initialTasks,
  projects,
  categories,
  userId
}: WeeklyPlannerClientPageProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (!task.deadline) return false;
        return isSameDay(parseISO(task.deadline), day);
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'> | Partial<Omit<Task, 'id'>>, taskId?: string) => {
    startTransition(async () => {
      try {
        const newTask = await createTaskAction(userId, taskData as Omit<Task, "id" | "completed" | "completedAt" | "createdAt">);
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

  const handleAddTaskInline = (taskName: string, day: Date) => {
    handleCreateTask({
      name: taskName,
      deadline: day.toISOString(),
      category: 'personal', // Default category
      energyLevel: 'Medium' // Default energy level
    });
  };
  
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <CardTitle>Weekly Planner</CardTitle>
                    <CardDescription>
                        Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={goToPreviousWeek} size="icon" className="h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous week</span>
                    </Button>
                     <Button variant="outline" onClick={goToToday}>Today</Button>
                    <Button variant="outline" onClick={goToNextWeek} size="icon" className="h-9 w-9">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next week</span>
                    </Button>
                </div>
                 <TaskFormDialog 
                    categories={categories}
                    projects={projects}
                    onSave={handleCreateTask}
                    isPending={isPending}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Detailed Task
                    </Button>
                </TaskFormDialog>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDays.map(day => (
                    <DayColumn
                        key={day.toISOString()}
                        day={day}
                        tasks={getTasksForDay(day)}
                        onAddTask={handleAddTaskInline}
                        isPending={isPending}
                    />
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
