'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore } from '@/firebase';
import { updateDoc, doc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { addTask, addWorkdayTask } from '@/lib/data-firestore';
import { Loader2, Sun, Calendar, ListTodo, Target, Brain, Sparkles, ChevronRight, ChevronLeft, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, RecurringTask, EnergyLevel, EisenhowerMatrix, Project } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { processBrainDump } from '@/ai/flows/process-brain-dump';
import type { ProcessBrainDumpOutput } from '@/ai/flows/process-brain-dump';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ExtractedTask = ProcessBrainDumpOutput['tasks'][0] & {
  id: string;
  included: boolean;
  addToWorkday: boolean;
};

export function MorningPlanModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { tasks, recurringTasks, projects } = useDashboardData();
    const [currentStep, setCurrentStep] = React.useState(0);
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
    const [intention, setIntention] = React.useState('');
    const [brainDumpText, setBrainDumpText] = React.useState('');
    const [extractedData, setExtractedData] = React.useState<ProcessBrainDumpOutput | null>(null);
    const [extractedTasks, setExtractedTasks] = React.useState<ExtractedTask[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isSubmitting, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggleTask = (taskId: string) => {
        const newSelected = new Set(selectedTaskIds);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTaskIds(newSelected);
    };

    const handleProcessBrainDump = async () => {
        if (!brainDumpText.trim()) {
            toast({
                variant: "destructive",
                title: "Empty brain dump",
                description: "Please write down your thoughts first.",
            });
            return;
        }

        setIsProcessing(true);
        try {
            const result = await processBrainDump({
                brainDumpText,
                existingProjects: projects.map(p => ({ id: p.id, name: p.name })),
            });

            setExtractedData(result);

            // Convert extracted tasks to editable format
            const tasksWithMetadata: ExtractedTask[] = result.tasks.map((task, index) => ({
                ...task,
                id: `extracted-${index}`,
                included: true,
                addToWorkday: true,
            }));

            setExtractedTasks(tasksWithMetadata);

            // Pre-fill intention with extracted goals
            if (result.goals.length > 0) {
                setIntention(result.goals.join('\n'));
            }

            setCurrentStep(1); // Move to review step
        } catch (error) {
            console.error('Brain dump processing error', error);
            toast({
                variant: "destructive",
                title: "Processing failed",
                description: "Failed to process your brain dump. Please try again.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateExtractedTask = (taskId: string, updates: Partial<ExtractedTask>) => {
        setExtractedTasks(prev =>
            prev.map(task => task.id === taskId ? { ...task, ...updates } : task)
        );
    };

    const handleSubmit = async () => {
        if (!user || !firestore) return;

        startTransition(async () => {
            try {
                const today = format(new Date(), 'yyyy-MM-dd');
                const newTaskIds: string[] = [];

                // 1. Create new tasks from brain dump if any
                for (const extractedTask of extractedTasks.filter(t => t.included)) {
                    // Build task data, excluding undefined values (Firestore doesn't accept undefined)
                    const taskData: any = {
                        name: extractedTask.name,
                        energyLevel: extractedTask.energyLevel as EnergyLevel,
                        category: extractedTask.category,
                        priority: extractedTask.priority as EisenhowerMatrix,
                        state: 'ready',
                        stateHistory: [],
                    };

                    // Only add optional fields if they have values
                    if (extractedTask.suggestedProjectId) {
                        taskData.projectId = extractedTask.suggestedProjectId;
                    }
                    if (extractedTask.details) {
                        taskData.details = extractedTask.details;
                    }
                    if (extractedTask.deadline) {
                        taskData.deadline = extractedTask.deadline;
                    }

                    const newTask = await addTask(firestore, user.uid, taskData);

                    newTaskIds.push(newTask.id);

                    // Add to workday if selected
                    if (extractedTask.addToWorkday) {
                        await addWorkdayTask(firestore, user.uid, newTask.id, 'regular', today);
                    }
                }

                // 2. Add selected existing tasks to workday
                const existingTaskPromises = Array.from(selectedTaskIds).map(taskId => {
                    const isRecurring = recurringTasks.some(rt => rt.id === taskId);
                    return addWorkdayTask(firestore, user.uid, taskId, isRecurring ? 'recurring' : 'regular', today);
                });

                const results = await Promise.allSettled(existingTaskPromises);

                // Check for failures
                const failures = results.filter(r => r.status === 'rejected');
                if (failures.length > 0) {
                    console.error('Some tasks failed to add:', failures);
                }

                // 3. Save daily intention if provided
                if (intention.trim()) {
                    const reportRef = doc(firestore, `users/${user.uid}/reports/${today}`);
                    await setDoc(reportRef, { dailyGoalsText: intention }, { merge: true });
                }

                // 4. Mark morning planning as done for today
                const prefsRef = doc(firestore, `users/${user.uid}/preferences/settings`);
                await setDoc(prefsRef, { lastMorningPlanDate: today }, { merge: true });

                const successfulExistingTasks = selectedTaskIds.size - failures.length;

                toast({
                    title: "Good morning! ☀️",
                    description: `Your workday has been planned with ${newTaskIds.length + successfulExistingTasks} task(s). Let's make it a great one!`,
                });

                // Reset state BEFORE closing to prevent stale data flash
                setCurrentStep(0);
                setBrainDumpText('');
                setExtractedData(null);
                setExtractedTasks([]);
                setIntention('');
                setSelectedTaskIds(new Set());

                onOpenChange(false);
            } catch (error) {
                console.error('Morning plan submission error', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to save your plan. Please try again."
                });
            }
        });
    };

    // Filter tasks suggestions
    const suggestedTasks = React.useMemo(() => {
        const incomplete = tasks.filter(t => !t.completed).slice(0, 5);
        return incomplete;
    }, [tasks]);

    const suggestedRecurring = React.useMemo(() => {
        return recurringTasks.slice(0, 5);
    }, [recurringTasks]);

    const canProceedFromBrainDump = brainDumpText.trim().length > 0 || currentStep > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-4 border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sun className="h-5 w-5 text-orange-500" />
                            Good Morning!
                        </DialogTitle>
                        <DialogDescription>
                            Let's take a moment to clear your mind and plan your day intentionally.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        {[0, 1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                                    currentStep === step
                                        ? 'bg-orange-500 text-white'
                                        : currentStep > step
                                        ? 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {step + 1}
                                </div>
                                {step < 3 && <div className={`h-0.5 flex-1 ${currentStep > step ? 'bg-orange-200 dark:bg-orange-800' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Step 0: Brain Dump */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Brain className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">Brain Dump</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Pour out everything on your mind. Don't worry about structure - just write paragraphs about all the things you need to get done, ideas you have, worries, tasks, projects... anything!
                                    </p>
                                </div>
                            </div>

                            <Textarea
                                placeholder="Example: I really need to finish that client presentation by Friday, also need to respond to those emails from yesterday. The marketing campaign needs planning and I should probably schedule that team meeting. Don't forget to work out today and maybe meal prep for the week. Been meaning to learn more about that new framework too..."
                                value={brainDumpText}
                                onChange={(e) => setBrainDumpText(e.target.value)}
                                className="min-h-[300px] resize-none text-base"
                                autoFocus
                            />

                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <span>Our AI will help organize your thoughts into actionable goals and tasks</span>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Review Extracted Items */}
                    {currentStep === 1 && extractedData && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">Review & Edit</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        We've organized your thoughts. Review and edit as needed, then choose which tasks to add to your workday.
                                    </p>
                                </div>
                            </div>

                            {/* Extracted Goals */}
                            {extractedData.goals.length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        <Target className="h-4 w-4 text-blue-500" />
                                        Extracted Goals
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {extractedData.goals.map((goal, idx) => (
                                            <li key={idx}>{goal}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Extracted Tasks */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Extracted Tasks ({extractedTasks.filter(t => t.included).length} selected)</h4>

                                {extractedTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No tasks extracted from your brain dump.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {extractedTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`p-4 border rounded-lg space-y-3 transition-all ${
                                                    task.included
                                                        ? 'bg-white dark:bg-gray-950 border-purple-200 dark:border-purple-800'
                                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        id={`task-${task.id}`}
                                                        checked={task.included}
                                                        onCheckedChange={(checked) =>
                                                            handleUpdateExtractedTask(task.id, { included: checked as boolean })
                                                        }
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            value={task.name}
                                                            onChange={(e) => handleUpdateExtractedTask(task.id, { name: e.target.value })}
                                                            className="font-medium"
                                                            disabled={!task.included}
                                                        />

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Energy Level</Label>
                                                                <Select
                                                                    value={task.energyLevel}
                                                                    onValueChange={(value) =>
                                                                        handleUpdateExtractedTask(task.id, { energyLevel: value as EnergyLevel })
                                                                    }
                                                                    disabled={!task.included}
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Low">Low</SelectItem>
                                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                                        <SelectItem value="High">High</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Category</Label>
                                                                <Select
                                                                    value={task.category}
                                                                    onValueChange={(value) =>
                                                                        handleUpdateExtractedTask(task.id, { category: value as any })
                                                                    }
                                                                    disabled={!task.included}
                                                                >
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="work">Work</SelectItem>
                                                                        <SelectItem value="personal">Personal</SelectItem>
                                                                        <SelectItem value="learning">Learning</SelectItem>
                                                                        <SelectItem value="health">Health</SelectItem>
                                                                        <SelectItem value="chore">Chore</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {task.included && (
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    id={`workday-${task.id}`}
                                                                    checked={task.addToWorkday}
                                                                    onCheckedChange={(checked) =>
                                                                        handleUpdateExtractedTask(task.id, { addToWorkday: checked as boolean })
                                                                    }
                                                                />
                                                                <Label htmlFor={`workday-${task.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                                    Add to today's workday
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Set Intention */}
                    {currentStep === 2 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 font-medium text-primary">
                                <Target className="h-4 w-4" />
                                <span>Set your intention</span>
                            </div>
                            <Label htmlFor="intention" className="sr-only">Daily Intention</Label>
                            <Textarea
                                id="intention"
                                placeholder="What is your main focus or goal for today?"
                                value={intention}
                                onChange={(e) => setIntention(e.target.value)}
                                className="resize-none"
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                {extractedData?.goals.length ? 'Pre-filled with goals from your brain dump. Feel free to edit!' : 'Optional: Set your main intention for the day.'}
                            </p>
                        </div>
                    )}

                    {/* Step 3: Select Additional Tasks */}
                    {currentStep === 3 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 font-medium text-primary">
                                <ListTodo className="h-4 w-4" />
                                <span>Add more focus tasks (optional)</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Select any additional existing tasks to add to your workday.
                            </p>

                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="w-full justify-start">
                                    <TabsTrigger value="pending">Pending Tasks</TabsTrigger>
                                    <TabsTrigger value="recurring">Recurring</TabsTrigger>
                                </TabsList>
                                <TabsContent value="pending" className="mt-3 space-y-2">
                                    {suggestedTasks.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No pending tasks found.</p>
                                    ) : suggestedTasks.map(task => (
                                        <div key={task.id} className="flex items-start space-x-3 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                                            <Checkbox
                                                id={`mp-${task.id}`}
                                                checked={selectedTaskIds.has(task.id)}
                                                onCheckedChange={() => handleToggleTask(task.id)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor={`mp-${task.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {task.name}
                                                </label>
                                                {task.category && (
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {task.category}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </TabsContent>
                                <TabsContent value="recurring" className="mt-3 space-y-2">
                                    {suggestedRecurring.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No recurring tasks found.</p>
                                    ) : suggestedRecurring.map(task => (
                                        <div key={task.id} className="flex items-start space-x-3 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                                            <Checkbox
                                                id={`mp-rec-${task.id}`}
                                                checked={selectedTaskIds.has(task.id)}
                                                onCheckedChange={() => handleToggleTask(task.id)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor={`mp-rec-${task.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {task.name}
                                                </label>
                                                <p className="text-xs text-muted-foreground">
                                                    Frequency: {task.frequency || 'Daily'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-4 border-t bg-muted/10 flex-row justify-between">
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                disabled={isProcessing || isSubmitting}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing || isSubmitting}>
                            Skip for now
                        </Button>

                        {currentStep === 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(2)}
                                    disabled={isProcessing}
                                >
                                    Skip Brain Dump
                                </Button>
                                <Button
                                    onClick={handleProcessBrainDump}
                                    disabled={!brainDumpText.trim() || isProcessing}
                                >
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isProcessing ? 'Processing...' : 'Process'}
                                    {!isProcessing && <ChevronRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </>
                        )}

                        {currentStep === 1 && (
                            <Button onClick={() => setCurrentStep(2)}>
                                Continue
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}

                        {currentStep === 2 && (
                            <Button onClick={() => setCurrentStep(3)}>
                                Continue
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}

                        {currentStep === 3 && (
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Start My Day
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
