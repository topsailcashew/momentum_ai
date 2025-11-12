'use client';

import { FlowVisualizer } from '@/components/analytics/flow-visualizer';
import { useUser } from '@/firebase';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const { user, loading } = useUser();

  // The main auth check is in AppLayout, but we can still show a skeleton
  // while the user object is resolving for the first time on this page.
  if (loading || !user) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted-foreground">
        Visualize your task-energy alignment over time. The AI will generate a
        chart and a summary report based on your completed tasks and daily
        energy levels.
      </p>
      <FlowVisualizer userId={user.uid} />
    </div>
  );
}
