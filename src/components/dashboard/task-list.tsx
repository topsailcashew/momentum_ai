'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskFormDialog } from './task-form-dialog';
import type { Task, Category, EnergyLevel, EnergyLog, Project, EisenhowerMatrix } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Zap, ZapOff, BatteryMedium, Target, ListTodo, Folder, PlayCircle, Shield, Edit } from 'lucide-react';
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
import { completeTaskAction, createTaskAction, deleteTaskAction, updateTaskAction } from '@/app/actions';
import { PomodoroContext } from './pomodoro-provider';


const energyIcons: Record<EnergyLevel, React.ElementType> = {
  Low: ZapOff,
  Medium: BatteryMedium,
  High: Zap,
};

const priorityColors: Record<EisenhowerMatrix, string> = {
    'Urgent & Important': 'text-red-500',
    'Important & Not Urgent': 'text-amber-500',
    'Urgent & Not Important': 'text-blue-500',
    'Not Urgent & Not Important': 'text-gray-500',
}

interface TaskListProps {
    initialTasks: Task[];
    categories: Category[];
    todayEnergy?: EnergyLog;
    projects: Project[];
    userId: string;
}

export function TaskList({ initialTasks, categories, projects, todayEnergy, userId }: TaskListProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = React.useState<EnergyLevel | 'all'>('all');
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const { toast } = useToast();
  const { setFocusedTask, focusedTask } = React.useContext(PomodoroContext);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleComplete = (id: string, completed: boolean) => {
    // Optimistic update
    const originalTasks = tasks;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
          : task
      )
    );

    startTransition(async () => {
      try {
        await completeTaskAction(userId, id, completed);
        // Let server action handle revalidation
      } catch (error) {
        setTasks(originalTasks);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem updating your task.',
        });
      }
    });
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'> | Partial<Omit<Task, 'id'>>, taskId?: string) => {
    startTransition(async () => {
      try {
        await createTaskAction(userId, taskData);
        toast({
          title: 'Task created!',
          description: 'Your new task has been added.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your task.',
        });
      }
    });
  }

  const handleUpdateTask = (taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
    startTransition(async () => {
        try {
            await updateTaskAction(userId, taskId, taskData);
            toast({ title: "Task updated!" });
            setEditingTask(null);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem updating your task.',
            });
        }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
        try {
            await deleteTaskAction(userId, taskId);
            toast({ title: "Task deleted!" });
            setEditingTask(null);
        } catch (error) {
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

  const filteredTasks = tasks.filter(task => {
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
                    const Icon = energyIcons[task.energyLevel];
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
                                onCheckedChange={(checked) => handleComplete(task.id, !!checked)}
                                disabled={isPending}
                                className="mt-1"
                            />
                            <div className="flex-grow">
                                <label htmlFor={`task-${task.id}`} className={cn("font-semibold text-sm", task.completed && "line-through text-muted-foreground")}>
                                    {task.name}
                                </label>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                    <Badge variant="secondary" className="capitalize">{getCategoryName(task.category)}</Badge>
                                    <div className="flex items-center gap-1">
                                        <Icon className="size-3" />
                                        <span>{task.energyLevel} Energy</span>
                                    </div>
                                    {projectName && (
                                        <div className="flex items-center gap-1">
                                            <Folder className="size-3" />
                                            <span>{projectName}</span>
                                        </div>
                                    )}
                                    {task.priority && (
                                        <Tooltip>
                                            <TooltipTrigger className="flex items-center gap-1">
                                                <Shield className={cn("size-3", priorityColor)} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{task.priority}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                                 {todayEnergy && !task.completed && (
                                     <div className={cn(
                                         "flex items-center gap-1.5 text-xs mt-1.5",
                                         isAligned ? "text-primary" : "text-amber-600"
                                     )}>
                                        <Target className="size-3"/>
                                        <span>{isAligned ? "Perfect for your current energy" : "Not aligned with today's vibe"}</span>
                                     </div>
                                 )}
                            </div>
                            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setFocusedTask(task)}
                                        >
                                            <PlayCircle className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Start Pomodoro session</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <Edit className="size-4" />
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
