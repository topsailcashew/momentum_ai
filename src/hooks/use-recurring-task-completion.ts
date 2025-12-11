/**
 * @fileOverview Custom hook for handling recurring task completion
 * Centralizes duplicate logic from workday-tasks-card and recurring/client-page
 */

import { useTransition } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from './use-toast';
import { updateRecurringTask, calculateAndSaveMomentumScore } from '@/lib/data-firestore';
import { onClientWrite, onTaskCompleted } from '@/app/actions';
import type { RecurringTask } from '@/lib/types';

interface UseRecurringTaskCompletionOptions {
  onOptimisticUpdate: (taskId: string, lastCompleted: string | null) => void;
  onRevert: () => void;
  onSuccess?: () => void;
  calculateMomentumScore?: boolean;
}

export function useRecurringTaskCompletion(options: UseRecurringTaskCompletionOptions) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    onOptimisticUpdate,
    onRevert,
    onSuccess,
    calculateMomentumScore = true,
  } = options;

  const completeRecurringTask = (taskId: string, completed: boolean) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated. Please log in again.',
      });
      return;
    }

    const userId = user.uid;
    const newLastCompleted = completed ? new Date().toISOString() : null;

    // Optimistically update the UI
    onOptimisticUpdate(taskId, newLastCompleted);

    startTransition(async () => {
      try {
        // Update the recurring task
        await updateRecurringTask(firestore, userId, taskId, {
          lastCompleted: newLastCompleted
        });

        // Perform additional actions based on completion state
        if (completed) {
          // Calculate momentum score - wrap in try-catch to not block task completion
          if (calculateMomentumScore) {
            try {
              await calculateAndSaveMomentumScore(firestore, userId);
            } catch (momentumError) {
              console.error('Failed to calculate momentum score:', momentumError);
              // Don't throw - momentum score is non-critical
            }
          }
          await onTaskCompleted(userId);
        } else {
          await onClientWrite();
        }

        // Show success toast
        if (completed) {
          toast({ title: 'Task marked as complete!' });
        }

        // Call optional success callback
        onSuccess?.();
      } catch (error) {
        // Show error toast
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem updating the task. Reverting changes.',
        });

        // Revert optimistic update
        onRevert();
      }
    });
  };

  return {
    completeRecurringTask,
    isPending,
  };
}
