
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
import { onClientWrite } from '@/app/actions';
import type { DailyReport } from '@/lib/types';
import { format, isToday, parseISO } from 'date-fns';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser, useFirestore } from '@/firebase';
import {
  getTasks,
  resetTodaysReport,
  updateTodaysReport,
} from '@/lib/data-firestore';
import { generateReportAction } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

export function DailyReportCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const {
    todaysReport: initialReport,
    loading: dataLoading,
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
    <Card className="bg-secondary/30 border-primary/20 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="text-primary" />
          Daily Work Report
        </CardTitle>
        <CardDescription>
          Log your work hours and generate a summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col">
        <TooltipProvider>
            <div className='space-y-3'>
                 <div className="flex items-center justify-between">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTimeTracking('start')}
                            disabled={isPending || !!report?.startTime}
                            className="w-24 justify-start"
                            >
                            <Play className="mr-2 h-4 w-4" /> Start
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Log the beginning of your workday.</p>
                        </TooltipContent>
                    </Tooltip>
                    <span className="text-sm font-medium text-foreground">{clientFormattedTimes.startTime}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTimeTracking('end')}
                                disabled={isPending || !report?.startTime || !!report?.endTime}
                                className="w-24 justify-start"
                            >
                                <Square className="mr-2 h-4 w-4" /> End
                            </Button>
                        </TooltipTrigger>
                         <TooltipContent>
                            <p>Log the end of your workday.</p>
                        </TooltipContent>
                    </Tooltip>
                     <span className="text-sm font-medium text-foreground">{clientFormattedTimes.endTime}</span>
                 </div>
            </div>
        </TooltipProvider>

        <Separator className="my-4" />
        
        <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50">
                <Goal className="size-5 text-amber-500" />
                <span className="text-sm">Goals</span>
                <span className="font-bold text-xl text-foreground">
                    {report?.goals ?? 0}
                </span>
            </div>
             <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50">
                <CheckCircle2 className="size-5 text-green-500" />
                <span className="text-sm">Done</span>
                 <span className="font-bold text-xl text-foreground">
                    {report?.completed ?? 0}
                </span>
            </div>
             <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50">
                <Hourglass className="size-5 text-blue-500" />
                <span className="text-sm">Active</span>
                 <span className="font-bold text-xl text-foreground">
                    {report?.inProgress ?? 0}
                </span>
            </div>
        </div>

        <div className="flex-grow" />

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !report}
                  className="flex-grow"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to generate a work summary for the day.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleReset}
                        disabled={isPending}
                        className="h-9 w-9"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reset report for the day</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

    