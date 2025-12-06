"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-950 p-2 text-center text-sm font-medium animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>You're offline. Changes will sync when reconnected.</span>
            </div>
        </div>
    );
}
