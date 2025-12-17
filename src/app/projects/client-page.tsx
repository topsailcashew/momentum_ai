'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Project, Task } from '@/lib/types';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { ProjectDetailsDialog } from '@/components/projects/project-details-dialog';
import { TaskFormDialog } from '@/components/dashboard/task-form-dialog';
import { getProjectProgress } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { addProject, updateProject, deleteProject, updateTask, deleteTask, markTaskAsComplete } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { projects: initialProjects, tasks, categories, loading: dataLoading, setProjects: setAllProjects, setTasks } = useDashboardData();

  const [isPending, startTransition] = useTransition();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = (data: ProjectFormValues) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        const newProject = await addProject(firestore, user.uid, { name: data.name, priority: 'Medium' });
        setAllProjects(prev => [...prev, newProject]);
        toast({ title: 'Project created!' });
        form.reset();
        await onClientWrite();
      } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to create project.' });
      }
    });
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      await updateProject(firestore, user.uid, projectId, updates);
      const optimisticUpdate = (prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, ...updates } as Project : p);
      setAllProjects(optimisticUpdate);
      toast({ title: "Project updated!" });
      if (selectedProject?.id === projectId) {
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
      }
      await onClientWrite();
    });
  };

  const handleDeleteProject = (projectId: string) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      await deleteProject(firestore, user.uid, projectId);
      const optimisticUpdate = (prev: Project[]) => prev.filter(p => p.id !== projectId);
      setAllProjects(optimisticUpdate);
      toast({ title: 'Project deleted' });
      setSelectedProject(null);
      await onClientWrite();
    });
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        await markTaskAsComplete(firestore, user.uid, taskId, completed);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined } : t));
        toast({ title: completed ? 'Task completed!' : 'Task reopened' });
        await onClientWrite();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to update task' });
      }
    });
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleTaskDelete = (taskId: string) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        await deleteTask(firestore, user.uid, taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast({ title: 'Task deleted' });
        await onClientWrite();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to delete task' });
      }
    });
  };

  const handleTaskSave = (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'> | Partial<Omit<Task, 'id' | 'userId'>>) => {
    if (!user || !firestore) return;
    startTransition(async () => {
      try {
        if (editingTask) {
          // Update existing task
          await updateTask(firestore, user.uid, editingTask.id, taskData);
          setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
          toast({ title: 'Task updated!' });
        }
        setShowTaskDialog(false);
        setEditingTask(null);
        await onClientWrite();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to save task' });
      }
    });
  };

  if (userLoading || dataLoading || !user) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="e.g., Q3 Marketing Campaign" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isPending ? 'Adding...' : 'Add Project'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialProjects.map(project => {
            const progress = getProjectProgress(project.id, tasks);
            return (
              <Card
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="card-interactive hover:border-primary/50 transition-all"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="text-primary" />
                      <span className="break-words line-clamp-2">{project.name}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {progress.completedTasks} of {progress.totalTasks} tasks done
                    </p>
                  </div>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Progress",
                        color: "hsl(var(--primary))",
                      }
                    }}
                    className="mx-auto aspect-square h-20 w-20"
                  >
                    <RadialBarChart
                      data={progress.data}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={8}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        dataKey="value"
                        tick={false}
                      />
                      <RadialBar
                        dataKey="value"
                        background
                        cornerRadius={10}
                        className="fill-primary"
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-sm font-medium"
                      >
                        {progress.text}
                      </text>
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      {selectedProject && (
        <ProjectDetailsDialog
          project={selectedProject}
          tasks={getProjectTasks(selectedProject.id)}
          open={!!selectedProject}
          onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          onTaskToggle={handleTaskToggle}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
          isPending={isPending}
          userId={user.uid}
        />
      )}
      <TaskFormDialog
        categories={categories}
        projects={initialProjects}
        onSave={handleTaskSave}
        isPending={isPending}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        editingTask={editingTask || undefined}
      />
    </>
  );
}
