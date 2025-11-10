'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Folder, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createProjectAction } from '@/app/actions';
import type { Project, Task } from '@/lib/types';
import Link from 'next/link';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectClientPage({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = (data: ProjectFormValues) => {
    startTransition(async () => {
      try {
        await createProjectAction(data.name);
        toast({ title: 'Project created!' });
        form.reset();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem creating your project.',
        });
      }
    });
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return { percentage: 0, text: "No tasks" };
    const completedTasks = projectTasks.filter(t => t.completed).length;
    const totalTasks = projectTasks.length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    return {
      percentage,
      text: `${completedTasks} / ${totalTasks} done`,
      data: [{ name: projectTasks[0].name, value: percentage, fill: "hsl(var(--primary))" }]
    };
  }

  return (
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
        {projects.map(project => {
            const progress = getProjectProgress(project.id);
            return (
            <Card key={project.id}>
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
                            {progress.text}
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
  );
}
