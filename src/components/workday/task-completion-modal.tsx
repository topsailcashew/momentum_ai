import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatTime } from '@/lib/utils';
import Confetti from 'react-confetti';
// import { useWindowSize } from 'react-use'; // Use react-use if available, otherwise just window.innerWidth

// Minimal window size hook if react-use is not available or we want to keep deps low
function useWindowSizeCustom() {
    const [size, setSize] = React.useState({ width: 0, height: 0 });
    React.useLayoutEffect(() => {
        function updateSize() {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

interface TaskCompletionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskName: string;
    timeSpentMs?: number;
    onSaveNotes: (notes: string) => void;
    onSkip: () => void;
}

export function TaskCompletionModal({
    open,
    onOpenChange,
    taskName,
    timeSpentMs,
    onSaveNotes,
    onSkip,
}: TaskCompletionModalProps) {
    const [notes, setNotes] = React.useState('');
    const { width, height } = useWindowSizeCustom();
    const [showConfetti, setShowConfetti] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (open) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 4000); // Stop confetti after 4s
            return () => clearTimeout(timer);
        } else {
            setShowConfetti(false);
            setNotes('');
        }
    }, [open]);

    return (
        <>
            {/* Temporarily disabled to test hydration
            <div suppressHydrationWarning>
                {isMounted && showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} />}
            </div>
            */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            🎉 Task Completed!
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2 space-y-2">
                            <span className="font-semibold block text-foreground">"{taskName}"</span>
                            {timeSpentMs !== undefined && timeSpentMs > 0 && (
                                <span className="block text-sm text-muted-foreground">
                                    Time Focused: {formatTime(timeSpentMs)}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label htmlFor="completion-notes" className="text-sm font-medium mb-1.5 block">
                            Notes (optional)
                        </label>
                        <Textarea
                            id="completion-notes"
                            placeholder="What did you learn? Any blockers overcome?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={onSkip}>
                            Skip
                        </Button>
                        <Button onClick={() => onSaveNotes(notes)}>
                            Save Notes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
