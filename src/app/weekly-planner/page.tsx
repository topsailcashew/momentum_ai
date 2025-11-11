'use client';
import { WeeklyPlannerClientPage } from "./client-page";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeeklyPlannerPage() {
    return (
        <React.Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <WeeklyPlannerClientPage />
        </React.Suspense>
    );
}
