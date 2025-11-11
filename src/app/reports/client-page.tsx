'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Download, FileText } from 'lucide-react';
import type { DailyReport } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getReports } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';


export function ReportsClientPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);
  const [clientFormattedTimes, setClientFormattedTimes] = React.useState({ startTime: 'N/A', endTime: 'N/A' });
  const { toast } = useToast();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  React.useEffect(() => {
    if (user && firestore) {
      setDataLoading(true);
      getReports(firestore, user.uid)
        .then(reportsData => {
          const reportsArray = Object.values(reportsData).sort((a, b) => b.date.localeCompare(a.date));
          setReports(reportsArray);
          setSelectedReport(reportsArray[0] || null);
          setDataLoading(false);
        })
        .catch(error => {
          console.error("Error fetching reports:", error);
          setDataLoading(false);
        });
    }
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
  
  if (userLoading || dataLoading || !user) {
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
                       <Badge variant={report.completed / report.goals >= 0.75 ? 'default' : 'secondary'}>
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
                    value={selectedReport.generatedReport || "Click 'Generate Report' to create a summary."}
                    readOnly
                    rows={15}
                    className="bg-muted"
                 />
                 <div className="flex gap-2">
                    <Button><FileText className="mr-2 h-4 w-4" />Generate AI Summary</Button>
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
