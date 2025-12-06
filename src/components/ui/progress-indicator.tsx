"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

export function IndeterminateProgress({ status }: { status: string }) {
    return (
        <div className="space-y-2">
            <Progress value={undefined} className="w-full animate-pulse" /> {/* Indeterminate effect via pulse/undefined support if implemented, otherwise just bar */}
            <p className="text-sm text-muted-foreground">{status}</p>
        </div>
    );
}

export function DeterminateProgress({
    current,
    total,
    label
}: {
    current: number;
    total: number;
    label: string;
}) {
    const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
    return (
        <div className="space-y-2">
            <Progress value={percentage} className="w-full" />
            <p className="text-sm text-muted-foreground">
                {label}: {current} of {total}
            </p>
        </div>
    );
}
