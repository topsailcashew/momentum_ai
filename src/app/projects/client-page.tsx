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
import { getProjectProgress } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { addProject, updateProject, deleteProject } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { projects: initialProjects, tasks, loading: dataLoading, setProjects: setAllProjects } = useDashboardData();
  
  const [isPending, startTransition] = useTransition();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = (data: ProjectFormValues) => {
    if (!user) return;
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
    if (!user) return;
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
      if (!user) return;
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
                className="cursor-pointer hover:border-primary/50 transition-colors"
              >
                  <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <Folder className="text-primary"/>
                              {project.name}
                          </div>
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-muted-foreground">
                              {progress.text} done
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
                                  {progress.percentage}%
                              </text>
                          </RadialBarChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
          )})}
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
          isPending={isPending}
          userId={user.uid}
        />
      )}
    </>
  );
}
