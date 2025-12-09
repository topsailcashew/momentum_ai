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
import { addWorkdayTask } from '@/lib/data-firestore';
import { Loader2, Sun, Calendar, ListTodo, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, RecurringTask } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

export function MorningPlanModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { tasks, recurringTasks } = useDashboardData();
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
    const [intention, setIntention] = React.useState('');
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

    const handleSubmit = () => {
        if (!user || !firestore) return;

        startTransition(async () => {
            try {
                const today = format(new Date(), 'yyyy-MM-dd');

                // 1. Add selected tasks to workday
                const promises = Array.from(selectedTaskIds).map(taskId => {
                    // Determine type
                    const isRecurring = recurringTasks.some(rt => rt.id === taskId);
                    return addWorkdayTask(firestore, user.uid, taskId, isRecurring ? 'recurring' : 'regular', today);
                });

                await Promise.all(promises);

                // 2. Save daily intention if provided
                if (intention.trim()) {
                    // We could save this to the daily report or a specific 'intentions' collection
                    // For now let's just save it to a 'daily-intentions' collection for simple tracking
                    // Or update the daily report
                    const reportRef = doc(firestore, `users/${user.uid}/reports/${today}`);
                    await setDoc(reportRef, { dailyGoalsText: intention }, { merge: true });
                }

                // 3. Mark morning planning as done for today
                const prefsRef = doc(firestore, `users/${user.uid}/preferences/settings`);
                await setDoc(prefsRef, { lastMorningPlanDate: today }, { merge: true });

                toast({
                    title: "Good morning! ☀️",
                    description: "Your workday has been planned. Let's make it a great one!",
                });

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
        const incomplete = tasks.filter(t => !t.completed).slice(0, 5); // Top 5 pending
        return incomplete;
    }, [tasks]);

    const suggestedRecurring = React.useMemo(() => {
        return recurringTasks.slice(0, 5); // Just first 5 for now
    }, [recurringTasks]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-2 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sun className="h-5 w-5 text-orange-500" />
                            Good Morning!
                        </DialogTitle>
                        <DialogDescription>
                            Let's take a moment to plan your day intentionally.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Step 1: Intention */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-medium text-primary">
                            <Target className="h-4 w-4" />
                            <span>Step 1: Set your intention</span>
                        </div>
                        <Label htmlFor="intention" className="sr-only">Daily Intention</Label>
                        <Textarea
                            id="intention"
                            placeholder="What is your main focus or goal for today?"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Step 2: Select Tasks */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-medium text-primary">
                            <ListTodo className="h-4 w-4" />
                            <span>Step 2: Choose your focus tasks</span>
                        </div>

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
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-muted/10">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip for now</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start My Day
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
