'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Download, FileText, Loader2 } from 'lucide-react';
import type { DailyReport } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getReports } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { generateReportAction } from '../actions';


export function ReportsClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { loading: dataLoading } = useDashboardData();

  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);
  const [clientFormattedTimes, setClientFormattedTimes] = React.useState({ startTime: 'N/A', endTime: 'N/A' });
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
          // If a report was selected, find its updated version in the new data
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
  }, [user, firestore]);

  React.useEffect(() => {
    if (selectedReport) {
      setClientFormattedTimes({
        startTime: selectedReport.startTime ? format(parseISO(selectedReport.startTime), 'h:mm a') : 'N/A',
        endTime: selectedReport.endTime ? format(parseISO(selectedReport.endTime), 'h:mm a') : 'N/A',
      });
    }
  }, [selectedReport]);


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
    if (!selectedReport || !user) return;

    startGeneratingTransition(async () => {
      try {
        const generatedText = await generateReportAction(user.uid, selectedReport.date);
        setSelectedReport(prev => prev ? { ...prev, generatedReport: generatedText } : null);
        await fetchReports(); // Refetch all reports to get the updated one
        toast({ title: "AI summary generated!" });
      } catch (error) {
        console.error("Failed to generate report:", error);
        toast({ variant: 'destructive', title: 'Failed to generate AI summary.' });
      }
    });
  };
  
  if (userLoading || dataLoading || isFetching || !user) {
    return (
         <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Reports History</CardTitle>
            <CardDescription>Select a day to view its report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow 
                    key={report.date} 
                    onClick={() => setSelectedReport(report)}
                    className="cursor-pointer"
                    data-selected={selectedReport?.date === report.date}
                  >
                    <TableCell>{format(parseISO(report.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant={report.completed / (report.goals || 1) >= 0.75 ? 'default' : 'secondary'}>
                          {Math.round((report.completed / (report.goals || 1)) * 100)}%
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedReport ? `Report for ${format(parseISO(selectedReport.date), 'eeee, MMM d')}` : 'No Report Selected'}
            </CardTitle>
            <CardDescription>
                {selectedReport ? `Started: ${clientFormattedTimes.startTime} | Ended: ${clientFormattedTimes.endTime}` : "Select a report to view details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-4">
                 <Textarea 
                    placeholder="Your generated report will appear here..." 
                    value={selectedReport.generatedReport || "Click 'Generate AI Summary' to create a summary."}
                    readOnly
                    rows={15}
                    className="bg-muted"
                 />
                 <div className="flex gap-2">
                    <Button onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate AI Summary'}
                    </Button>
                    <Button variant="secondary" onClick={() => handleCopyToClipboard(selectedReport.generatedReport)}><Clipboard className="mr-2 h-4 w-4" />Copy</Button>
                    <Button variant="outline" onClick={() => handleExport(selectedReport)}><Download className="mr-2 h-4 w-4" />Export .txt</Button>
                 </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                Select a report from the history list to see its details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
