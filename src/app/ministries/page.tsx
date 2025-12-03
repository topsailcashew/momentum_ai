import { MinistriesClientPage } from "./client-page";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MinistriesPage() {
    return (
        <React.Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        }>
            <MinistriesClientPage />
        </React.Suspense>
    );
}
