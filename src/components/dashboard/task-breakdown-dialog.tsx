'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Plus, X, GripVertical } from 'lucide-react';
import type { Task, EnergyLevel } from '@/lib/types';
import { suggestTaskBreakdown } from '@/ai/flows/suggest-task-breakdown';
import { toast } from '@/hooks/use-toast';

interface SubtaskSuggestion {
  name: string;
  details?: string;
  estimatedEnergy: EnergyLevel;
  order: number;
}

interface TaskBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onCreateSubtasks: (subtasks: Omit<Task, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt'>[]) => Promise<void>;
}

export function TaskBreakdownDialog({
  open,
  onOpenChange,
  task,
  onCreateSubtasks,
}: TaskBreakdownDialogProps) {
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SubtaskSuggestion[]>([]);
  const [reasoning, setReasoning] = React.useState('');
  const [subtasks, setSubtasks] = React.useState<SubtaskSuggestion[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Load AI suggestions when dialog opens
  React.useEffect(() => {
    if (open && suggestions.length === 0 && !isLoadingSuggestions) {
      loadSuggestions();
    }
  }, [open]);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const result = await suggestTaskBreakdown({
        taskName: task.name,
        taskDetails: task.details,
        projectContext: undefined, // Could add project info here
      });

      setSuggestions(result.subtasks);
      setSubtasks(result.subtasks);
      setReasoning(result.reasoning);
    } catch (error) {
      console.error('Failed to get task breakdown suggestions:', error);
      toast({
        title: 'Failed to generate suggestions',
        description: 'You can still add subtasks manually',
        variant: 'destructive',
      });
      // Add one empty subtask for manual entry
      setSubtasks([{
        name: '',
        details: '',
        estimatedEnergy: 'Medium',
        order: 1,
      }]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, {
      name: '',
      details: '',
      estimatedEnergy: 'Medium',
      order: subtasks.length + 1,
    }]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, updates: Partial<SubtaskSuggestion>) => {
    setSubtasks(subtasks.map((st, i) =>
      i === index ? { ...st, ...updates } : st
    ));
  };

  const handleSave = async () => {
    const validSubtasks = subtasks.filter(st => st.name.trim() !== '');

    if (validSubtasks.length === 0) {
      toast({
        title: 'No subtasks to create',
        description: 'Add at least one subtask',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const subtasksToCreate = validSubtasks.map((st, index) => ({
        name: st.name,
        details: st.details,
        energyLevel: st.estimatedEnergy,
        priority: task.priority,
        projectId: task.projectId,
        ministryId: task.ministryId,
        parentTaskId: task.id,
        isSubtask: true,
        subtaskOrder: index + 1,
        state: 'ready' as const,
        stateHistory: [],
        focusSessions: [],
        autoCalculatedPriority: 50, // Will be recalculated
      }));

      await onCreateSubtasks(subtasksToCreate);

      toast({
        title: 'Subtasks created',
        description: `Created ${validSubtasks.length} subtasks`,
      });

      onOpenChange(false);

      // Reset state
      setSuggestions([]);
      setSubtasks([]);
      setReasoning('');
    } catch (error) {
      console.error('Failed to create subtasks:', error);
      toast({
        title: 'Failed to create subtasks',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Break Down Task
          </DialogTitle>
          <DialogDescription>
            Break "{task.name}" into smaller, manageable subtasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Reasoning */}
          {reasoning && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>AI Suggestion:</strong> {reasoning}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingSuggestions && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Generating suggestions...</span>
            </div>
          )}

          {/* Subtasks List */}
          {!isLoadingSuggestions && subtasks.length > 0 && (
            <div className="space-y-3">
              {subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      {/* Subtask Name */}
                      <div>
                        <Label htmlFor={`subtask-name-${index}`}>
                          Subtask {index + 1}
                        </Label>
                        <Input
                          id={`subtask-name-${index}`}
                          value={subtask.name}
                          onChange={(e) => updateSubtask(index, { name: e.target.value })}
                          placeholder="Subtask name"
                        />
                      </div>

                      {/* Subtask Details */}
                      <div>
                        <Label htmlFor={`subtask-details-${index}`}>
                          Details (optional)
                        </Label>
                        <Textarea
                          id={`subtask-details-${index}`}
                          value={subtask.details || ''}
                          onChange={(e) => updateSubtask(index, { details: e.target.value })}
                          placeholder="What does this subtask involve?"
                          rows={2}
                        />
                      </div>

                      {/* Energy Level */}
                      <div className="flex items-center gap-2">
                        <Label>Energy:</Label>
                        <div className="flex gap-1">
                          {(['Low', 'Medium', 'High'] as const).map((level) => (
                            <Badge
                              key={level}
                              variant={subtask.estimatedEnergy === level ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => updateSubtask(index, { estimatedEnergy: level })}
                            >
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Button */}
          {!isLoadingSuggestions && (
            <Button
              variant="outline"
              onClick={addSubtask}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Subtask
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoadingSuggestions}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Subtasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
