'use client';
import { RecurringTasksClientPage } from "./client-page";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecurringTasksPage() {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-48 w-full" />
               <Skeleton className="h-48 w-full" />
           </div>
        }>
            <RecurringTasksClientPage />
        </React.Suspense>
    );
}
