
'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '../actions';
import { updateProfile } from 'firebase/auth';
import { TrendingUp, Zap, Tag, Calendar, CheckCircle, Clock, PieChart, BarChart, XCircle, AlertTriangle } from 'lucide-react';
import { getDay, parseISO, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useSearchParams } from 'next/navigation';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Legend, BarChart as RechartsBarChart, PieChart as RechartsPieChart } from "recharts"
import { FlowVisualizerCard } from '@/components/profile/flow-visualizer-card';
import { updateUserProfile } from '@/lib/data-firestore';
import { useProfileImageUpload } from '@/hooks/use-profile-image-upload';


const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

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

interface CalendarStatus {
  connected: boolean;
  hasRefreshToken?: boolean;
  isExpired?: boolean;
  connectedAt?: string;
}

export function ProfileClientPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { tasks, categories, loading: dataLoading } = useDashboardData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isUploading, error: uploadError, uploadImage } = useProfileImageUpload();

  const [isPending, startTransition] = React.useTransition();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [calendarStatus, setCalendarStatus] = React.useState<CalendarStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  React.useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName || '' });
    }
  }, [user, form]);

  // Check for OAuth callback status
  React.useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success') {
      toast({
        title: 'Calendar Connected!',
        description: 'Your Google Calendar has been successfully connected.',
      });
      router.replace('/profile');
    } else if (status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: message === 'missing_user' ? 'User authentication failed.' : 'Failed to connect Google Calendar. Please try again.',
      });
      router.replace('/profile');
    }
  }, [searchParams, router, toast]);

  // Fetch calendar connection status
  React.useEffect(() => {
    if (!user?.uid) return;

    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await fetch(`/api/calendar/status?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarStatus(data);
        }
      } catch (error) {
        console.error('Error fetching calendar status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [user]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!user || !firestore) return;

    startTransition(async () => {
      try {
        if (user.displayName !== data.displayName) {
          await updateProfile(user, { displayName: data.displayName });
          await updateUserProfile(firestore, user.uid, { displayName: data.displayName });
        }

        toast({
          title: 'Profile updated!',
          description: 'Your display name has been changed.',
        });
        await updateUserProfileAction(user.uid, { displayName: data.displayName });
      } catch (error) {
        console.error('Profile update error:', error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem updating your profile.',
        });
      }
    });
  };

  const handleConnectCalendar = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated. Please log in again.',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch(`/api/auth/google?userId=${user.uid}`);
      const data = await response.json();

      if (response.status === 503 && data.configError) {
        toast({
          variant: 'destructive',
          title: 'Not Configured',
          description: 'Google Calendar integration is not configured. Please contact the administrator.',
        });
        setIsConnecting(false);
        return;
      }

      if (response.ok) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get authorization URL.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error.message || 'Could not initiate connection to Google Calendar. Please try again.',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user?.uid) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (response.ok) {
        setCalendarStatus({ connected: false });
        toast({
          title: 'Calendar Disconnected',
          description: 'Your Google Calendar has been disconnected.',
        });
      } else {
        throw new Error('Failed to disconnect calendar');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Disconnection Failed',
        description: 'Could not disconnect Google Calendar. Please try again.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !firestore) return;

  try {
    const newPhotoURL = await uploadImage(file);

    if (newPhotoURL) {
      await updateProfile(user, { photoURL: newPhotoURL });
      await updateUserProfile(firestore, user.uid, { photoURL: newPhotoURL });
      toast({
        title: 'Profile image updated!',
        description: 'Your new profile image has been saved.',
      });
      await updateUserProfileAction(user.uid, { photoURL: newPhotoURL });
    } else if (uploadError) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: uploadError.message,
      });
    }
  } catch (error) {
    console.error('Profile image update error:', error);
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem updating your profile image.',
    });
  } finally {
    //
  }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

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
      const level = task.energyLevel ?? 'Medium';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const energySweetSpot = Object.keys(energyCounts).reduce((a, b) => energyCounts[a] > energyCounts[b] ? a : b);

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
    })).sort((a, b) => b.value - a.value);


    return {
      stats: { totalCompleted: completedTasks.length, productiveDay, energySweetSpot, topCategory: getCategoryName(topCategory) },
      dailyCompletionData,
      categoryDistributionData,
    };
  }, [completedTasks, categories]);


  if (userLoading || dataLoading || !user) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[28rem] w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="profile-image-upload"
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Change
                </Label>
                <Input
                  id="profile-image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                  disabled={isUploading}
                />
              </div>
              <div>
                <p className="text-xl font-semibold">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="displayName">Display Name</Label>
                      <FormControl>
                        <Input id="displayName" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

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
                        <Badge variant="secondary">{getCategoryName(task.category ?? 'personal')}</Badge>
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
                        <Badge variant="secondary">{getCategoryName(task.category ?? 'personal')}</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Integration</CardTitle>
            <CardDescription>Connect your Google Calendar to view events alongside your tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Calendar className="size-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Google Calendar</h3>
                  {isLoadingStatus ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : !calendarStatus?.connected ? (
                    <div className="flex items-center gap-2 mt-1">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not connected</span>
                    </div>
                  ) : calendarStatus.isExpired ? (
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600">Connection expired</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Connected</Badge>
                      </div>
                      {calendarStatus.connectedAt && (
                        <span className="text-xs text-muted-foreground">
                          Since {format(parseISO(calendarStatus.connectedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isLoadingStatus ? (
                <Skeleton className="h-10 w-24" />
              ) : !calendarStatus?.connected ? (
                <Button onClick={handleConnectCalendar} disabled={isConnecting} size="sm">
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              ) : calendarStatus.isExpired ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDisconnectCalendar} disabled={isDisconnecting}>
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                  <Button size="sm" onClick={handleConnectCalendar} disabled={isConnecting}>
                    {isConnecting ? 'Reconnecting...' : 'Reconnect'}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleDisconnectCalendar} disabled={isDisconnecting}>
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary" />
              Productivity Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard icon={CheckCircle} title="Total Tasks Completed" value={stats.totalCompleted} />
            <StatCard icon={Calendar} title="Most Productive Day" value={stats.productiveDay} />
            <StatCard icon={Zap} title="Energy Sweet Spot" value={stats.energySweetSpot} />
            <StatCard icon={Tag} title="Top Category" value={stats.topCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="text-primary" />
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
                    cursor={{ fill: 'hsla(var(--muted))' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="text-primary" />
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
                    wrapperStyle={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <FlowVisualizerCard />
      </div>
    </div>
  );
}
