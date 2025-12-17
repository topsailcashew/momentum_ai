'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Project, Task } from '@/lib/types';
import { Folder, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectDialogProps {
  project: Project;
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function ProjectDialog({ project, tasks, open, onOpenChange, onTaskToggle, onTaskEdit, onTaskDelete }: ProjectDialogProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const openTasks = tasks.filter(t => !t.completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="text-primary" />
            {project.name}
          </DialogTitle>
          <DialogDescription>
            {completedTasks.length} of {tasks.length} tasks completed.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-4">
            {openTasks.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Open Tasks</h3>
                <div className="space-y-2">
                  {openTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 group">
                      <Checkbox
                        id={`task-overview-${task.id}`}
                        checked={false}
                        onCheckedChange={(checked) => onTaskToggle(task.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`task-overview-${task.id}`}
                        className="text-sm font-medium flex-1 cursor-pointer"
                      >
                        {task.name}
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onTaskDelete(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Completed Tasks</h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 group">
                      <Checkbox
                        id={`task-overview-${task.id}`}
                        checked={true}
                        onCheckedChange={(checked) => onTaskToggle(task.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`task-overview-${task.id}`}
                        className="text-sm font-medium text-muted-foreground line-through flex-1 cursor-pointer"
                      >
                        {task.name}
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onTaskDelete(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tasks.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">
                    <p>No tasks in this project yet.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
