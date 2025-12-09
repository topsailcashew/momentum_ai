// src/hooks/use-task-state.ts
'use client';

import { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { TaskState, StateHistoryEntry } from '@/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from './use-toast';

export function useTaskState() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTaskState = async (
    taskId: string,
    userId: string,
    newState: TaskState,
    note?: string
  ): Promise<void> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update task state',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const taskRef = doc(firestore, `users/${userId}/tasks`, taskId);

      const historyEntry: StateHistoryEntry = {
        state: newState,
        timestamp: serverTimestamp() as any,
        changedBy: user.uid,
        ...(note && { note }),
      };

      await updateDoc(taskRef, {
        state: newState,
        stateHistory: arrayUnion(historyEntry),
      });

      toast({
        title: 'State updated',
        description: `Task moved to ${newState}`,
      });
    } catch (error) {
      console.error('Error updating task state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task state',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateTaskState,
    isUpdating,
  };
}
