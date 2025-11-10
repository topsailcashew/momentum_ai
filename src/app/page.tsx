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
import { createTaskAction, getSuggestedTasks, completeTaskAction } from '@/app/actions';
import { EnergyInput } from '@/components/dashboard/energy-input';
import { MomentumCard } from '@/components/dashboard/momentum-card';
import { TaskList } from '@/components/dashboard/task-list';
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';
import { Task, EnergyLog, MomentumScore, Category, Project, EnergyLevel } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  });
  const [focusedTask, setFocusedTask] = React.useState<Task | null>(null);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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
        const suggestionData = await getSuggestedTasks(todayEnergyData.level);
        setSuggestions(suggestionData);
      }
      setLoading(false);
    }
    fetchData();
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

  const handleCompleteTask = (taskId: string, completed: boolean) => {
    // Optimistically update the UI
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
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, completed: !completed, completedAt: !completed ? new Date().toISOString() : null }
              : task
          )
        );
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
              <Skeleton className="h-8 w-1/3" />
              <div className="grid gap-4 lg:grid-cols-3">
                  <Skeleton className="h-32 lg:col-span-1" />
                  <Skeleton className="h-64 lg:col-span-2" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
              </div>
              <Skeleton className="h-48" />
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight font-headline">
        Dashboard
      </h1>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Pomodoro task={focusedTask} />
        </div>
        <div className="lg:col-span-2">
            <TaskList 
              tasks={tasks} 
              categories={categories} 
              todayEnergy={todayEnergy} 
              projects={projects}
              onFocusTask={setFocusedTask}
              focusedTaskId={focusedTask?.id}
              onCreateTask={handleCreateTask}
              onCompleteTask={handleCompleteTask}
              isCreatingTask={isPending}
            />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MomentumCard 
            latestMomentum={latestMomentum} 
            routineSuggestion={suggestions.routineSuggestion} 
        />
        <EnergyInput todayEnergy={todayEnergy} suggestions={suggestions} />
      </div>
    </div>
  );
}
