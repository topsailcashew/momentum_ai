'use client';
import { ProjectClientPage } from "./client-page";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function ProjectsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col gap-4">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        }>
            <ProjectClientPage />
        </React.Suspense>
    )
}
