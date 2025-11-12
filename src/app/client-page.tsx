
'use client';

import * as React from 'react';
import { MomentumCard } from '@/components/dashboard/momentum-card';
import { TaskList } from '@/components/dashboard/task-list';
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { DailyReportCard } from '@/components/dashboard/daily-report-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export function DashboardClientPage() {
  const { user, loading: userLoading } = useUser();
  const { loading: dataLoading } = useDashboardData();

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
      {/* Top Row: Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <MomentumCard />
        <Pomodoro />
      </div>

      {/* Main Content: Task List */}
      <div>
        <TaskList />
      </div>

      {/* Bottom Row: Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ProjectOverview />
        <DailyReportCard />
      </div>
    </div>
  );
}
