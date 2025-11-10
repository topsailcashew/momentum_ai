'use client';

import * as React from 'react';
import Link from 'next/link';
import { Folder, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project, Task } from '@/lib/types';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProjectDialog } from './project-dialog';

export function ProjectOverview({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return { percentage: 0, text: "No tasks", data: [] };
    const completedTasks = projectTasks.filter(t => t.completed).length;
    const totalTasks = projectTasks.length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    return {
      percentage,
      text: `${completedTasks} / ${totalTasks}`,
      data: [{ name: 'Progress', value: percentage, fill: "hsl(var(--primary))" }]
    };
  }

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  return (
    <>
      <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <Folder className="text-primary"/>
                      Projects Overview
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm">
                      <Link href="/projects">
                          View All
                          <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                  </Button>
              </div>
          </CardHeader>
          <CardContent>
              {projects.length > 0 ? (
                <Carousel
                  opts={{
                    align: "start",
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {projects.map(project => {
                        const progress = getProjectProgress(project.id);
                        return (
                           <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3">
                             <div className="p-1">
                                <Card 
                                  className="bg-secondary/30 cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => setSelectedProject(project)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">{progress.text} completed</p>
                                        <ChartContainer
                                            config={{
                                                value: { label: "Progress", color: "hsl(var(--primary))" }
                                            }}
                                            className="mx-auto aspect-square h-16 w-16"
                                        >
                                            <RadialBarChart
                                                data={progress.data}
                                                startAngle={90}
                                                endAngle={-270}
                                                innerRadius="70%"
                                                outerRadius="100%"
                                                barSize={6}
                                                cy="55%"
                                            >
                                                <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
                                                <RadialBar dataKey="value" background cornerRadius={10} className="fill-primary" />
                                                <text
                                                    x="50%"
                                                    y="55%"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="fill-foreground text-xs font-medium"
                                                >
                                                    {progress.percentage}%
                                                </text>
                                            </RadialBarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </div>
                           </CarouselItem>
                        )
                    })}
                  </CarouselContent>
                   <div className="flex justify-center items-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0" />
                    <CarouselNext className="static translate-y-0" />
                  </div>
                </Carousel>
              ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                      <p>No projects yet. Create one on the projects page!</p>
                  </div>
              )}
          </CardContent>
      </Card>
      {selectedProject && (
        <ProjectDialog
          project={selectedProject}
          tasks={getProjectTasks(selectedProject.id)}
          open={!!selectedProject}
          onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}
        />
      )}
    </>
  );
}
