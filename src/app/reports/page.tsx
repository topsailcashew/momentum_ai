'use client';
import { ReportsClientPage } from "./client-page";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
    return (
        <React.Suspense fallback={
            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="md:col-span-2">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        }>
            <ReportsClientPage />
        </React.Suspense>
    );
}
