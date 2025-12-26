'use client';

import * as React from 'react';
import { CurrentFocus } from '@/components/dashboard/current-focus';
import { FocusModeView } from '@/components/dashboard/focus-mode-view';
import { TaskBreakdownDialog } from '@/components/dashboard/task-breakdown-dialog';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { WorkdayTasksCard } from '@/components/workday/workday-tasks-card';
import { EnergyCheckModal } from '@/components/workday/energy-check-modal';
import { TodayAtAGlance } from '@/components/workday/today-at-a-glance';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useEnergyTracker } from '@/hooks/use-energy-tracker';
import { useFocus } from '@/components/dashboard/focus-provider';
import { useBreakReminder } from '@/hooks/use-break-reminder';
import { MorningPlanModal } from '@/components/workday/morning-plan-modal';
import { useMorningPlan } from '@/hooks/use-morning-plan';
import { getNextRecommendedTask, calculateTaskPriority } from '@/lib/priority-system';
import { addTask, updateTask } from '@/lib/data-firestore';
import { Maximize2 } from 'lucide-react';
import type { Task, EnergyLevel } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export function WorkdayClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const db = useFirestore();
  const { loading: dataLoading, tasks, setTasks } = useDashboardData();
  const {
    focusedTask,
    setFocusedTask,
    isFocusing,
    focusedTimeMs,
    startFocus,
    pauseFocus,
    endFocus,
  } = useFocus();
  const { shouldShow, setShouldShow } = useMorningPlan();
  const {
    currentEnergy,
    updateEnergy,
    shouldShowEnergyCheck,
    requestEnergyCheck,
    dismissEnergyCheck,
  } = useEnergyTracker();

  // UI State
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [showBreakdownDialog, setShowBreakdownDialog] = React.useState(false);

  // Get incomplete tasks for energy-based suggestions
  const availableTasks = React.useMemo(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  // Get subtasks for focused task
  const focusedTaskSubtasks = React.useMemo(() => {
    if (!focusedTask) return [];
    return tasks.filter(t => t.parentTaskId === focusedTask.id);
  }, [focusedTask, tasks]);

  // Calculate priorities for all tasks
  React.useEffect(() => {
    if (tasks.length === 0 || !db || !user) return;

    // Update priorities for tasks that don't have them or need recalculation
    const tasksNeedingUpdate = tasks.filter(task =>
      !task.completed && (
        task.autoCalculatedPriority === undefined ||
        task.autoCalculatedPriority === 0
      )
    );

    if (tasksNeedingUpdate.length > 0) {
      tasksNeedingUpdate.forEach(async (task) => {
        const priority = calculateTaskPriority(task, currentEnergy, tasks);
        await updateTask(db, user.uid, task.id, { autoCalculatedPriority: priority });
      });
    }
  }, [tasks, currentEnergy, db, user]);

  // Break reminder integration
  useBreakReminder({
    isFocusing,
    enabled: true,
    reminderIntervalMs: 90 * 60 * 1000, // 90 minutes
    onBreakAcknowledged: () => {
      pauseFocus();
      toast({
        title: 'Break time!',
        description: 'Taking a break helps you stay productive',
      });
    },
  });

  // Handle energy selection
  const handleEnergySelected = React.useCallback((energy: EnergyLevel, selectedTask?: Task) => {
    updateEnergy(energy);
    if (selectedTask) {
      setFocusedTask(selectedTask);
    }
    dismissEnergyCheck();
  }, [updateEnergy, setFocusedTask, dismissEnergyCheck]);

  // Handle task completion
  const handleCompleteTask = React.useCallback(async () => {
    if (!focusedTask || !db || !user) return;

    try {
      // End focus session
      const session = endFocus();

      // Update task
      await updateTask(db, user.uid, focusedTask.id, {
        completed: true,
        completedAt: new Date().toISOString(),
        focusSessions: session ? [...(focusedTask.focusSessions || []), session] : focusedTask.focusSessions,
        focusedTimeMs: (focusedTask.focusedTimeMs || 0) + focusedTimeMs,
      });

      toast({
        title: '✅ Task completed!',
        description: focusedTask.name,
      });

      // Select next task
      handleSelectNextTask();
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast({
        title: 'Failed to complete task',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [focusedTask, db, user, endFocus, focusedTimeMs]);

  // Handle select next task
  const handleSelectNextTask = React.useCallback(() => {
    const nextTask = getNextRecommendedTask(availableTasks, currentEnergy);
    if (nextTask) {
      setFocusedTask(nextTask);
      toast({
        title: 'Next task selected',
        description: nextTask.name,
      });
    } else {
      setFocusedTask(null);
      toast({
        title: 'No more tasks',
        description: 'Great job! All tasks completed.',
      });
    }
  }, [availableTasks, currentEnergy, setFocusedTask]);

  // Handle create subtasks
  const handleCreateSubtasks = React.useCallback(async (
    subtasksData: Omit<Task, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt'>[]
  ) => {
    if (!db || !user || !focusedTask) return;

    try {
      const createdSubtasks: Task[] = [];

      for (const subtaskData of subtasksData) {
        const newSubtask = await addTask(db, user.uid, subtaskData);
        createdSubtasks.push(newSubtask);
      }

      // Update parent task with subtask IDs
      await updateTask(db, user.uid, focusedTask.id, {
        subtaskIds: createdSubtasks.map(st => st.id),
      });

      // Update local state
      setTasks([...tasks, ...createdSubtasks]);

      toast({
        title: 'Subtasks created',
        description: `Created ${createdSubtasks.length} subtasks`,
      });
    } catch (error) {
      console.error('Failed to create subtasks:', error);
      throw error;
    }
  }, [db, user, focusedTask, tasks, setTasks]);

  // Keyboard shortcut for focus mode (ESC to exit)
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFocusMode) {
        setShowFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showFocusMode]);

  if (userLoading || dataLoading || !user) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Top Row: Current Focus + Today at a Glance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="relative">
            <CurrentFocus
              focusedTask={focusedTask}
              subtasks={focusedTaskSubtasks}
              onStartFocus={startFocus}
              onPauseFocus={pauseFocus}
              onCompleteTask={handleCompleteTask}
              onSelectNextTask={handleSelectNextTask}
              onBreakdownTask={() => setShowBreakdownDialog(true)}
              isFocusing={isFocusing}
              focusedTimeMs={focusedTimeMs}
            />
            {/* Focus Mode Button */}
            {focusedTask && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setShowFocusMode(true)}
                title="Enter Focus Mode (hide distractions)"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <TodayAtAGlance
            currentEnergy={currentEnergy}
            onEnergyChange={updateEnergy}
          />
        </div>

        {/* Main Content: Workday Tasks (70%) | Projects Overview (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-7">
            <WorkdayTasksCard onTaskCompleted={requestEnergyCheck} />
          </div>
          <div className="lg:col-span-3">
            <ProjectOverview />
          </div>
        </div>

        <MorningPlanModal open={shouldShow} onOpenChange={setShouldShow} />

        <EnergyCheckModal
          open={shouldShowEnergyCheck}
          onOpenChange={dismissEnergyCheck}
          onEnergySelected={handleEnergySelected}
          availableTasks={availableTasks}
        />
      </div>

      {/* Focus Mode Overlay */}
      {showFocusMode && focusedTask && (
        <FocusModeView
          focusedTask={focusedTask}
          subtasks={focusedTaskSubtasks}
          isFocusing={isFocusing}
          focusedTimeMs={focusedTimeMs}
          onStartFocus={startFocus}
          onPauseFocus={pauseFocus}
          onCompleteTask={handleCompleteTask}
          onExitFocusMode={() => setShowFocusMode(false)}
        />
      )}

      {/* Task Breakdown Dialog */}
      {focusedTask && (
        <TaskBreakdownDialog
          open={showBreakdownDialog}
          onOpenChange={setShowBreakdownDialog}
          task={focusedTask}
          onCreateSubtasks={handleCreateSubtasks}
        />
      )}
    </>
  );
}
