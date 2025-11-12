
'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardClientPage } from './client-page';

export default function DashboardPage() {
    // Auth check is now handled by AppLayout, so we can remove it from here.
    return (
        <React.Suspense fallback={
            <div className="flex flex-col gap-4">
                <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
                </div>
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-64" />
            </div>
        }>
            <DashboardClientPage />
        </React.Suspense>
    );
}
