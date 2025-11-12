'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
  Clipboard,
  FileText,
  Play,
  Square,
  Goal,
  CheckCircle2,
  Hourglass,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateReportAction, onClientWrite } from '@/app/actions';
import type { DailyReport, Task } from '@/lib/types';
import { format, isToday, parseISO } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser, useFirestore } from '@/firebase';
import {
  getTasks,
  resetTodaysReport,
  updateTodaysReport,
} from '@/lib/data-firestore';

export function DailyReportCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const {
    todaysReport: initialReport,
    loading: dataLoading,
    tasks,
  } = useDashboardData();
  const userId = user!.uid;

  const [report, setReport] = React.useState<DailyReport | null>(initialReport);
  const [clientFormattedTimes, setClientFormattedTimes] = React.useState({
    startTime: 'Not set',
    endTime: 'Not set',
  });
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();
  const { toast } = useToast();

  const handleReset = React.useCallback(() => {
    if (!firestore) return;
    const previousReport = report;

    // Optimistically update the UI to a fully reset state
    setReport(prev =>
      prev
        ? {
            ...prev,
            startTime: null,
            endTime: null,
            generatedReport: null,
            goals: 0,
            completed: 0,
            inProgress: 0,
          }
        : null
    );
    setClientFormattedTimes({ startTime: 'Not set', endTime: 'Not set' });

    startTransition(async () => {
      try {
        const updatedReport = await resetTodaysReport(firestore, userId);
        setReport(updatedReport); // Sync with the state from the server
        toast({ title: 'Report reset!' });
        await onClientWrite();
      } catch (e) {
        setReport(previousReport); // Revert on error
        toast({ variant: 'destructive', title: 'Failed to reset report.' });
      }
    });
  }, [firestore, report, userId, toast]);

  React.useEffect(() => {
    setReport(initialReport);
    if (initialReport) {
      // Auto-reset if the report is from a previous day
      if (!isToday(parseISO(initialReport.date))) {
        handleReset();
        return;
      }
      setClientFormattedTimes({
        startTime: initialReport.startTime
          ? format(parseISO(initialReport.startTime), 'p')
          : 'Not set',
        endTime: initialReport.endTime
          ? format(parseISO(initialReport.endTime), 'p')
          : 'Not set',
      });
    }
  }, [initialReport, handleReset]);

  const handleTimeTracking = (action: 'start' | 'end') => {
    if (!firestore) return;

    const now = new Date();
    const nowISO = now.toISOString();
    const nowFormatted = format(now, 'p');

    const updates: Partial<DailyReport> =
      action === 'start' ? { startTime: nowISO } : { endTime: nowISO };

    // Optimistic UI update
    const previousReport = report;
    const previousFormattedTimes = clientFormattedTimes;

    setReport(prev => (prev ? { ...prev, ...updates } : null));
    if (action === 'start') {
      setClientFormattedTimes(prev => ({ ...prev, startTime: nowFormatted }));
    } else {
      setClientFormattedTimes(prev => ({ ...prev, endTime: nowFormatted }));
    }

    startTransition(async () => {
      try {
        const updatedReport = await updateTodaysReport(firestore, userId, updates);
        setReport(updatedReport);
        setClientFormattedTimes({
          startTime: updatedReport?.startTime
            ? format(parseISO(updatedReport.startTime), 'p')
            : 'Not set',
          endTime: updatedReport?.endTime
            ? format(parseISO(updatedReport.endTime), 'p')
            : 'Not set',
        });
        toast({ title: `Work ${action} time recorded!` });
        await onClientWrite();
      } catch (e) {
        // Revert on error
        setReport(previousReport);
        setClientFormattedTimes(previousFormattedTimes);
        toast({
          variant: 'destructive',
          title: `Failed to record ${action} time.`,
        });
      }
    });
  };

  const handleGenerateReport = () => {
    if (!report || !firestore || !user) return;

    startGeneratingTransition(async () => {
      try {
        const allTasks = await getTasks(firestore, user.uid);

        const generatedText = await generateReportAction({
          userId: user.uid,
          report: report,
          tasks: allTasks,
        });

        if (generatedText) {
          const updatedReport = await updateTodaysReport(firestore, user.uid, {
            generatedReport: generatedText,
          });
          setReport(updatedReport);
          toast({ title: 'AI summary generated!' });
        } else {
          throw new Error('Generated report text was empty.');
        }
      } catch (error) {
        console.error('Failed to generate report:', error);
        toast({
          variant: 'destructive',
          title: 'Could not generate AI summary.',
        });
      }
    });
  };

  const handleCopyToClipboard = () => {
    if (report?.generatedReport) {
      navigator.clipboard.writeText(report.generatedReport);
      toast({ title: 'Report copied to clipboard!' });
    } else {
      toast({ title: 'Generate a report first to copy it.' });
    }
  };

  if (dataLoading) {
    return (
      <Card className="bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="text-primary" />
            Daily Work Report
          </CardTitle>
          <CardDescription>
            Log your work hours and generate a summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skeletons can go here */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/30 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="text-primary" />
          Daily Work Report
        </CardTitle>
        <CardDescription>
          Log your work hours and generate a summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Work Time</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeTracking('start')}
                disabled={isPending || !!report?.startTime}
                className="flex-1 sm:flex-none"
              >
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeTracking('end')}
                disabled={isPending || !report?.startTime || !!report?.endTime}
                className="flex-1 sm:flex-none"
              >
                <Square className="mr-2 h-4 w-4" /> End
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Start:{' '}
                <span className="font-medium text-foreground">
                  {clientFormattedTimes.startTime}
                </span>
              </p>
              <p>
                End:{' '}
                <span className="font-medium text-foreground">
                  {clientFormattedTimes.endTime}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Task Summary</h4>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-x-4 gap-y-2 text-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-1.5 text-muted-foreground">
                <Goal className="size-4 text-amber-500" />
                <span className="text-xs sm:text-sm">
                  <span className="font-bold text-foreground">
                    {report?.goals ?? 0}
                  </span>{' '}
                  Goals
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-1.5 text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                <span className="text-xs sm:text-sm">
                  <span className="font-bold text-foreground">
                    {report?.completed ?? 0}
                  </span>{' '}
                  Done
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-1.5 text-muted-foreground">
                <Hourglass className="size-4 text-blue-500" />
                <span className="text-xs sm:text-sm">
                  <span className="font-bold text-foreground">
                    {report?.inProgress ?? 0}
                  </span>{' '}
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/10">
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGenerating || !report}
            className="flex-grow sm:flex-grow-0"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyToClipboard}
            disabled={!report?.generatedReport}
            className="flex-grow sm:flex-grow-0"
          >
            <Clipboard className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={isPending}
            className="flex-grow sm:flex-grow-0"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
