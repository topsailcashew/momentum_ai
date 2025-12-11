'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { getReports, getTasksForWorkday } from '@/lib/data-firestore';
import { useToast } from '@/hooks/use-toast';
import type { DailyReport, Task } from '@/lib/types';
import { getDay, parseISO, format } from 'date-fns';
import {
  FileText,
  Mail,
  TrendingUp,
  Zap,
  Tag,
  Calendar,
  CheckCircle,
  Clock,
  PieChart,
  BarChart
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DateCard } from '@/components/reports/date-card';
import { VisualReportCard } from '@/components/reports/visual-report-card';
import { generateEmailReportAction } from '../actions';
import { EmailPreviewDialog } from '@/components/reports/email-preview-dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Legend, BarChart as RechartsBarChart, PieChart as RechartsPieChart } from "recharts"
import { FlowVisualizerCard } from '@/components/profile/flow-visualizer-card';

const StatCard = ({ icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => {
    const Icon = icon;
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
            <div className="p-2 bg-primary/10 rounded-md">
                <Icon className="size-6 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-lg font-semibold">{value}</p>
            </div>
        </div>
    );
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DashboardClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { tasks, categories, loading: dataLoading } = useDashboardData();
  const { toast } = useToast();

  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [selectedReport, setSelectedReport] = React.useState<DailyReport | null>(null);
  const [selectedReportTasks, setSelectedReportTasks] = React.useState<Task[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [emailBody, setEmailBody] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

  const fetchReportsAndTasks = React.useCallback(async () => {
    if (user && firestore) {
      setIsFetching(true);
      try {
        const reportsData = await getReports(firestore, user.uid);
        const reportsArray = Object.values(reportsData).sort((a, b) => b.date.localeCompare(a.date));
        setReports(reportsArray);

        let currentReport = selectedReport;
        if (!currentReport && reportsArray.length > 0) {
          currentReport = reportsArray[0];
          setSelectedReport(reportsArray[0]);
        } else if (currentReport) {
            const updatedSelected = reportsArray.find(r => r.date === currentReport!.date);
            currentReport = updatedSelected || reportsArray[0] || null;
            setSelectedReport(currentReport);
        }

        if(currentReport) {
            const tasks = await getTasksForWorkday(firestore, user.uid, currentReport.date);
            setSelectedReportTasks(tasks);
        }

      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({ variant: 'destructive', title: 'Could not load reports.' });
      } finally {
        setIsFetching(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, toast]);

  React.useEffect(() => {
    fetchReportsAndTasks();
  }, [fetchReportsAndTasks]);

  const handleDateSelect = async (report: DailyReport) => {
    setSelectedReport(report);
    if(user && firestore) {
        const tasks = await getTasksForWorkday(firestore, user.uid, report.date);
        setSelectedReportTasks(tasks);
    }
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

  // Analytics calculations
  const completedTasks = tasks.filter(task => task.completed && task.completedAt);
  const recentTasks = completedTasks.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()).slice(0, 5);
  const upcomingTasks = tasks
    .filter(task => !task.completed && task.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const { stats, dailyCompletionData, categoryDistributionData } = React.useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyCompletionData = daysOfWeek.map(day => ({ name: day, tasks: 0 }));

    if (completedTasks.length === 0) {
      return {
        stats: { totalCompleted: 0, productiveDay: 'N/A', energySweetSpot: 'N/A', topCategory: 'N/A' },
        dailyCompletionData,
        categoryDistributionData: [],
      };
    }

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dayIndex = getDay(parseISO(task.completedAt));
        dayCounts[dayIndex]++;
      }
    });

    dayCounts.forEach((count, index) => {
      dailyCompletionData[index].tasks = count;
    });

    const mostProductiveDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const productiveDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][mostProductiveDayIndex];

    const energyCounts = completedTasks.reduce((acc, task) => {
        if (task.energyLevel) {
            acc[task.energyLevel] = (acc[task.energyLevel] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const energySweetSpot = Object.keys(energyCounts).length > 0
        ? Object.keys(energyCounts).reduce((a, b) => energyCounts[a] > energyCounts[b] ? a : b)
        : 'N/A';

    const categoryCounts = completedTasks.reduce((acc, task) => {
        if (task.category) {
            acc[task.category] = (acc[task.category] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    if (Object.keys(categoryCounts).length === 0) {
        return {
          stats: { totalCompleted: completedTasks.length, productiveDay, energySweetSpot, topCategory: 'N/A' },
          dailyCompletionData,
          categoryDistributionData: [],
        };
    }

    const topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
    const categoryDistributionData = Object.entries(categoryCounts).map(([id, value]) => ({
      name: getCategoryName(id),
      value,
    })).sort((a,b) => b.value - a.value);

    return {
      stats: { totalCompleted: completedTasks.length, productiveDay, energySweetSpot, topCategory: getCategoryName(topCategory) },
      dailyCompletionData,
      categoryDistributionData,
    };
  }, [completedTasks, getCategoryName]);

  if (userLoading || dataLoading || isFetching || !user) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36" />
        <Skeleton className="h-96" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Reports Section */}
      <Card>
        <CardHeader>
            <CardTitle>Reports History</CardTitle>
            <CardDescription>View your daily work reports and send them via email.</CardDescription>
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
                    <p>Complete your workday and click "End Day" to generate your first report.</p>
                </div>
            )}
        </CardContent>
      </Card>

      {selectedReport && (
        <Card>
             <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <CardTitle>Report Details</CardTitle>
                        <CardDescription>A summary of your activities for the selected day.</CardDescription>
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
      )}

      {/* Analytics Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-primary" />
                Productivity Analytics
            </CardTitle>
            <CardDescription>Insights into your productivity patterns and achievements.</CardDescription>
        </CardHeader>
         <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={CheckCircle} title="Total Tasks Completed" value={stats.totalCompleted} />
            <StatCard icon={Calendar} title="Most Productive Day" value={stats.productiveDay} />
            <StatCard icon={Zap} title="Energy Sweet Spot" value={stats.energySweetSpot} />
            <StatCard icon={Tag} title="Top Category" value={stats.topCategory} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Completion Chart */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="text-primary"/>
                    Weekly Completion
                </CardTitle>
                <CardDescription>Tasks completed per day of the week.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-48 w-full">
                  <ResponsiveContainer>
                    <RechartsBarChart data={dailyCompletionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <ChartTooltip
                          cursor={{fill: 'hsla(var(--muted))'}}
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="text-primary"/>
                    Category Breakdown
                </CardTitle>
                <CardDescription>How your tasks are distributed.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={{}} className="h-48 w-full">
                  <ResponsiveContainer>
                    <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie
                            data={categoryDistributionData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            strokeWidth={2}
                            paddingAngle={2}
                        >
                          {categoryDistributionData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                            iconSize={10}
                            wrapperStyle={{fontSize: "0.8rem", color: "hsl(var(--muted-foreground))"}}
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                        />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Tabs defaultValue="upcoming" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your recent accomplishments and what's coming up next.</CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
               {upcomingTasks.length > 0 ? (
                  <ul className="space-y-3">
                      {upcomingTasks.map(task => (
                          <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                              <div>
                                  <p className="font-medium text-sm">{task.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <Clock className="size-3" />
                                      Due on {format(parseISO(task.deadline!), 'MMM d, yyyy')}
                                  </p>
                              </div>
                              <Badge variant="secondary">{getCategoryName(task.category || '')}</Badge>
                          </li>
                      ))}
                  </ul>
             ) : (
                 <div className="text-center text-muted-foreground py-12">
                     <p>No upcoming tasks with deadlines. Enjoy the calm!</p>
                 </div>
             )}
            </TabsContent>
            <TabsContent value="recent" className="mt-4">
               {recentTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {recentTasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                <div>
                                    <p className="font-medium text-sm">{task.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Completed on {format(parseISO(task.completedAt!), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <Badge variant="secondary">{getCategoryName(task.category || '')}</Badge>
                            </li>
                        ))}
                    </ul>
              ) : (
                  <div className="text-center text-muted-foreground py-12">
                      <p>No completed tasks yet. Go get something done!</p>
                  </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Flow Visualizer */}
      <FlowVisualizerCard />

      {/* Email Preview Dialog */}
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
