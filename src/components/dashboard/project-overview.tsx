'use client';

import * as React from 'react';
import { useTransition } from 'react';
import Link from 'next/link';
import { Folder, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project, Task } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { ProjectDialog } from './project-dialog';
import { TaskFormDialog } from './task-form-dialog';
import { cn, getProjectProgress } from '@/lib/utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateTask, deleteTask, markTaskAsComplete } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';

export function ProjectOverview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { projects, tasks, categories, setTasks } = useDashboardData();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = React.useState(false);

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
          onTaskToggle={handleTaskToggle}
          onTaskEdit={handleTaskEdit}
          onTaskDelete={handleTaskDelete}
        />
      )}
      <TaskFormDialog
        categories={categories}
        projects={projects}
        onSave={handleTaskSave}
        isPending={isPending}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        editingTask={editingTask || undefined}
      />
    </>
  );
}
