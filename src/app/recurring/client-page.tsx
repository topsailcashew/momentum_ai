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
import { RecurringTaskFormDialog } from '@/components/recurring/recurring-task-form-dialog';
import type { RecurringTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { addRecurringTask, updateRecurringTask } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';

export function RecurringTasksClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { recurringTasks: initialTasks, setRecurringTasks, loading: dataLoading } = useDashboardData();

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCompleteTask = (taskId: string) => {
    if (!user || !firestore) return;
    const optimisticUpdate = (currentTasks: RecurringTask[]) => currentTasks.map(task =>
      task.id === taskId ? { ...task, lastCompleted: new Date().toISOString() } : task
    );
    setRecurringTasks(optimisticUpdate);

    startTransition(async () => {
      try {
        await updateRecurringTask(firestore, user.uid, taskId, { lastCompleted: new Date().toISOString() });
        toast({ title: 'Task marked as complete!' });
        await onClientWrite();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem completing the task. Reverting changes.',
        });
        // Revert optimistic update by refetching from global state
        setRecurringTasks(initialTasks);
      }
    });
  }

  const [showAddDialog, setShowAddDialog] = React.useState(false);

  const handleCreateRecurringTask = (taskData: Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId' | 'createdAt'>) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        const newTask = await addRecurringTask(firestore, user.uid, taskData);
        setRecurringTasks(prev => [...prev, newTask]);
        setShowAddDialog(false);
        toast({ title: 'Recurring task created!' });
        await onClientWrite();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  };

  const weeklyTasks = initialTasks.filter(t => t.frequency === 'Weekly');
  const monthlyTasks = initialTasks.filter(t => t.frequency === 'Monthly');

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
      <>
        {/* Mobile View: Card List */}
        <div className="block md:hidden space-y-4">
          {taskArray.map(task => {
            const isCompleted = checkCompletion(task.lastCompleted);
            return (
              <div key={task.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-medium break-words">{task.name}</div>
                  {isCompleted ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 shrink-0">
                      <Check className="mr-1 h-3 w-3" />
                      Done
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      <X className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last completed: {task.lastCompleted ? format(parseISO(task.lastCompleted), 'MMM d, yyyy') : 'Never'}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={isCompleted || isPending}
                >
                  {isCompleted ? 'Completed' : 'Mark Completed'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Task</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[20%]">Last Completed</TableHead>
                <TableHead className="text-right w-[20%]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskArray.map(task => {
                const isCompleted = checkCompletion(task.lastCompleted);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium break-words max-w-[200px]">{task.name}</TableCell>
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
        </div>
      </>
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
        <Button onClick={() => setShowAddDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Recurring Task
        </Button>
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

      <RecurringTaskFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleCreateRecurringTask}
        isPending={isPending}
      />
    </div>
  );
}
