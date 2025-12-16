'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DayColumn } from '@/components/weekly-planner/day-column';
import { BrainDumpDialog } from '@/components/weekly-planner/brain-dump-dialog';
import type { Task } from '@/lib/types';
import { TaskFormDialog } from '@/components/dashboard/task-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { addTask } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';

export function WeeklyPlannerClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { projects, categories, loading: dataLoading, tasks, setTasks } = useDashboardData();

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [showTaskDialog, setShowTaskDialog] = React.useState(false);
  const [showBrainDumpDialog, setShowBrainDumpDialog] = React.useState(false);
  const [selectedDeadline, setSelectedDeadline] = React.useState<Date | null>(null);
  const { toast } = useToast();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (!task.deadline) return false;
        return isSameDay(parseISO(task.deadline), day);
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'> | Partial<Omit<Task, 'id' | 'userId'>>) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        const newTask = await addTask(firestore, user.uid, taskData as Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'>);
        setTasks(prevTasks => [...prevTasks, newTask]);
        setShowTaskDialog(false);
        setSelectedDeadline(null);
        toast({
          title: 'Task created!',
          description: 'Your new task has been added to the planner.',
        });
        await onClientWrite();
      } catch (e) {
         toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  };

  const handleAddTaskClick = (day: Date) => {
    setSelectedDeadline(day);
    setShowTaskDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowTaskDialog(open);
    if (!open) {
      setSelectedDeadline(null);
    }
  };

  const handleBrainDumpTasksCreated = (createdTasks: Task[]) => {
    setTasks(prevTasks => [...prevTasks, ...createdTasks]);
  };

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (userLoading || dataLoading || !user) {
    return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                         <Button variant="outline" onClick={goToToday} className="flex-1 sm:flex-initial">Today</Button>
                        <Button variant="outline" onClick={goToNextWeek} size="icon" className="h-9 w-9">
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next week</span>
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowBrainDumpDialog(true)}>
                        <Brain className="mr-2 h-4 w-4" />
                        Brain Dump
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => setShowTaskDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 h-full">
                {weekDays.map(day => (
                    <DayColumn
                        key={day.toISOString()}
                        day={day}
                        tasks={getTasksForDay(day)}
                        onAddTaskClick={handleAddTaskClick}
                    />
                ))}
            </div>
        </CardContent>

        <TaskFormDialog
            categories={categories}
            projects={projects}
            onSave={handleCreateTask}
            isPending={isPending}
            open={showTaskDialog}
            onOpenChange={handleDialogOpenChange}
            defaultDeadline={selectedDeadline}
        />

        <BrainDumpDialog
            open={showBrainDumpDialog}
            onOpenChange={setShowBrainDumpDialog}
            onTasksCreated={handleBrainDumpTasksCreated}
            projects={projects}
            currentWeekStart={currentDate}
        />
    </Card>
  );
}
