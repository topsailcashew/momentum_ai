'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, PlusCircle } from 'lucide-react';
import { isThisWeek, isThisMonth, parseISO, format } from 'date-fns';
import { AddRecurringTaskDialog } from '@/components/recurring/add-recurring-task-dialog';
import { completeRecurringTaskAction, createRecurringTaskAction } from '@/app/actions';
import type { RecurringTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getRecurringTasks } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';

export function RecurringTasksClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [tasks, setTasks] = React.useState<RecurringTask[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  React.useEffect(() => {
    if (user && firestore) {
      setDataLoading(true);
      getRecurringTasks(firestore, user.uid)
        .then(tasksData => {
          setTasks(tasksData);
          setDataLoading(false);
        })
        .catch(error => {
          console.error("Error fetching recurring tasks:", error);
          setDataLoading(false);
        });
    }
  }, [user, firestore]);

  const handleCompleteTask = (taskId: string) => {
    if (!user) return;
    const originalTasks = tasks;
    startTransition(async () => {
        try {
            // Optimistic update
            setTasks(currentTasks => currentTasks.map(task => 
                task.id === taskId ? { ...task, lastCompleted: new Date().toISOString() } : task
            ));
            await completeRecurringTaskAction(user.uid, taskId);
            toast({ title: 'Task marked as complete!' });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem completing the task.',
            });
            // Revert optimistic update
            setTasks(originalTasks);
        }
    });
  }

  const handleCreateRecurringTask = (taskData: Omit<RecurringTask, 'id' | 'lastCompleted'>) => {
    if (!user) return;
    startTransition(async () => {
      try {
        await createRecurringTaskAction(user.uid, taskData);
        // Refetch tasks after creation
        if(firestore) {
          const updatedTasks = await getRecurringTasks(firestore, user.uid);
          setTasks(updatedTasks);
        }
        toast({ title: 'Recurring task created!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  };

  const weeklyTasks = tasks.filter(t => t.frequency === 'Weekly');
  const monthlyTasks = tasks.filter(t => t.frequency === 'Monthly');

  const renderTaskTable = (taskArray: RecurringTask[], period: 'Weekly' | 'Monthly') => {
    const checkCompletion = (lastCompleted: string | null) => {
        if (!lastCompleted) return false;
        const date = parseISO(lastCompleted);
        return period === 'Weekly' ? isThisWeek(date, { weekStartsOn: 1 }) : isThisMonth(date);
    };

    if (taskArray.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No {period.toLowerCase()} tasks yet.</div>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Completed</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskArray.map(task => {
            const isCompleted = checkCompletion(task.lastCompleted);
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>
                  {isCompleted ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <Check className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {task.lastCompleted ? format(parseISO(task.lastCompleted), 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isCompleted || isPending}
                  >
                    Mark Completed
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  if (userLoading || dataLoading || !user) {
    return (
         <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }


  return (
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Recurring Tasks</h1>
                <p className="text-muted-foreground">Manage your weekly and monthly tasks.</p>
            </div>
            <AddRecurringTaskDialog onSave={handleCreateRecurringTask} isPending={isPending}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Recurring Task
                </Button>
            </AddRecurringTaskDialog>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
            <Card>
                <CardHeader>
                    <CardTitle>Weekly</CardTitle>
                    <CardDescription>Tasks that reset every week.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTaskTable(weeklyTasks, 'Weekly')}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly</CardTitle>
                    <CardDescription>Tasks that reset every month.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTaskTable(monthlyTasks, 'Monthly')}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
