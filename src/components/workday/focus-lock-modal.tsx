import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface FocusLockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTaskName: string;
    onStayFocused: () => void;
    onForceSwitch: () => void;
}

export function FocusLockModal({
    open,
    onOpenChange,
    currentTaskName,
    onStayFocused,
    onForceSwitch,
}: FocusLockModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <AlertCircle className="h-6 w-6" />
                        <DialogTitle>Active Task in Progress</DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        Please complete your current task:
                        <br />
                        <span className="font-semibold text-foreground block mt-1">"{currentTaskName}"</span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    {/* Primary action is to stay focused, so it gets the default variant */}
                    <Button variant="default" onClick={onStayFocused} className="flex-1 sm:flex-none">
                        Stay Focused
                    </Button>
                    <Button variant="outline" onClick={onForceSwitch} className="flex-1 sm:flex-none">
                        Force Switch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
