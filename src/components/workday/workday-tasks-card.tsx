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
import { updateTask, updateRecurringTask, calculateAndSaveMomentumScore, getWorkdayTasks, removeWorkdayTask, updateWorkdayTaskNotes } from '@/lib/data-firestore';
import { onClientWrite, onTaskCompleted } from '@/app/actions';
import { format, isToday, parseISO } from 'date-fns';
import { AddTasksDialog } from './add-tasks-dialog';
import { EndDayDialog } from './end-day-dialog';
import dynamic from 'next/dynamic';
import { AdaptiveActionMenu } from '@/components/ui/adaptive-action-menu';
import { FocusLockModal } from './focus-lock-modal';
import { useAudio } from '@/hooks/use-audio';

const TaskCompletionModal = dynamic(() => import('./task-completion-modal').then(mod => ({ default: mod.TaskCompletionModal })), { ssr: false });

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

type WorkdayTaskWithDetails = Task & {
  workdayTaskId: string;
  workdayNotes: string | null;
  taskType: 'regular' | 'recurring';
  timeSpentMs?: number;
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
  const { play } = useAudio();

  const [focusLockOpen, setFocusLockOpen] = React.useState(false);
  const [pendingFocusTask, setPendingFocusTask] = React.useState<Task | null>(null);
  const [completionModalTask, setCompletionModalTask] = React.useState<WorkdayTaskWithDetails | null>(null);

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
          focusedTimeMs: recurringTask.focusedTimeMs,
          state: completedToday ? 'done' : 'ready',
          stateHistory: [],
        };
      }
    }

    if (!task) return null;

    return {
      ...task,
      workdayTaskId: wt.id,
      workdayNotes: wt.notes,
      timeSpentMs: wt.timeSpentMs
    } as WorkdayTaskWithDetails;
  }).filter((t): t is WorkdayTaskWithDetails => t !== null);

  const handleComplete = (id: string, completed: boolean, taskType: 'regular' | 'recurring') => {
    if (completed) {
      play('taskComplete');
      const task = workdayTasksWithDetails.find(t => t.id === id);
      if (task) {
        setCompletionModalTask(task);
      }
    }

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
            // If the completed task was focused, clear focus
            if (focusedTask?.id === id) {
              setFocusedTask(null);
            }
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
            if (focusedTask?.id === id) {
              setFocusedTask(null);
            }
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

  const handleTaskClick = (task: Task) => {
    if (focusedTask && focusedTask.id === task.id) {
      // Already focused, do nothing or maybe show detail modal (future)
      return;
    }

    if (focusedTask && !focusedTask.completed) {
      // Another incomplete task is focused -> Warn user
      setPendingFocusTask(task);
      setFocusLockOpen(true);
    } else {
      // No focus or previous focus completed -> Switch context
      setFocusedTask(task);
    }
  };

  const handleForceSwitch = () => {
    if (pendingFocusTask) {
      setFocusedTask(pendingFocusTask);
      setPendingFocusTask(null);
      setFocusLockOpen(false);
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
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-secondary/50 transition-colors relative group cursor-pointer",
                          isAligned && !isFocused && "bg-primary/10 border border-primary/30",
                          isFocused && "bg-accent/20 border-2 border-accent shadow-sm"
                        )}>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={(checked) => handleComplete(task.id, !!checked, task.taskType)}
                            disabled={isPending}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <label htmlFor={`task-${task.id}`} className="font-bold text-sm sm:text-base block break-words cursor-pointer pointer-events-none">
                            {task.name}
                          </label>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground mt-1.5 pointer-events-none">
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
                            {/* Cumulative Focus Time Display could go here in future */}
                          </div>
                        </div>
                        <div className="flex sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:right-2 sm:opacity-0 sm:group-hover:opacity-100 md:transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                          <AdaptiveActionMenu
                            actions={[
                              {
                                label: "Start Pomodoro",
                                icon: <PlayCircle className="size-3.5 sm:size-4" />,
                                onClick: () => {
                                  // Start Pomodoro action essentially just focuses the task, so we can reuse logic or call setFocusedTask
                                  setFocusedTask(task);
                                },
                              },
                              {
                                label: "Remove from today",
                                icon: <X className="size-3.5 sm:size-4" />,
                                onClick: () => handleRemoveFromWorkday(task.workdayTaskId),
                                variant: "destructive"
                              }
                            ]}
                          />
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
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={true}
                            onCheckedChange={(checked) => handleComplete(task.id, !!checked, task.taskType)}
                            disabled={isPending}
                            className="mt-1"
                          />
                        </div>
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

      <FocusLockModal
        open={focusLockOpen}
        onOpenChange={setFocusLockOpen}
        currentTaskName={focusedTask?.name || ''}
        onStayFocused={() => {
          setPendingFocusTask(null);
          setFocusLockOpen(false);
        }}
        onForceSwitch={handleForceSwitch}
      />

      <TaskCompletionModal
        open={!!completionModalTask}
        onOpenChange={(open) => !open && setCompletionModalTask(null)}
        taskName={completionModalTask?.name ?? ''}
        timeSpentMs={completionModalTask?.timeSpentMs}
        onSaveNotes={async (notes) => {
          if (completionModalTask && notes.trim()) {
            try {
              await updateWorkdayTaskNotes(firestore, userId, completionModalTask.workdayTaskId, notes);
              setWorkdayTasks(prev => prev.map(t =>
                t.id === completionModalTask.workdayTaskId ? { ...t, notes } : t
              ));
              toast({
                title: 'Notes saved',
                description: 'Your completion notes have been saved.',
              });
            } catch (error) {
              console.error('Failed to save notes', error);
              toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save notes.',
              });
            }
          }
          setCompletionModalTask(null);
        }}
        onSkip={() => setCompletionModalTask(null)}
      />
    </>
  );
}
