'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Mail } from 'lucide-react';
import type { DailyReport, Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { getReports, getTasksForWorkday } from '@/lib/data-firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DateCard } from '@/components/reports/date-card';
import { VisualReportCard } from '@/components/reports/visual-report-card';
import { generateEmailReportAction } from '../actions';
import { EmailPreviewDialog } from '@/components/reports/email-preview-dialog';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';

const INITIAL_REPORTS_LIMIT = 30; // Load last 30 reports initially
const LOAD_MORE_INCREMENT = 20; // Load 20 more when "Load More" is clicked

export function ReportsClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { loading: dataLoading } = useDashboardData();

  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);
  const [selectedReportTasks, setSelectedReportTasks] = React.useState<Task[]>([]);

  const [isFetching, setIsFetching] = React.useState(true);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [emailBody, setEmailBody] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [reportsLimit, setReportsLimit] = React.useState(INITIAL_REPORTS_LIMIT);
  const [hasMoreReports, setHasMoreReports] = React.useState(false);

  const { toast } = useToast();

  // Set up real-time listener for reports with pagination
  React.useEffect(() => {
    if (!user || !firestore || userLoading) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    const reportsCol = collection(firestore, 'users', user.uid, 'reports');
    const q = query(
      reportsCol,
      orderBy('date', 'desc'),
      firestoreLimit(reportsLimit + 1) // Fetch one extra to check if there are more
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ ...doc.data() } as DailyReport));

      // Check if there are more reports beyond our limit
      setHasMoreReports(reportsData.length > reportsLimit);

      // Only keep the requested limit (remove the extra one we fetched)
      const reportsArray = reportsData.slice(0, reportsLimit).sort((a, b) => b.date.localeCompare(a.date));
      setReports(reportsArray);

      // Auto-select the first report if none is selected
      if (!selectedReport && reportsArray.length > 0) {
        setSelectedReport(reportsArray[0]);
      } else if (selectedReport) {
        // Update selected report if it still exists
        const updatedSelected = reportsArray.find(r => r.date === selectedReport.date);
        if (updatedSelected) {
          setSelectedReport(updatedSelected);
        } else if (reportsArray.length > 0) {
          setSelectedReport(reportsArray[0]);
        } else {
          setSelectedReport(null);
        }
      }

      setIsFetching(false);
    }, (error) => {
      console.error("Error listening to reports:", error);
      toast({ variant: 'destructive', title: 'Could not load reports.' });
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [user, firestore, toast, userLoading, reportsLimit, selectedReport]);

  // Set up real-time listener for tasks of the selected report
  React.useEffect(() => {
    if (!selectedReport || !user || !firestore || userLoading) return;

    // We need to listen to both workday-tasks and the actual tasks/recurring-tasks
    // For simplicity, we'll refetch when either collection changes
    const tasksCol = collection(firestore, 'users', user.uid, 'tasks');
    const recurringTasksCol = collection(firestore, 'users', user.uid, 'recurring-tasks');
    const workdayTasksCol = collection(firestore, 'users', user.uid, 'workday-tasks');

    const fetchTasks = async () => {
      try {
        const tasks = await getTasksForWorkday(firestore, user.uid, selectedReport.date);
        setSelectedReportTasks(tasks);
      } catch (error) {
        console.error("Error fetching tasks for workday:", error);
      }
    };

    // Initial fetch
    fetchTasks();

    // Listen to changes in all three collections
    const unsubTasks = onSnapshot(tasksCol, () => fetchTasks());
    const unsubRecurring = onSnapshot(recurringTasksCol, () => fetchTasks());
    const unsubWorkday = onSnapshot(workdayTasksCol, () => fetchTasks());

    return () => {
      unsubTasks();
      unsubRecurring();
      unsubWorkday();
    };
  }, [selectedReport, user, firestore, userLoading]);


  const handleDateSelect = (report: DailyReport) => {
    setSelectedReport(report);
  }

  const handleLoadMore = () => {
    setReportsLimit(prev => prev + LOAD_MORE_INCREMENT);
  }

  const handleGenerateEmail = async () => {
    if (!selectedReport || !user) return;
    setIsGeneratingEmail(true);
    try {
      const body = await generateEmailReportAction(selectedReport, selectedReportTasks, { displayName: user.displayName, email: user.email });
      setEmailBody(body);
      setIsPreviewOpen(true);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to generate email content.' });
    } finally {
      setIsGeneratingEmail(false);
    }
  };


  if (userLoading || dataLoading || isFetching || !user) {
    return (
         <div className="space-y-6">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-96 w-full" />
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
                                    onSelect={() => handleDateSelect(report)}
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
            {hasMoreReports && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load Older Reports
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {selectedReport ? (
        <Card>
             <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <CardTitle>Report Details</CardTitle>
                        <CardDescription>A summary of your activities and stats for the selected day.</CardDescription>
                    </div>
                     <Button onClick={handleGenerateEmail} disabled={isGeneratingEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        {isGeneratingEmail ? 'Generating...' : 'Email Report'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <VisualReportCard report={selectedReport} tasks={selectedReportTasks} />
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

      {selectedReport && emailBody && (
        <EmailPreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          report={selectedReport}
          emailBody={emailBody}
          userName={user?.displayName || 'User'}
          userEmail={user?.email || ''}
        />
      )}
    </div>
  );
}
