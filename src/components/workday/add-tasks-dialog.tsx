'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Task, WorkdayTask } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { getAllAvailableTasks, addWorkdayTask, addTask } from '@/lib/data-firestore';
import { useToast } from '@/hooks/use-toast';
import { onClientWrite } from '@/app/actions';
import { format } from 'date-fns';
import { Zap, ZapOff, Battery, Folder, Repeat, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const taskFormSchema = z.object({
  name: z.string().min(1, 'Task name is required.'),
  category: z.string().optional(),
  energyLevel: z.enum(['Low', 'Medium', 'High', 'none']).optional(),
  projectId: z.string().optional(),
  deadline: z.date().optional(),
  priority: z.enum(['Urgent & Important', 'Important & Not Urgent', 'Urgent & Not Important', 'Not Urgent & Not Important']).optional(),
  collaboration: z.string().optional(),
  details: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function AddTasksDialog({
  open,
  onOpenChange,
  workdayTasks,
  onTasksAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workdayTasks: WorkdayTask[];
  onTasksAdded: (tasks: WorkdayTask[]) => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { tasks: regularTasks, categories, projects, setTasks } = useDashboardData();
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [allTasks, setAllTasks] = React.useState<Array<Task & { source: 'regular' | 'recurring' }>>([]);
  const [showOptionalFields, setShowOptionalFields] = React.useState(false);
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      category: undefined,
      energyLevel: undefined,
      projectId: 'none',
      collaboration: '',
      details: '',
    },
  });

  // Load all available tasks (regular + recurring)
  React.useEffect(() => {
    if (!firestore || !user || !open) return;

    const loadTasks = async () => {
      try {
        const tasks = await getAllAvailableTasks(firestore, user.uid);
        setAllTasks(tasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    loadTasks();
  }, [firestore, user, open]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        category: undefined,
        energyLevel: undefined,
        projectId: 'none',
        deadline: undefined,
        priority: undefined,
        collaboration: '',
        details: '',
      });
      setShowOptionalFields(false);
    }
  }, [open, form]);

  // Filter out tasks already in workday
  const workdayTaskIds = new Set(workdayTasks.map(wt => wt.taskId));
  const availableTasks = allTasks.filter(t => !workdayTaskIds.has(t.id) && !t.completed);

  const regularAvailableTasks = availableTasks.filter(t => t.source === 'regular');
  const recurringAvailableTasks = availableTasks.filter(t => t.source === 'recurring');

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddTasks = () => {
    if (selectedTaskIds.size === 0) return;
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated. Please log in again.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const newWorkdayTasks: WorkdayTask[] = [];

        for (const taskId of selectedTaskIds) {
          const task = allTasks.find(t => t.id === taskId);
          if (task) {
            const workdayTask = await addWorkdayTask(
              firestore,
              user.uid,
              taskId,
              task.source === 'recurring' ? 'recurring' : 'regular',
              today
            );
            newWorkdayTasks.push(workdayTask);
          }
        }

        onTasksAdded(newWorkdayTasks);
        setSelectedTaskIds(new Set());
        onOpenChange(false);
        toast({
          title: 'Tasks added!',
          description: `${newWorkdayTasks.length} task(s) added to today's workday.`,
        });
        await onClientWrite();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem adding tasks to your workday.',
        });
      }
    });
  };

  const handleCreateAndAddTask = (data: TaskFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated. Please log in again.',
      });
      return;
    }

    startTransition(async () => {
      try {
        // Create the task - build object without undefined values
        const taskData: Record<string, any> = {
          name: data.name,
        };

        // Only add optional fields if they have values
        if (data.category && data.category !== 'none') {
          taskData.category = data.category;
        }

        if (data.energyLevel && data.energyLevel !== 'none') {
          taskData.energyLevel = data.energyLevel;
        }

        if (data.projectId && data.projectId !== 'none') {
          taskData.projectId = data.projectId;
        }

        if (data.deadline) {
          taskData.deadline = data.deadline.toISOString();
        }

        if (data.priority) {
          taskData.priority = data.priority;
        }

        if (data.collaboration && data.collaboration.trim() !== '') {
          taskData.collaboration = data.collaboration;
        }

        if (data.details && data.details.trim() !== '') {
          taskData.details = data.details;
        }

        const newTask = await addTask(firestore, user.uid, taskData as any);

        // Update local state
        setTasks((prev) => [...prev, newTask]);

        // Add to workday
        const workdayTask = await addWorkdayTask(
          firestore,
          user.uid,
          newTask.id,
          'regular',
          today
        );

        onTasksAdded([workdayTask]);
        onOpenChange(false);
        toast({
          title: 'Task created and added!',
          description: `"${newTask.name}" has been created and added to today's workday.`,
        });
        await onClientWrite();
      } catch (error) {
        console.error('Error creating task:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'There was a problem creating the task.',
        });
      }
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? categoryId;
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name;
  };

  const energyIcons = {
    Low: ZapOff,
    Medium: Battery,
    High: Zap,
  };

  const renderTaskItem = (task: Task & { source: 'regular' | 'recurring' }) => {
    const Icon = energyIcons[task.energyLevel ?? 'Medium'];
    const isSelected = selectedTaskIds.has(task.id);
    const projectName = task.projectId ? getProjectName(task.projectId) : null;

    return (
      <div
        key={task.id}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => handleToggleTask(task.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleTask(task.id)}
          className="mt-1"
        />
        <div className="flex-grow min-w-0">
          <div className="font-medium text-sm">{task.name}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
            <Badge variant="secondary" className="text-xs">
              {getCategoryName(task.category ?? 'personal')}
            </Badge>
            <div className="flex items-center gap-1">
              <Icon className="size-3" />
              <span>{task.energyLevel ?? 'Medium'}</span>
            </div>
            {projectName && (
              <div className="flex items-center gap-1 truncate">
                <Folder className="size-3" />
                <span className="truncate">{projectName}</span>
              </div>
            )}
            {task.source === 'recurring' && (
              <div className="flex items-center gap-1 text-purple-500">
                <Repeat className="size-3" />
                <span>Recurring</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Tasks to Today's Workday</DialogTitle>
          <DialogDescription>
            Select tasks to add to your workday for {format(new Date(), 'EEEE, MMMM d')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="regular" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regular">
              Regular Tasks ({regularAvailableTasks.length})
            </TabsTrigger>
            <TabsTrigger value="recurring">
              Recurring Tasks ({recurringAvailableTasks.length})
            </TabsTrigger>
            <TabsTrigger value="new">
              Add New Task
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {regularAvailableTasks.length > 0 ? (
                <div className="space-y-2">
                  {regularAvailableTasks.map(renderTaskItem)}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <p>No regular tasks available</p>
                  <p className="mt-1">All tasks are already in your workday or completed</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recurring" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {recurringAvailableTasks.length > 0 ? (
                <div className="space-y-2">
                  {recurringAvailableTasks.map(renderTaskItem)}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <p>No recurring tasks available</p>
                  <p className="mt-1">Create recurring tasks from the Recurring Tasks page</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateAndAddTask)} className="space-y-4">
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
                  <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-sm text-muted-foreground">
                          {showOptionalFields ? 'Hide' : 'Show'} optional fields
                        </span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          showOptionalFields && "rotate-180"
                        )} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
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
                                  <CalendarComponent
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
                      <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Details</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any relevant details, links, or notes..."
                                className="resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? 'Creating...' : 'Create & Add to Today'}
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTaskIds.size} task(s) selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTasks}
              disabled={selectedTaskIds.size === 0 || isPending}
            >
              Add {selectedTaskIds.size > 0 && `(${selectedTaskIds.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
