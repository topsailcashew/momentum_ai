'use client';

import * as React from 'react';
import Link from 'next/link';
import { Folder, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project, Task } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { ProjectDialog } from './project-dialog';
import { cn, getProjectProgress } from '@/lib/utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export function ProjectOverview() {
  const { projects, tasks } = useDashboardData();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                      <Folder className="text-primary size-4"/>
                      Projects
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                      <Link href="/projects">
                          <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                  </Button>
              </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
              {projects.length > 0 ? (
                <div className="space-y-3">
                    {projects.slice(0, 5).map(project => {
                        const progress = getProjectProgress(project.id, tasks);
                        return (
                           <div
                             key={project.id}
                             className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                             onClick={() => setSelectedProject(project)}
                           >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-medium line-clamp-1 flex-1">{project.name}</h4>
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{progress.percentage}%</span>
                              </div>
                              <Progress value={progress.percentage} className="h-1.5 mb-1.5" />
                              <p className="text-xs text-muted-foreground">{progress.text} tasks done</p>
                           </div>
                        )
                    })}
                    {projects.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        asChild
                      >
                        <Link href="/projects">
                          View {projects.length - 5} more
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                </div>
              ) : (
                  <div className="text-center text-muted-foreground py-8">
                      <Folder className="mx-auto h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No projects yet</p>
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
