'use client';

import * as React from 'react';
import { useTransition } from 'react';
import {
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
  resetTodaysReport as resetTodaysReportInDb,
  updateTodaysReport as updateTodaysReportInDb,
} from '@/lib/data-firestore';
import { generateReportAction } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';

export function DailyReportCard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const {
    todaysReport,
    setTodaysReport,
    loading: dataLoading,
  } = useDashboardData();
  const userId = user!.uid;

  const [clientFormattedTimes, setClientFormattedTimes] = React.useState({
    startTime: 'Not set',
    endTime: 'Not set',
  });
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();
  const { toast } = useToast();

  const handleReset = React.useCallback(() => {
    if (!firestore) return;
    const previousReport = todaysReport;

    // Optimistically update the UI
    const resetState: DailyReport = {
      ...todaysReport!,
      startTime: null,
      endTime: null,
      generatedReport: null,
    };
    setTodaysReport(resetState);

    startTransition(async () => {
      try {
        const updatedReport = await resetTodaysReportInDb(firestore, userId);
        setTodaysReport(updatedReport); // Sync with the state from the server
        toast({ title: 'Report reset!' });
      } catch (e) {
        setTodaysReport(previousReport); // Revert on error
        toast({ variant: 'destructive', title: 'Failed to reset report.' });
      }
    });
  }, [firestore, todaysReport, userId, toast, setTodaysReport]);

  React.useEffect(() => {
    if (todaysReport) {
      if (!isToday(parseISO(todaysReport.date))) {
        handleReset();
        return;
      }
      setClientFormattedTimes({
        startTime: todaysReport.startTime
          ? format(parseISO(todaysReport.startTime), 'p')
          : 'Not set',
        endTime: todaysReport.endTime
          ? format(parseISO(todaysReport.endTime), 'p')
          : 'Not set',
      });
    }
  }, [todaysReport, handleReset]);

  const handleTimeTracking = (action: 'start' | 'end') => {
    if (!firestore) return;

    const now = new Date();
    const nowISO = now.toISOString();

    const updates: Partial<DailyReport> =
      action === 'start' ? { startTime: nowISO } : { endTime: nowISO };

    // Optimistic UI update
    const previousReport = todaysReport;
    setTodaysReport(prev => (prev ? { ...prev, ...updates } : null));

    startTransition(async () => {
      try {
        const updatedReport = await updateTodaysReportInDb(firestore, userId, updates);
        setTodaysReport(updatedReport);
        toast({ title: `Work ${action} time recorded!` });
      } catch (e) {
        setTodaysReport(previousReport);
        toast({
          variant: 'destructive',
          title: `Failed to record ${action} time.`,
        });
      }
    });
  };

  const handleGenerateReport = () => {
    if (!todaysReport || !firestore || !user) return;

    startGeneratingTransition(async () => {
      try {
        const allTasks = await getTasks(firestore, user.uid);
        const generatedText = await generateReportAction({
          userId: user.uid,
          report: todaysReport,
          tasks: allTasks,
        });

        if (generatedText) {
          const updatedReport = await updateTodaysReportInDb(firestore, user.uid, {
            generatedReport: generatedText,
          });
          setTodaysReport(updatedReport);
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
                            disabled={isPending || !!todaysReport?.startTime}
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
                                disabled={isPending || !todaysReport?.startTime || !!todaysReport?.endTime}
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
                    {todaysReport?.goals ?? 0}
                </span>
            </div>
             <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50">
                <CheckCircle2 className="size-5 text-green-500" />
                <span className="text-sm">Done</span>
                 <span className="font-bold text-xl text-foreground">
                    {todaysReport?.completed ?? 0}
                </span>
            </div>
             <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50">
                <Hourglass className="size-5 text-blue-500" />
                <span className="text-sm">Active</span>
                 <span className="font-bold text-xl text-foreground">
                    {todaysReport?.inProgress ?? 0}
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
                  disabled={isGenerating || !todaysReport}
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
