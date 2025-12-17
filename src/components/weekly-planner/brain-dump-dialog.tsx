'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addTask } from '@/lib/data-firestore';
import { onClientWrite } from '@/app/actions';
import { processBrainDump } from '@/ai/flows/process-brain-dump';
import type { ProcessBrainDumpOutput } from '@/ai/flows/process-brain-dump';
import type { Task, EnergyLevel, EisenhowerMatrix, Project } from '@/lib/types';
import { Brain, Loader2, Sparkles, Calendar } from 'lucide-react';

type ExtractedTask = ProcessBrainDumpOutput['tasks'][0] & {
    id: string;
    included: boolean;
    selectedDeadline?: string;
};

interface BrainDumpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTasksCreated: (tasks: Task[]) => void;
    projects: Project[];
    currentWeekStart: Date;
}

export function BrainDumpDialog({ open, onOpenChange, onTasksCreated, projects, currentWeekStart }: BrainDumpDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [brainDumpText, setBrainDumpText] = React.useState('');
    const [extractedData, setExtractedData] = React.useState<ProcessBrainDumpOutput | null>(null);
    const [extractedTasks, setExtractedTasks] = React.useState<ExtractedTask[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isSubmitting, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = React.useState(0); // 0: brain dump, 1: review tasks

    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    // Get days of the week for deadline selection
    const weekDays = React.useMemo(() => {
        const days = [];
        const current = new Date(weekStart);
        while (current <= weekEnd) {
            days.push({
                value: format(current, 'yyyy-MM-dd'),
                label: format(current, 'EEE, MMM d')
            });
            current.setDate(current.getDate() + 1);
        }
        return days;
    }, [weekStart, weekEnd]);

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

            const tasksWithMeta = result.tasks.map((task, index) => ({
                ...task,
                id: `extracted-${Date.now()}-${index}`,
                included: true,
                selectedDeadline: undefined, // Users will select deadline
            }));

            setExtractedTasks(tasksWithMeta);
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

    const toggleTaskIncluded = (taskId: string) => {
        setExtractedTasks(prev =>
            prev.map(t => t.id === taskId ? { ...t, included: !t.included } : t)
        );
    };

    const updateTaskDeadline = (taskId: string, deadline: string) => {
        setExtractedTasks(prev =>
            prev.map(t => t.id === taskId ? { ...t, selectedDeadline: deadline } : t)
        );
    };

    const updateTaskField = (taskId: string, field: keyof ExtractedTask, value: any) => {
        setExtractedTasks(prev =>
            prev.map(t => t.id === taskId ? { ...t, [field]: value } : t)
        );
    };

    const handleCreateTasks = () => {
        if (!user || !firestore) return;

        const tasksToCreate = extractedTasks.filter(t => t.included);

        if (tasksToCreate.length === 0) {
            toast({
                variant: "destructive",
                title: "No tasks selected",
                description: "Please select at least one task to create.",
            });
            return;
        }

        startTransition(async () => {
            try {
                const createdTasks: Task[] = [];

                for (const extractedTask of tasksToCreate) {
                    const taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'> = {
                        name: extractedTask.name,
                        energyLevel: extractedTask.energyLevel as EnergyLevel,
                        category: extractedTask.category || 'personal',
                        priority: extractedTask.priority as EisenhowerMatrix,
                        projectId: extractedTask.projectId || undefined,
                        details: extractedTask.details || undefined,
                        deadline: extractedTask.selectedDeadline || undefined,
                        state: 'ready',
                        stateHistory: [],
                    };

                    const newTask = await addTask(firestore, user.uid, taskData);
                    createdTasks.push(newTask);
                }

                await onClientWrite();

                toast({
                    title: '✨ Tasks created!',
                    description: `${createdTasks.length} task(s) have been added to your weekly planner.`,
                });

                onTasksCreated(createdTasks);

                // Reset state
                setBrainDumpText('');
                setExtractedData(null);
                setExtractedTasks([]);
                setCurrentStep(0);
                onOpenChange(false);
            } catch (error) {
                console.error('Failed to create tasks', error);
                toast({
                    variant: 'destructive',
                    title: 'Failed to create tasks',
                    description: 'There was a problem creating your tasks. Please try again.',
                });
            }
        });
    };

    const handleClose = () => {
        if (!isProcessing && !isSubmitting) {
            setBrainDumpText('');
            setExtractedData(null);
            setExtractedTasks([]);
            setCurrentStep(0);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-500" />
                            Brain Dump for Weekly Planning
                        </DialogTitle>
                        <DialogDescription>
                            Dump all your thoughts and let AI organize them into tasks for the week
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Step 0: Brain Dump Input */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">Pour out your thoughts</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Write everything that's on your mind for the week ahead. Don't worry about structure - just write naturally about tasks, projects, ideas, deadlines, or anything you need to remember.
                                    </p>
                                </div>
                            </div>

                            <Textarea
                                placeholder="Example: Need to finish the quarterly report by Wednesday. Should schedule a team meeting this week to discuss the new project. Also need to review those PRs that came in yesterday. Don't forget dentist appointment on Friday afternoon. Want to spend some time learning that new framework..."
                                value={brainDumpText}
                                onChange={(e) => setBrainDumpText(e.target.value)}
                                className="min-h-[300px] resize-none text-base"
                                autoFocus
                            />

                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                                <Brain className="h-4 w-4 flex-shrink-0" />
                                <p>AI will extract tasks, suggest priorities, and help you organize your week</p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Review Extracted Tasks */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">Review & Schedule</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        AI extracted these tasks. Select which ones to add and assign deadlines.
                                    </p>
                                </div>
                            </div>

                            {extractedTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No tasks extracted from your brain dump.</p>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {extractedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`border rounded-lg p-4 space-y-3 transition-colors ${
                                                task.included ? 'bg-background' : 'bg-muted/50 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={task.included}
                                                    onCheckedChange={() => toggleTaskIncluded(task.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={task.name}
                                                        onChange={(e) => updateTaskField(task.id, 'name', e.target.value)}
                                                        className="font-medium"
                                                        disabled={!task.included}
                                                    />

                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="secondary">{task.energyLevel}</Badge>
                                                        <Badge variant="outline">{task.priority}</Badge>
                                                        {task.category && <Badge>{task.category}</Badge>}
                                                    </div>

                                                    {task.details && (
                                                        <p className="text-sm text-muted-foreground">{task.details}</p>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <Select
                                                            value={task.selectedDeadline || ''}
                                                            onValueChange={(value) => updateTaskDeadline(task.id, value)}
                                                            disabled={!task.included}
                                                        >
                                                            <SelectTrigger className="w-[200px]">
                                                                <SelectValue placeholder="Select deadline" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {weekDays.map(day => (
                                                                    <SelectItem key={day.value} value={day.value}>
                                                                        {day.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-4 border-t bg-muted/30 flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isProcessing || isSubmitting}
                    >
                        Cancel
                    </Button>

                    <div className="flex gap-2">
                        {currentStep === 0 && (
                            <Button
                                onClick={handleProcessBrainDump}
                                disabled={!brainDumpText.trim() || isProcessing}
                            >
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isProcessing ? 'Processing...' : 'Extract Tasks'}
                                {!isProcessing && <Sparkles className="ml-2 h-4 w-4" />}
                            </Button>
                        )}

                        {currentStep === 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(0)}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleCreateTasks}
                                    disabled={extractedTasks.filter(t => t.included).length === 0 || isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create {extractedTasks.filter(t => t.included).length} Task(s)
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
