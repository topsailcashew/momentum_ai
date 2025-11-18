import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardClientPage } from './client-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reports',
    description: 'View your productivity reports and analytics',
};

export default function DashboardPage() {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col gap-6">
                <Skeleton className="h-36" />
                <Skeleton className="h-96" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        }>
            <DashboardClientPage />
        </React.Suspense>
    );
}
