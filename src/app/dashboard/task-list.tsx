'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskFormDialog } from '@/components/dashboard/task-form-dialog';
import type { Task, Category, EnergyLevel, Project, EisenhowerMatrix } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap, ZapOff, Battery, Target, ListTodo, Folder, PlayCircle, Shield, Edit } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from '@/hooks/use-toast';
import { PomodoroContext } from '@/components/dashboard/pomodoro-provider';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser, useFirestore } from '@/firebase';
import { addTask, deleteTask, updateTask, calculateAndSaveMomentumScore } from '@/lib/data-firestore';
import { onClientWrite, onTaskCompleted } from '@/app/actions';

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
}

export function TaskList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { tasks: initialTasks, categories, projects, todayEnergy, setTasks: setAllTasks } = useDashboardData();
  const userId = user?.uid;

  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = React.useState<EnergyLevel | 'all'>('all');
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const { toast } = useToast();
  const { setFocusedTask, focusedTask } = React.useContext(PomodoroContext);

  const handleComplete = (id: string, completed: boolean) => {
    if (!firestore || !userId) return;

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
        } catch(error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem updating your task. Reverting changes.',
            });
            setAllTasks(originalTasksState);
        }
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'> | Partial<Omit<Task, 'id' | 'userId'>>) => {
    if (!firestore || !userId) return;
    startTransition(async () => {
      try {
        const newTask = await addTask(firestore, userId, taskData as Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'>);
        setAllTasks(prev => [...prev, newTask]);
        toast({
          title: 'Task created!',
          description: 'Your new task has been added.',
        });
        await onClientWrite();
      } catch(error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  }

  const handleUpdateTask = (taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
    if (!firestore || !userId) return;
    startTransition(async () => {
      try {
        await updateTask(firestore, userId, taskId, taskData);
        setAllTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...taskData } : task));
        toast({ title: "Task updated!" });
        setEditingTask(null);
        await onClientWrite();
      } catch(error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem updating your task.',
        });
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!firestore || !userId) return;
    startTransition(async () => {
      try {
        await deleteTask(firestore, userId, taskId);
        setAllTasks(prev => prev.filter(task => task.id !== taskId));
        toast({ title: "Task deleted!" });
        setEditingTask(null);
        await onClientWrite();
      } catch(error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem deleting your task.',
        });
      }
    });
  };


  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? categoryId;
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name;
  }

  const filteredTasks = initialTasks.filter(task => {
    if (filter === 'all') return !task.completed;
    return task.energyLevel === filter && !task.completed;
  });

  return (
    <>
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <ListTodo className="text-primary"/>
                    Your Tasks
                </CardTitle>
                <CardDescription>Manage your daily objectives.</CardDescription>
            </div>
             <div className="flex items-center gap-2">
                 <Select value={filter} onValueChange={(value) => setFilter(value as EnergyLevel | 'all')}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Filter by energy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Energy</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <TaskFormDialog
                    categories={categories}
                    projects={projects}
                    onSave={handleCreateTask}
                    isPending={isPending}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
            {filteredTasks.length > 0 ? (
                <TooltipProvider>
                {filteredTasks.map(task => {
                    const Icon = task.energyLevel ? energyIcons[task.energyLevel] : null;
                    const isAligned = todayEnergy?.level && task.energyLevel ? todayEnergy.level === task.energyLevel : false;
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
                                onCheckedChange={(checked) => handleComplete(task.id, !!checked)}
                                disabled={isPending}
                                className="mt-1"
                            />
                            <div className="flex-grow min-w-0">
                                <label htmlFor={`task-${task.id}`} className={cn("font-semibold text-sm sm:text-base block break-words", task.completed && "line-through text-muted-foreground")}>
                                    {task.name}
                                </label>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground mt-1.5">
                                    {task.category && <Badge variant="secondary" className="capitalize text-xs">{getCategoryName(task.category)}</Badge>}
                                    {task.energyLevel && Icon && (
                                      <div className="flex items-center gap-1 whitespace-nowrap">
                                          <Icon className="size-3 flex-shrink-0" />
                                          <span className="hidden sm:inline">{task.energyLevel} Energy</span>
                                          <span className="sm:hidden">{task.energyLevel}</span>
                                      </div>
                                    )}
                                    {projectName && (
                                        <div className="flex items-center gap-1 max-w-[120px] sm:max-w-none truncate">
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
                            <div className="absolute top-2 right-2 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 md:transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8"
                                            onClick={() => setFocusedTask(task)}
                                        >
                                            <PlayCircle className="size-3.5 sm:size-4" />
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
                                            className="h-7 w-7 sm:h-8 sm:w-8"
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <Edit className="size-3.5 sm:size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Edit task</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    );
                })}
                </TooltipProvider>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    <p>All tasks for this filter are complete. Well done!</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
    {editingTask && (
        <TaskFormDialog
            task={editingTask}
            categories={categories}
            projects={projects}
            open={!!editingTask}
            onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
            onSave={(data) => handleUpdateTask(editingTask.id, data)}
            onDelete={handleDeleteTask}
            isPending={isPending}
        />
    )}
    </>
  );
}
