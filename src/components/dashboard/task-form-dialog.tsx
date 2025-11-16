
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Category, Project, Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const taskFormSchema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  energyLevel: z.enum(['Low', 'Medium', 'High']),
  projectId: z.string().optional(),
  deadline: z.date().optional(),
  effort: z.coerce.number().min(1).max(3).optional(),
  focusType: z.enum(['Creative', 'Analytical', 'Physical', 'Administrative']).optional(),
  priority: z.enum(['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Not Urgent & Not Important']).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
type TaskData = Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>;

interface TaskFormDialogProps {
    task?: Task | null;
    categories: Category[];
    projects: Project[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSave: (data: TaskData | Partial<Omit<Task, 'id'>>, taskId?: string) => void;
    onDelete?: (taskId: string) => void;
    isPending: boolean;
    children?: React.ReactNode;
}

export function TaskFormDialog({ task, categories, projects, open: externalOpen, onOpenChange: externalOnOpenChange, onSave, onDelete, isPending, children }: TaskFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isEditing = !!task;
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const onOpenChange = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      category: '',
      energyLevel: 'Medium',
      projectId: 'none',
    },
  });

  React.useEffect(() => {
    if (open && task) {
        form.reset({
            name: task.name,
            category: task.category,
            energyLevel: task.energyLevel,
            projectId: task.projectId || 'none',
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            effort: task.effort,
            focusType: task.focusType,
            priority: task.priority,
        });
    } else if (!open) {
        form.reset({
          name: '',
          category: '',
          energyLevel: 'Medium',
          projectId: 'none',
          deadline: undefined,
          effort: undefined,
          focusType: undefined,
          priority: undefined,
        });
    }
  }, [open, task, form]);


  const onSubmit = (data: TaskFormValues) => {
    const taskData: TaskData | Partial<Omit<Task, 'id'>> = {
        ...data,
        projectId: data.projectId === 'none' ? undefined : data.projectId,
        deadline: data.deadline ? data.deadline.toISOString() : undefined,
    };
    onSave(taskData, task?.id);
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    if(task && onDelete) {
        onDelete(task.id);
        onOpenChange(false);
    }
  };

  const triggerButton = children ? children : (isEditing ? null : (
     <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add a new task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your task.' : 'What do you want to accomplish? Assign it an energy level.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Write proposal draft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Deadline</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="energyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select energy level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="effort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effort (1-3)</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() ?? ''}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select effort" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 (Low)</SelectItem>
                        <SelectItem value="2">2 (Medium)</SelectItem>
                        <SelectItem value="3">3 (High)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="focusType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select focus type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Creative">Creative</SelectItem>
                        <SelectItem value="Analytical">Analytical</SelectItem>
                        <SelectItem value="Physical">Physical</SelectItem>
                        <SelectItem value="Administrative">Administrative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Urgent & Important">Urgent & Important</SelectItem>
                        <SelectItem value="Important & Not Urgent">Important & Not Urgent</SelectItem>
                        <SelectItem value="Urgent & Not Important">Urgent & Not Important</SelectItem>
                        <SelectItem value="Not Urgent & Not Important">Not Urgent & Not Important</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className={cn(
              "pt-4",
              isEditing ? "sm:justify-between" : "sm:justify-end"
            )}>
                {isEditing && onDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this task.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                    {isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                    <DialogClose asChild>
                        <Button type="button" variant="ghost" className="flex-1 sm:flex-initial">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isPending} className="flex-1 sm:flex-initial">
                        {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    