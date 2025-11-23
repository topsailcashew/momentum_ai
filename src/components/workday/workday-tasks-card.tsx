'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, WorkdayTask, EnergyLevel, EisenhowerMatrix } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap, ZapOff, Battery, Folder, PlayCircle, Shield, Plus, CalendarCheck2, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { PomodoroContext } from '../dashboard/pomodoro-provider';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser, useFirestore } from '@/firebase';
import { updateTask, updateRecurringTask, calculateAndSaveMomentumScore, getWorkdayTasks, removeWorkdayTask } from '@/lib/data-firestore';
import { onClientWrite, onTaskCompleted } from '@/app/actions';
import { format, isToday, parseISO } from 'date-fns';
import { AddTasksDialog } from './add-tasks-dialog';
import { EndDayDialog } from './end-day-dialog';

const energyIcons: Record<EnergyLevel, React.ElementType> = {
  Low: ZapOff,
  Medium: Battery,
  High: Zap,
};

const priorityColors: Record<EisenhowerMatrix, string> = {
  'Urgent & Important': 'text-red-500',
  'Important & Not Urgent': 'text-amber-500',
  'Urgent & Not Important': 'text-blue-500',
  'Not Urgent & Not Important': 'text-gray-500',
};

export function WorkdayTasksCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { tasks: allTasks, recurringTasks, categories, projects, todayEnergy, setTasks: setAllTasks, setRecurringTasks } = useDashboardData();
  const userId = user!.uid;

  const [isPending, startTransition] = useTransition();
  const [workdayTasks, setWorkdayTasks] = React.useState<WorkdayTask[]>([]);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEndDayDialog, setShowEndDayDialog] = React.useState(false);
  const { toast } = useToast();
  const { setFocusedTask, focusedTask } = React.useContext(PomodoroContext);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Load workday tasks on mount
  React.useEffect(() => {
    if (!firestore || !userId) return;

    const loadWorkdayTasks = async () => {
      try {
        const tasks = await getWorkdayTasks(firestore, userId, today);
        setWorkdayTasks(tasks);
      } catch (error) {
        console.error('Error loading workday tasks:', error);
      }
    };

    loadWorkdayTasks();
  }, [firestore, userId, today]);

  // Get actual task details for workday tasks
  const workdayTasksWithDetails = workdayTasks.map(wt => {
    let task: Task & { taskType: 'regular' | 'recurring' } | undefined;

    if (wt.taskType === 'regular') {
      const regularTask = allTasks.find(t => t.id === wt.taskId);
      if (regularTask) {
        task = { ...regularTask, taskType: 'regular' as const };
      }
    } else if (wt.taskType === 'recurring') {
      // Find the recurring task and convert it to task format
      const recurringTask = recurringTasks.find(rt => rt.id === wt.taskId);
      if (recurringTask) {
        // Check if the recurring task was completed today
        const completedToday = recurringTask.lastCompleted ? isToday(parseISO(recurringTask.lastCompleted)) : false;

        task = {
          id: recurringTask.id,
          userId: recurringTask.userId,
          name: recurringTask.name,
          category: recurringTask.category ?? 'personal',
          energyLevel: recurringTask.energyLevel ?? 'Medium',
          completed: completedToday,
          completedAt: completedToday ? recurringTask.lastCompleted : null,
          createdAt: recurringTask.createdAt,
          projectId: recurringTask.projectId,
          deadline: recurringTask.deadline,
          collaboration: recurringTask.collaboration,
          details: recurringTask.details,
          priority: recurringTask.priority,
          taskType: 'recurring' as const,
        };
      }
    }

    return task ? { ...task, workdayTaskId: wt.id, workdayNotes: wt.notes } : null;
  }).filter((t): t is Task & { workdayTaskId: string; workdayNotes: string | null; taskType: 'regular' | 'recurring' } => t !== null);

  const handleComplete = (id: string, completed: boolean, taskType: 'regular' | 'recurring') => {
    if (taskType === 'regular') {
      let originalTasksState: Task[] = [];

      // Optimistically update the UI
      setAllTasks(currentTasks => {
        originalTasksState = currentTasks;
        return currentTasks.map(task =>
          task.id === id
            ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
            : task
        );
      });

      startTransition(async () => {
        try {
          await updateTask(firestore, userId, id, { completed, completedAt: completed ? new Date().toISOString() : null });
          if (completed) {
            await calculateAndSaveMomentumScore(firestore, userId);
            await onTaskCompleted(userId);
          } else {
            await onClientWrite();
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem updating your task. Reverting changes.',
          });
          setAllTasks(originalTasksState);
        }
      });
    } else {
      // Handle recurring tasks
      let originalRecurringTasksState: typeof recurringTasks = [];

      // Optimistically update the UI
      setRecurringTasks(currentTasks => {
        originalRecurringTasksState = currentTasks;
        return currentTasks.map(task =>
          task.id === id
            ? { ...task, lastCompleted: completed ? new Date().toISOString() : null }
            : task
        );
      });

      startTransition(async () => {
        try {
          if (completed) {
            // Update lastCompleted to now
            await updateRecurringTask(firestore, userId, id, { lastCompleted: new Date().toISOString() });
            await calculateAndSaveMomentumScore(firestore, userId);
            await onTaskCompleted(userId);
          } else {
            // Un-complete by setting lastCompleted to null
            await updateRecurringTask(firestore, userId, id, { lastCompleted: null });
            await onClientWrite();
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem updating your recurring task. Reverting changes.',
          });
          setRecurringTasks(originalRecurringTasksState);
        }
      });
    }
  };

  const handleRemoveFromWorkday = (workdayTaskId: string) => {
    startTransition(async () => {
      try {
        await removeWorkdayTask(firestore, userId, workdayTaskId);
        setWorkdayTasks(prev => prev.filter(wt => wt.id !== workdayTaskId));
        toast({
          title: 'Task removed from workday',
          description: 'The task has been removed from today\'s workday.',
        });
        await onClientWrite();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem removing the task.',
        });
      }
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? categoryId;
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name;
  };

  const incompleteTasks = workdayTasksWithDetails.filter(task => !task.completed);
  const completedTasks = workdayTasksWithDetails.filter(task => task.completed);

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarCheck2 className="text-primary" />
                Today's Workday
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')} • {workdayTasksWithDetails.length} tasks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                disabled={isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tasks
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowEndDayDialog(true)}
                disabled={isPending || workdayTasksWithDetails.length === 0}
              >
                End Day
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Active Tasks</h3>
                <TooltipProvider>
                  {incompleteTasks.map(task => {
                    const Icon = energyIcons[task.energyLevel ?? 'Medium'];
                    const isAligned = todayEnergy?.level === task.energyLevel;
                    const projectName = task.projectId ? getProjectName(task.projectId) : null;
                    const isFocused = focusedTask?.id === task.id;
                    const priorityColor = task.priority ? priorityColors[task.priority] : 'text-gray-500';

                    return (
                      <div key={task.id} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-secondary/50 transition-colors relative group",
                        isAligned && !isFocused && "bg-primary/10 border border-primary/30",
                        isFocused && "bg-accent/20 border border-accent"
                      )}>
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={(checked) => handleComplete(task.id, !!checked, task.taskType)}
                          disabled={isPending}
                          className="mt-1"
                        />
                        <div className="flex-grow min-w-0">
                          <label htmlFor={`task-${task.id}`} className="font-semibold text-sm sm:text-base block break-words cursor-pointer">
                            {task.name}
                          </label>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground mt-1.5">
                            <Badge variant="secondary" className="capitalize text-xs">{getCategoryName(task.category ?? 'personal')}</Badge>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Icon className="size-3 flex-shrink-0" />
                              <span>{task.energyLevel}</span>
                            </div>
                            {projectName && (
                              <div className="flex items-center gap-1 truncate">
                                <Folder className="size-3 flex-shrink-0" />
                                <span className="truncate">{projectName}</span>
                              </div>
                            )}
                            {task.priority && (
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1">
                                  <Shield className={cn("size-3", priorityColor)} />
                                  <span className="hidden md:inline text-xs">{task.priority}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{task.priority}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setFocusedTask(task)}
                              >
                                <PlayCircle className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Start Pomodoro</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveFromWorkday(task.workdayTaskId)}
                              >
                                <X className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove from today</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </TooltipProvider>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Completed ({completedTasks.length})</h3>
                <TooltipProvider>
                  {completedTasks.map(task => {
                    const Icon = energyIcons[task.energyLevel ?? 'Medium'];
                    const projectName = task.projectId ? getProjectName(task.projectId) : null;

                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 opacity-75">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={true}
                          onCheckedChange={(checked) => handleComplete(task.id, !!checked, task.taskType)}
                          disabled={isPending}
                          className="mt-1"
                        />
                        <div className="flex-grow min-w-0">
                          <label htmlFor={`task-${task.id}`} className="font-semibold text-sm block break-words line-through text-muted-foreground cursor-pointer">
                            {task.name}
                          </label>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground mt-1.5">
                            <Badge variant="secondary" className="capitalize text-xs opacity-60">{getCategoryName(task.category ?? 'personal')}</Badge>
                            <div className="flex items-center gap-1">
                              <Icon className="size-3" />
                              <span>{task.energyLevel}</span>
                            </div>
                            {projectName && (
                              <div className="flex items-center gap-1 truncate">
                                <Folder className="size-3" />
                                <span className="truncate">{projectName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </TooltipProvider>
              </div>
            )}

            {/* Empty State */}
            {workdayTasksWithDetails.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <CalendarCheck2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-4">No tasks planned for today</p>
                <Button
                  size="lg"
                  onClick={() => setShowAddDialog(true)}
                  className="mx-auto"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Work Day
                </Button>
                <p className="mt-3 text-xs">Select tasks from your recurring tasks and weekly planner</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddTasksDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        workdayTasks={workdayTasks}
        onTasksAdded={(newTasks) => setWorkdayTasks(prev => [...prev, ...newTasks])}
      />

      <EndDayDialog
        open={showEndDayDialog}
        onOpenChange={setShowEndDayDialog}
        workdayTasks={workdayTasksWithDetails}
        onComplete={() => setWorkdayTasks([])}
      />
    </>
  );
}
