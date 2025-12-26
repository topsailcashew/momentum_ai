'use client';

import * as React from 'react';
import { Target, Play, Pause, CheckCircle2, ChevronRight, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority-system';
import { cn } from '@/lib/utils';

interface CurrentFocusProps {
  focusedTask: Task | null;
  subtasks?: Task[];
  onStartFocus: () => void;
  onPauseFocus: () => void;
  onCompleteTask: () => void;
  onSelectNextTask: () => void;
  onBreakdownTask: () => void;
  isFocusing: boolean;
  focusedTimeMs?: number;
}

export function CurrentFocus({
  focusedTask,
  subtasks = [],
  onStartFocus,
  onPauseFocus,
  onCompleteTask,
  onSelectNextTask,
  onBreakdownTask,
  isFocusing,
  focusedTimeMs = 0,
}: CurrentFocusProps) {
  // Calculate subtask progress
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercent = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : 0;

  return (
    <Card className={cn(
      "h-full flex flex-col transition-all duration-300",
      isFocusing && "neon-card"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-lg sm:text-xl flex items-center gap-2",
            isFocusing && "neon-text"
          )}>
            <Target className={cn(
              "h-5 w-5 transition-all",
              isFocusing && "animate-glow-pulse"
            )} />
            Current Focus
          </CardTitle>
          {focusedTask && (
            <Badge
              variant={getPriorityColor(focusedTask.autoCalculatedPriority) as any}
              className="neon-border"
            >
              {getPriorityLabel(focusedTask.autoCalculatedPriority)}
            </Badge>
          )}
        </div>
        <CardDescription className="min-h-[1.25rem] text-xs sm:text-sm">
          {focusedTask
            ? 'Working on your priority task'
            : 'Select a task to begin focused work'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow justify-center gap-4 sm:gap-6">
        {!focusedTask ? (
          // No task selected
          <div className="text-center py-8">
            <Target className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              No task selected
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Choose a task from your priority queue to start focusing
            </p>
          </div>
        ) : (
          <>
            {/* Task Name */}
            <div className="text-center">
              <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 line-clamp-2">
                {focusedTask.name}
              </h3>
              {focusedTask.details && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {focusedTask.details}
                </p>
              )}
            </div>

            {/* Subtask Progress */}
            {totalSubtasks > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ListTodo className="h-4 w-4" />
                    Subtasks
                  </span>
                  <span className="font-medium">
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </div>
                <Progress value={progressPercent} className={cn(
                  "h-2",
                  progressPercent > 0 && "shadow-neon-sm"
                )} />

                {/* Show subtask list */}
                <div className="max-h-32 overflow-y-auto space-y-1 mt-3">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={cn(
                        'flex items-center gap-2 text-sm py-1 px-2 rounded',
                        subtask.completed ? 'text-muted-foreground' : ''
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          subtask.completed ? 'text-green-600' : 'text-muted-foreground/30'
                        )}
                      />
                      <span className={cn(
                        'truncate',
                        subtask.completed && 'line-through'
                      )}>
                        {subtask.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Time Display */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {isFocusing ? 'Focusing for' : 'Total focused time'}
              </p>
              <div className={cn(
                "text-4xl sm:text-5xl font-mono font-bold text-primary transition-all",
                isFocusing && "neon-text"
              )}>
                {formatTime(focusedTimeMs)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                <Button
                  onClick={isFocusing ? onPauseFocus : onStartFocus}
                  size="lg"
                  variant={isFocusing ? 'secondary' : 'default'}
                  className={cn(
                    "flex-1",
                    !isFocusing && "neon-button"
                  )}
                >
                  {isFocusing ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Working
                    </>
                  )}
                </Button>

                <Button
                  onClick={onCompleteTask}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              </div>

              <div className="flex gap-2">
                {totalSubtasks === 0 && (
                  <Button
                    onClick={onBreakdownTask}
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                  >
                    <ListTodo className="mr-2 h-4 w-4" />
                    Break Down Task
                  </Button>
                )}

                <Button
                  onClick={onSelectNextTask}
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                >
                  Next Task
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
