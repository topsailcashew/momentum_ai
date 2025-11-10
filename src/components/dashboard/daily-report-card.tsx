'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Clipboard, FileText, Play, Square, Goal, CheckCircle2, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateReportAction } from '@/app/actions';
import type { DailyReport } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface DailyReportCardProps {
  report: DailyReport;
}

export function DailyReportCard({ report: initialReport }: DailyReportCardProps) {
  const [report, setReport] = React.useState(initialReport);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const handleTimeTracking = (action: 'start' | 'end') => {
    startTransition(async () => {
      const now = new Date().toISOString();
      const updates: Partial<DailyReport> = action === 'start' ? { startTime: now } : { endTime: now };
      try {
        const updatedReport = await updateReportAction(updates);
        setReport(updatedReport);
        toast({ title: `Work ${action} time recorded!` });
      } catch (e) {
        toast({ variant: 'destructive', title: `Failed to record ${action} time.` });
      }
    });
  };

  const handleCopyToClipboard = () => {
    if (report.generatedReport) {
      navigator.clipboard.writeText(report.generatedReport);
      toast({ title: 'Report copied to clipboard!' });
    } else {
      // Placeholder for future AI generation
      toast({ title: 'Report generated and copied!' });
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Not set';
    return format(parseISO(time), 'h:mm a');
  };

  return (
    <Card className="bg-secondary/30 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="text-primary" />
          Daily Work Report
        </CardTitle>
        <CardDescription>Log your work hours and generate a summary.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Work Time</h4>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeTracking('start')}
                disabled={isPending || !!report.startTime}
              >
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeTracking('end')}
                disabled={isPending || !report.startTime || !!report.endTime}
              >
                <Square className="mr-2 h-4 w-4" /> End
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Start: {formatTime(report.startTime)}</p>
              <p>End: {formatTime(report.endTime)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Task Summary</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Goal className="size-4 text-amber-500" />
                    <span><span className="font-bold text-foreground">{report.goals}</span> Goals</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span><span className="font-bold text-foreground">{report.completed}</span> Completed</span>
                </div>
                 <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Hourglass className="size-4 text-blue-500" />
                    <span><span className="font-bold text-foreground">{report.inProgress}</span> In Progress</span>
                </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
          <Button size="sm" disabled={isPending}>
            <FileText className="mr-2 h-4 w-4" /> Generate Report
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopyToClipboard} disabled={isPending}>
            <Clipboard className="mr-2 h-4 w-4" /> Copy to Clipboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
