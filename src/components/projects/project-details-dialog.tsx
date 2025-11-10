'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Folder, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { updateProjectAction, deleteProjectAction } from '@/app/actions';
import type { Project, Task } from '@/lib/types';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.'),
});
type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectDetailsDialogProps {
  project: Project;
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsDialog({ project, tasks, open, onOpenChange }: ProjectDetailsDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const { toast } = useToast();

  const completedTasks = tasks.filter(t => t.completed);
  const openTasks = tasks.filter(t => !t.completed);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: project.name },
  });

  const handleUpdateProject = (data: ProjectFormValues) => {
    startUpdateTransition(async () => {
      try {
        await updateProjectAction(project.id, { name: data.name });
        toast({ title: 'Project updated!' });
        setIsEditing(false);
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error updating project',
          description: 'Could not save your changes. Please try again.',
        });
      }
    });
  };

  const handleDeleteProject = () => {
    startDeleteTransition(async () => {
      try {
        await deleteProjectAction(project.id);
        toast({ title: 'Project deleted' });
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error deleting project',
          description: 'Could not delete the project. Please try again.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setIsEditing(false);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="text-primary" />
            {isEditing ? 'Edit Project' : project.name}
          </DialogTitle>
          {!isEditing && (
            <DialogDescription>
              {completedTasks.length} of {tasks.length} tasks completed.
            </DialogDescription>
          )}
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProject)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdatePending}>
                  {isUpdatePending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <>
            <ScrollArea className="h-72">
              <div className="space-y-4 pr-4">
                {openTasks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Open Tasks</h3>
                    <div className="space-y-2">
                      {openTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                          <Checkbox id={`task-${task.id}`} checked={false} disabled />
                          <label htmlFor={`task-${task.id}`} className="text-sm font-medium">{task.name}</label>
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
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                          <Checkbox id={`task-${task.id}`} checked={true} disabled />
                          <label
                            htmlFor={`task-${task.id}`}
                            className="text-sm font-medium text-muted-foreground line-through"
                          >
                            {task.name}
                          </label>
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

            <DialogFooter className="justify-between">
              <div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2" /> Delete Project
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this project and all of its tasks.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            disabled={isDeletePending}
                        >
                            {isDeletePending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">Close</Button>
                 </DialogClose>
                 <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2" /> Edit Project
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}