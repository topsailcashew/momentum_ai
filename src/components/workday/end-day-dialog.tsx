'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { updateTodaysReport } from '@/lib/data-firestore';
import { useToast } from '@/hooks/use-toast';
import { onClientWrite } from '@/app/actions';
import { generateEndOfDayReport } from '@/ai/flows/generate-end-of-day-report';
import { CheckCircle2, Circle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function EndDayDialog({
  open,
  onOpenChange,
  workdayTasks,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workdayTasks: Array<Task & { workdayTaskId: string; workdayNotes: string | null }>;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const completedTasks = workdayTasks.filter(t => t.completed);
  const incompleteTasks = workdayTasks.filter(t => !t.completed);

  const handleNoteChange = (taskId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [taskId]: note,
    }));
  };

  const handleGenerateReport = () => {
    startTransition(async () => {
      try {
        // Prepare task data with notes
        const completedWithNotes = completedTasks.map(t => ({
          taskId: t.id,
          taskName: t.name,
          category: t.category ?? 'personal',
          energyLevel: t.energyLevel ?? 'Medium',
          notes: notes[t.id] || 'No notes provided',
          completedAt: t.completedAt ?? undefined,
          deadline: t.deadline ?? undefined,
        }));

        const incompleteWithNotes = incompleteTasks.map(t => ({
          taskId: t.id,
          taskName: t.name,
          category: t.category ?? 'personal',
          energyLevel: t.energyLevel ?? 'Medium',
          notes: notes[t.id] || 'No notes provided',
          deadline: t.deadline ?? undefined,
        }));

        // Generate AI report
        const reportResult = await generateEndOfDayReport({
          completedTasks: completedWithNotes,
          incompleteTasks: incompleteWithNotes,
        });

        // Save report to Firestore
        await updateTodaysReport(firestore, user!.uid, {
          generatedReport: reportResult.report,
          taskNotes: notes,
          completedTaskIds: completedTasks.map(t => t.id),
          incompletedTaskIds: incompleteTasks.map(t => t.id),
          goals: workdayTasks.length,
          completed: completedTasks.length,
          endTime: new Date().toISOString(),
        });

        toast({
          title: 'Day completed!',
          description: 'Your daily report has been generated.',
        });

        await onClientWrite();
        onComplete();
        onOpenChange(false);
        setNotes({});
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'There was a problem generating your report.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>End Your Workday</DialogTitle>
          <DialogDescription>
            Optionally add notes to get a more detailed AI report
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Completed Tasks ({completedTasks.length})</h3>
                </div>
                {completedTasks.map(task => (
                  <div key={task.id} className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.energyLevel} Energy
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`notes-${task.id}`} className="text-xs text-muted-foreground">
                        Notes (optional)
                      </Label>
                      <Textarea
                        id={`notes-${task.id}`}
                        placeholder="What did you accomplish? Any learnings or blockers?"
                        value={notes[task.id] || ''}
                        onChange={(e) => handleNoteChange(task.id, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <>
                {completedTasks.length > 0 && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Circle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold">Incomplete Tasks ({incompleteTasks.length})</h3>
                  </div>
                  {incompleteTasks.map(task => (
                    <div key={task.id} className="space-y-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{task.name}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {task.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.energyLevel} Energy
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`notes-${task.id}`} className="text-xs text-muted-foreground">
                          Notes (optional)
                        </Label>
                        <Textarea
                          id={`notes-${task.id}`}
                          placeholder="Why wasn't this completed? Will you tackle it tomorrow?"
                          value={notes[task.id] || ''}
                          onChange={(e) => handleNoteChange(task.id, e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {workdayTasks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No tasks to review
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {completedTasks.length} of {workdayTasks.length} tasks completed
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setNotes({});
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={isPending || workdayTasks.length === 0}
              >
                {isPending ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
