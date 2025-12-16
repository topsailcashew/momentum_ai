'use client';

import * as React from 'react';
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { WorkdayTasksCard } from '@/components/workday/workday-tasks-card';
import { EnergyCheckModal } from '@/components/workday/energy-check-modal';
import { TodayAtAGlance } from '@/components/workday/today-at-a-glance';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useEnergyTracker } from '@/hooks/use-energy-tracker';
import { PomodoroContext } from '@/components/dashboard/pomodoro-provider';
import { MorningPlanModal } from '@/components/workday/morning-plan-modal';
import { useMorningPlan } from '@/hooks/use-morning-plan';
import type { Task, EnergyLevel } from '@/lib/types';

export function WorkdayClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const { loading: dataLoading, tasks } = useDashboardData();
  const { isTimerActive } = React.useContext(PomodoroContext);
  const { focusedTask, setFocusedTask } = React.useContext(PomodoroContext);
  const { shouldShow, setShouldShow } = useMorningPlan();
  const {
    currentEnergy,
    updateEnergy,
    shouldShowEnergyCheck,
    requestEnergyCheck,
    dismissEnergyCheck,
  } = useEnergyTracker();

  // Get incomplete tasks for energy-based suggestions
  const availableTasks = React.useMemo(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  const handleEnergySelected = React.useCallback((energy: EnergyLevel, selectedTask?: Task) => {
    updateEnergy(energy);
    if (selectedTask) {
      setFocusedTask(selectedTask);
    }
    dismissEnergyCheck();
  }, [updateEnergy, setFocusedTask, dismissEnergyCheck]);

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
    <div className="flex flex-col gap-6">
      {/* Top Row: Pomodoro + Today at a Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Pomodoro />
        <TodayAtAGlance
          currentEnergy={currentEnergy}
          onEnergyChange={updateEnergy}
          isTimerActive={isTimerActive}
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
  );
}
