'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Download, FileText, Loader2 } from 'lucide-react';
import type { DailyReport } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { getReports, getTasks, updateTodaysReport } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { generateReportAction } from '../actions';
import { MarkdownPreview } from '@/components/markdown-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DateCard } from '@/components/reports/date-card';
import { VisualReportCard } from '@/components/reports/visual-report-card';

export function ReportsClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { loading: dataLoading } = useDashboardData();

  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const { toast } = useToast();

  const fetchReports = React.useCallback(async () => {
    if (user && firestore) {
      setIsFetching(true);
      try {
        const reportsData = await getReports(firestore, user.uid);
        const reportsArray = Object.values(reportsData).sort((a, b) => b.date.localeCompare(a.date));
        setReports(reportsArray);
        if (!selectedReport && reportsArray.length > 0) {
          setSelectedReport(reportsArray[0]);
        } else if (selectedReport) {
          const updatedSelected = reportsArray.find(r => r.date === selectedReport.date);
          setSelectedReport(updatedSelected || reportsArray[0] || null);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({ variant: 'destructive', title: 'Could not load reports.' });
      } finally {
        setIsFetching(false);
      }
    }
  }, [user, firestore, selectedReport, toast]);

  React.useEffect(() => {
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore]);


  const handleCopyToClipboard = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: 'Report copied to clipboard!' });
    }
  };

  const handleExport = (report: DailyReport | null) => {
    if (!report || !report.generatedReport) return;
    const blob = new Blob([report.generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_report_${report.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report exported as .txt!' });
  };

  const handleGenerateReport = () => {
    if (!selectedReport || !user || !firestore) return;

    startGeneratingTransition(async () => {
      try {
        const allTasks = await getTasks(firestore, user.uid);
        
        const generatedText = await generateReportAction({ userId: user.uid, report: selectedReport, tasks: allTasks });
        
        if (generatedText) {
          await updateTodaysReport(firestore, user.uid, { generatedReport: generatedText });
          await fetchReports(); // Refetch all reports to get the updated one
          toast({ title: "AI summary generated!" });
        } else {
            throw new Error("Generated report text was empty.");
        }
      } catch (error) {
        console.error("Failed to generate report:", error);
        toast({ variant: 'destructive', title: 'Could not generate AI summary.' });
      }
    });
  };
  
  if (userLoading || dataLoading || isFetching || !user) {
    return (
         <div className="space-y-6">
            <Skeleton className="h-36 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Reports History</CardTitle>
            <CardDescription>Select a day to view its report.</CardDescription>
        </CardHeader>
        <CardContent>
            {reports.length > 0 ? (
                <Carousel opts={{ align: "start", dragFree: true }}>
                    <CarouselContent className="-ml-2">
                        {reports.map((report, index) => (
                            <CarouselItem key={index} className="basis-auto pl-2 flex flex-col">
                                <DateCard
                                    report={report}
                                    isSelected={selectedReport?.date === report.date}
                                    onSelect={() => setSelectedReport(report)}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
                </Carousel>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 bg-muted rounded-lg">
                    <FileText className="size-12 mb-4"/>
                    <h3 className="font-semibold text-lg text-foreground">No reports generated yet</h3>
                    <p>Complete tasks and use the daily report card to create your first report.</p>
                </div>
            )}
        </CardContent>
      </Card>

      {selectedReport ? (
        <Card>
            <CardHeader>
                <CardTitle>
                    Report for {format(parseISO(selectedReport.date), 'eeee, MMMM d')}
                </CardTitle>
                 <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate AI Summary'}
                    </Button>
                    <Button variant="secondary" onClick={() => handleCopyToClipboard(selectedReport.generatedReport)}><Clipboard className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" onClick={() => handleExport(selectedReport)}><Download className="mr-2 h-4 w-4" />Export .txt</Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>AI-Generated Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-32rem)] w-full rounded-md border bg-background/50 p-4">
                        <MarkdownPreview content={selectedReport.generatedReport}/>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <div className="md:col-span-1 h-full">
                     <VisualReportCard report={selectedReport} />
                </div>
            </CardContent>
        </Card>
      ) : (
        !isFetching && reports.length > 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 bg-muted rounded-lg">
                <FileText className="size-16 mb-4"/>
                <h3 className="font-semibold text-lg text-foreground">Select a report</h3>
                <p>Choose a day from the history list above to see its details.</p>
              </div>
        )
      )}
    </div>
  );
}
