'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
  getTasks,
  getTodayEnergy,
  getLatestMomentum,
  getCategories,
  getProjects,
} from '@/lib/data';
import { createTaskAction, getSuggestedTasks, completeTaskAction, updateTaskAction, deleteTaskAction } from '@/app/actions';
import { MomentumCard } from '@/components/dashboard/momentum-card';
import { TaskList } from '@/components/dashboard/task-list';
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';
import { Task, EnergyLog, MomentumScore, Category, Project, EnergyLevel } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { EditTaskDialog } from '@/components/dashboard/edit-task-dialog';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [todayEnergy, setTodayEnergy] = React.useState<EnergyLog | undefined>();
  const [latestMomentum, setLatestMomentum] = React.useState<MomentumScore | undefined>();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [suggestions, setSuggestions] = React.useState<ScoreAndSuggestTasksOutput>({
    suggestedTasks: [],
    microSuggestions: [],
    routineSuggestion: undefined,
  });
  const [focusedTask, setFocusedTask] = React.useState<Task | null>(null);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEnergyChange = (newEnergy: EnergyLog) => {
      setTodayEnergy(newEnergy);
  }

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [
        tasksData,
        todayEnergyData,
        latestMomentumData,
        categoriesData,
        projectsData,
      ] = await Promise.all([
        getTasks(),
        getTodayEnergy(),
        getLatestMomentum(),
        getCategories(),
        getProjects(),
      ]);

      setTasks(tasksData);
      setTodayEnergy(todayEnergyData);
      setLatestMomentum(latestMomentumData);
      setCategories(categoriesData);
      setProjects(projectsData);
      
      if (todayEnergyData) {
        startTransition(async () => {
            const suggestionData = await getSuggestedTasks(todayEnergyData.level);
            setSuggestions(suggestionData);
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  React.useEffect(() => {
    if (todayEnergy) {
      startTransition(async () => {
        const suggestionData = await getSuggestedTasks(todayEnergy.level);
        setSuggestions(suggestionData);
      });
    }
  }, [todayEnergy?.level]);

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>) => {
    startTransition(async () => {
      try {
        const newTask = await createTaskAction(taskData);
        setTasks(prevTasks => [...prevTasks, newTask]);
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
            const updatedTask = await updateTaskAction(taskId, taskData);
            if (updatedTask) {
                setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
                toast({ title: "Task updated!" });
                setEditingTask(null);
            }
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
            await deleteTaskAction(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
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


  const handleCompleteTask = (taskId: string, completed: boolean) => {
    // Optimistically update the UI
    const originalTasks = tasks;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null }
          : task
      )
    );

    startTransition(async () => {
      try {
        await completeTaskAction(taskId, completed);
        // Re-fetch momentum score after completion
        if (completed) {
            const latestMomentumData = await getLatestMomentum();
            setLatestMomentum(latestMomentumData);
        }
      } catch (error) {
        // Revert the optimistic update if there was an error
        setTasks(originalTasks);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem updating your task.',
        });
      }
    });
  };


  if (loading) {
      return (
          <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-2">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
              </div>
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
          </div>
      )
  }

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
            <Pomodoro task={focusedTask} />
        </div>
        <div>
            <TaskList 
              tasks={tasks} 
              categories={categories} 
              todayEnergy={todayEnergy} 
              projects={projects}
              onFocusTask={setFocusedTask}
              onEditTask={setEditingTask}
              focusedTaskId={focusedTask?.id ?? null}
              onCreateTask={handleCreateTask}
              onCompleteTask={handleCompleteTask}
              isCreatingTask={isPending}
            />
        </div>
      </div>
      
      <ProjectOverview projects={projects} tasks={tasks} />

       <MomentumCard 
          latestMomentum={latestMomentum} 
          routineSuggestion={suggestions.routineSuggestion} 
          todayEnergy={todayEnergy}
          onEnergyChange={handleEnergyChange}
          suggestions={suggestions}
      />
    </div>
     {editingTask && (
        <EditTaskDialog
            task={editingTask}
            categories={categories}
            projects={projects}
            open={!!editingTask}
            onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            isPending={isPending}
        />
    )}
    </>
  );
}
