'use client';

import * as React from 'react';
import { X, Play, Pause, CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Task } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FocusModeViewProps {
  focusedTask: Task;
  subtasks?: Task[];
  isFocusing: boolean;
  focusedTimeMs: number;
  onStartFocus: () => void;
  onPauseFocus: () => void;
  onCompleteTask: () => void;
  onExitFocusMode: () => void;
}

/**
 * FocusModeView - Minimal, distraction-free view
 * Shows only the current task and essential controls
 * Full screen, centered, with subtle background
 */
export function FocusModeView({
  focusedTask,
  subtasks = [],
  isFocusing,
  focusedTimeMs,
  onStartFocus,
  onPauseFocus,
  onCompleteTask,
  onExitFocusMode,
}: FocusModeViewProps) {
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercent = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Exit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onExitFocusMode}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Centered Content */}
      <div className="w-full max-w-3xl mx-auto text-center space-y-8">
        {/* Focus Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-full blur-xl",
              isFocusing ? "bg-primary/30 animate-pulse" : "bg-muted/30"
            )} />
            <Target className={cn(
              "relative h-20 w-20",
              isFocusing ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
        </div>

        {/* Task Name */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            {focusedTask.name}
          </h1>
          {focusedTask.details && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {focusedTask.details}
            </p>
          )}
        </div>

        {/* Subtask Progress */}
        {totalSubtasks > 0 && (
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />

            {/* Subtask List */}
            <div className="mt-6 space-y-2 text-left">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={cn(
                    'flex items-center gap-3 py-2 px-4 rounded-lg',
                    subtask.completed ? 'bg-muted/30' : 'bg-muted/50'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      subtask.completed ? 'text-green-600' : 'text-muted-foreground/30'
                    )}
                  />
                  <span className={cn(
                    'text-lg',
                    subtask.completed && 'line-through text-muted-foreground'
                  )}>
                    {subtask.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus Time */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-lg">
            {isFocusing ? 'Focused for' : 'Total time'}
          </p>
          <div className="text-8xl md:text-9xl font-mono font-bold text-primary tracking-tight">
            {formatTime(focusedTimeMs)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <Button
            onClick={isFocusing ? onPauseFocus : onStartFocus}
            size="lg"
            variant={isFocusing ? 'secondary' : 'default'}
            className="w-full sm:w-auto text-lg py-6 px-8"
          >
            {isFocusing ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start Working
              </>
            )}
          </Button>

          <Button
            onClick={onCompleteTask}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-lg py-6 px-8"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Complete Task
          </Button>
        </div>

        {/* Subtle hint */}
        <p className="text-sm text-muted-foreground/50">
          Press ESC or click × to exit focus mode
        </p>
      </div>
    </div>
  );
}
