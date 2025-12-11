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
import { DateCard } from '@/components/reports/date-card';
import { VisualReportCard } from '@/components/reports/visual-report-card';
import { generateEmailReportAction } from '../actions';
import { EmailPreviewDialog } from '@/components/reports/email-preview-dialog';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

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

  // Cache for generated email bodies to avoid regenerating the same report
  const emailCacheRef = React.useRef<Map<string, string>>(new Map());

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

    // Check cache first
    const cacheKey = `${selectedReport.date}-${selectedReportTasks.length}`;
    const cachedBody = emailCacheRef.current.get(cacheKey);

    if (cachedBody) {
      setEmailBody(cachedBody);
      setIsPreviewOpen(true);
      return;
    }

    // Generate new email if not cached
    setIsGeneratingEmail(true);
    try {
      const body = await generateEmailReportAction(selectedReport, selectedReportTasks, { displayName: user.displayName, email: user.email });

      // Cache the generated email
      emailCacheRef.current.set(cacheKey, body);

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
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-180px)]">
      {/* Sidebar - Reports List */}
      <Card className="flex flex-col h-full lg:h-auto">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg">Reports History</CardTitle>
            <CardDescription className="text-xs">Select a day to view details</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
            {reports.length > 0 ? (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
                    {reports.map((report, index) => (
                      <DateCard
                          key={report.date}
                          report={report}
                          isSelected={selectedReport?.date === report.date}
                          onSelect={() => handleDateSelect(report)}
                      />
                    ))}
                  </div>
                  {hasMoreReports && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        className="w-full"
                        size="sm"
                      >
                        Load Older Reports
                      </Button>
                    </div>
                  )}
                </>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <FileText className="size-12 mb-4 opacity-50"/>
                    <h3 className="font-semibold text-sm text-foreground">No reports yet</h3>
                    <p className="text-xs mt-1">Complete tasks to create your first report.</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Main Content - Report Details */}
      {selectedReport ? (
        <Card className="flex flex-col h-full overflow-hidden">
             <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <CardTitle className="text-lg">Report for {format(parseISO(selectedReport.date), 'MMMM d, yyyy')}</CardTitle>
                        <CardDescription className="text-xs">Daily activity summary</CardDescription>
                    </div>
                     <Button onClick={handleGenerateEmail} disabled={isGeneratingEmail} size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        {isGeneratingEmail ? 'Generating...' : 'Email Report'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <VisualReportCard report={selectedReport} tasks={selectedReportTasks} />
            </CardContent>
        </Card>
      ) : (
        !isFetching && reports.length > 0 && (
             <Card className="flex items-center justify-center h-full">
               <CardContent className="text-center text-muted-foreground p-8">
                  <FileText className="size-16 mb-4 mx-auto opacity-50"/>
                  <h3 className="font-semibold text-lg text-foreground">Select a report</h3>
                  <p className="text-sm mt-2">Choose a day from the list to view details.</p>
                </CardContent>
              </Card>
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
