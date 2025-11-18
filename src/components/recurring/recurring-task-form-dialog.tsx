'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Category, Project, RecurringTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const recurringTaskFormSchema = z.object({
  name: z.string().min(1, 'Task name is required.'),
  category: z.string().optional(),
  energyLevel: z.enum(['Low', 'Medium', 'High', 'none']).optional(),
  frequency: z.enum(['Weekly', 'Monthly']),
  projectId: z.string().optional(),
  deadline: z.date().optional(),
  priority: z.enum(['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Not Urgent & Not Important']).optional(),
  collaboration: z.string().optional(),
  details: z.string().optional(),
});

type RecurringTaskFormValues = z.infer<typeof recurringTaskFormSchema>;
type RecurringTaskData = Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId' | 'createdAt'>;

interface RecurringTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: RecurringTaskData) => void;
  isPending: boolean;
  children?: React.ReactNode;
}

export function RecurringTaskFormDialog({
  open,
  onOpenChange,
  onSave,
  isPending,
  children,
}: RecurringTaskFormDialogProps) {
  const { categories, projects } = useDashboardData();

  const form = useForm<RecurringTaskFormValues>({
    resolver: zodResolver(recurringTaskFormSchema),
    defaultValues: {
      name: '',
      category: undefined,
      energyLevel: undefined,
      frequency: 'Weekly',
      projectId: 'none',
      collaboration: '',
      details: '',
    },
  });

  const onSubmit = (data: RecurringTaskFormValues) => {
    const taskData: RecurringTaskData = {
      name: data.name,
      category: data.category === 'none' ? undefined : data.category,
      energyLevel: data.energyLevel === 'none' ? undefined : (data.energyLevel as any),
      frequency: data.frequency,
      projectId: data.projectId === 'none' ? undefined : data.projectId,
      deadline: data.deadline ? data.deadline.toISOString() : undefined,
      priority: data.priority,
      collaboration: data.collaboration || undefined,
      details: data.details || undefined,
    };

    onSave(taskData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recurring Task</DialogTitle>
          <DialogDescription>
            Create a task that resets weekly or monthly
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Task Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency - Special field for recurring tasks */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
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

              {/* Energy Level */}
              <FormField
                control={form.control}
                name="energyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
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

              {/* Deadline */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (Eisenhower Matrix)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Collaboration */}
            <FormField
              control={form.control}
              name="collaboration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collaboration</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., with Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Details */}
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes, links, or context..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Create Recurring Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
