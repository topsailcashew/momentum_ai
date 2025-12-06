
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function WelcomeDialog() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen welcome (localStorage for MVP)
        if (typeof window !== "undefined") {
            const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
            if (!hasSeenWelcome) {
                setOpen(true);
            }
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem("hasSeenWelcome", "true");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleComplete(); // Close implies seen
        }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">Welcome to Pace Pilot</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Your personal productivity companion for managing tasks, projects, and life's messages.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 text-sm text-muted-foreground">
                    <p>Here's what you can do:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Manage your daily tasks and recurring routines</li>
                        <li>Organize specialized projects and ministries</li>
                        <li>Track your energy and focus with Pomodoro timers</li>
                        <li>Reflect on life messages and personal growth</li>
                    </ul>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleComplete} className="w-full sm:w-auto min-w-[120px]">
                        Get Started
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
