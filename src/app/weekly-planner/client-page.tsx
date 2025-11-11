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
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getTasks, getProjects, getCategories } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';

export function WeeklyPlannerClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  React.useEffect(() => {
    if (user && firestore) {
      setDataLoading(true);
      Promise.all([
        getTasks(firestore, user.uid), 
        getProjects(firestore, user.uid),
        getCategories()
      ]).then(([task, proj, cat]) => {
          setTasks(task);
          setProjects(proj);
          setCategories(cat);
          setDataLoading(false);
      }).catch(error => {
        console.error("Error fetching weekly planner data:", error);
        setDataLoading(false);
      });
    }
  }, [user, firestore]);


  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
        if (!task.deadline) return false;
        return isSameDay(parseISO(task.deadline), day);
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>) => {
    if (!user) return;
    startTransition(async () => {
      try {
        const newTask = await createTaskAction(user.uid, taskData);
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

  if (userLoading || dataLoading || !user) {
    return <Skeleton className="h-[500px] w-full" />
  }

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
