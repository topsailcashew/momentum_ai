'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTransition } from 'react';
import { Wand2, Loader2, ServerCrash } from 'lucide-react';
import { getFlowAlignmentReport } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReportData {
  visualizationUri: string;
  report: string;
}

export function FlowVisualizer() {
  const [isPending, startTransition] = useTransition();
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateReport = () => {
    startTransition(async () => {
      setError(null);
      setReportData(null);
      try {
        const result = await getFlowAlignmentReport();
        if (result.visualizationUri && result.report) {
            setReportData(result);
        } else {
            setError('The generated report was incomplete. Please try again.');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to generate the report. Please try again later.');
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Alignment Report</CardTitle>
          <CardDescription>Generate your personalized flow report.</CardDescription>
        </div>
        <Button onClick={handleGenerateReport} disabled={isPending}>
          {isPending ? (
            <React.Fragment>
              <Loader2 className="animate-spin" />
              Generating...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Wand2 />
              Generate Report
            </React.Fragment>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="min-h-[400px] flex items-center justify-center rounded-lg border-2 border-dashed bg-secondary/50 p-4">
          {isPending && (
            <div className="text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>AI is analyzing your data... this may take a moment.</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-md">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isPending && !reportData && !error && (
             <div className="text-center text-muted-foreground">
                <p>Your alignment report will appear here.</p>
            </div>
          )}

          {reportData && (
            <div className="w-full space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Alignment Visualization</h3>
                     <div className="relative aspect-video w-full">
                        <Image
                            src={reportData.visualizationUri}
                            alt="Task-energy alignment visualization"
                            fill
                            className="rounded-md object-contain border bg-white"
                        />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">AI Summary</h3>
                    <div className="p-4 text-sm rounded-lg bg-muted text-muted-foreground whitespace-pre-wrap">
                        {reportData.report}
                    </div>
                </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
