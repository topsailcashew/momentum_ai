'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addStrategicGoal, updateStrategicGoal } from '@/lib/data-firestore';
import type { Ministry, StrategicPlan, StrategicGoal } from '@/lib/types';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry;
  strategicPlan: StrategicPlan;
  goal?: StrategicGoal;
  onSuccess?: () => void;
}

export function GoalDialog({ open, onOpenChange, ministry, strategicPlan, goal, onSuccess }: GoalDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [targetDate, setTargetDate] = React.useState('');
  const [status, setStatus] = React.useState<'not-started' | 'in-progress' | 'completed' | 'on-hold'>('not-started');
  const [priority, setPriority] = React.useState<'high' | 'medium' | 'low'>('medium');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTargetDate(goal.targetDate || '');
      setStatus(goal.status);
      setPriority(goal.priority);
      setProgress(goal.progress);
    } else {
      setTitle('');
      setDescription('');
      setTargetDate('');
      setStatus('not-started');
      setPriority('medium');
      setProgress(0);
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firestore) return;
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Goal title is required.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (goal) {
        await updateStrategicGoal(firestore, user.uid, goal.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
          status,
          priority,
          progress,
        });
        toast({
          title: 'Goal Updated',
          description: 'Your goal has been updated successfully.',
        });
      } else {
        await addStrategicGoal(firestore, user.uid, {
          planId: strategicPlan.id,
          ministryId: ministry.id,
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
          status,
          priority,
          progress,
        });
        toast({
          title: 'Goal Created',
          description: 'Your goal has been created successfully.',
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save goal. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update your strategic goal details.' : 'Add a new strategic goal to track progress.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal Title *</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Increase youth engagement by 30%"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of this goal..."
              rows={3}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                <SelectTrigger id="goal-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="goal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-target-date">Target Date</Label>
            <Input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-progress">Progress: {progress}%</Label>
            <Slider
              id="goal-progress"
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={5}
              className="py-4"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
