
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
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
import type { Task, Category } from '@/lib/types';
import { TrendingUp, Zap, Tag, Calendar, CheckCircle, Clock } from 'lucide-react';
import { getDay, parseISO, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/hooks/use-dashboard-data';

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

export function ProfileClientPage() {
  const { user, loading: userLoading } = useUser();
  const { tasks, categories, loading: dataLoading } = useDashboardData();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPending, startTransition] = React.useTransition();

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
  

  const onSubmit = (data: ProfileFormValues) => {
    if (!user) return;

    startTransition(async () => {
      try {
        if(user && user.displayName !== data.displayName) {
          await updateProfile(user, { displayName: data.displayName });
        }
        updateUserProfileAction(user.uid, { displayName: data.displayName });
        toast({
          title: 'Profile updated!',
          description: 'Your display name has been changed.',
        });
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

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

  const completedTasks = tasks.filter(task => task.completed && task.completedAt);
  const recentTasks = completedTasks.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()).slice(0, 5);

  const upcomingTasks = tasks
    .filter(task => !task.completed && task.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);


  const stats = React.useMemo(() => {
    if (completedTasks.length === 0) {
      return {
        totalCompleted: 0,
        productiveDay: 'N/A',
        energySweetSpot: 'N/A',
        topCategory: 'N/A',
      };
    }

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dayIndex = getDay(parseISO(task.completedAt));
        dayCounts[dayIndex]++;
      }
    });
    const mostProductiveDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const energyCounts = completedTasks.reduce((acc, task) => {
        acc[task.energyLevel] = (acc[task.energyLevel] || 0) + 1;
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
          totalCompleted: completedTasks.length,
          productiveDay: daysOfWeek[mostProductiveDayIndex],
          energySweetSpot,
          topCategory: 'N/A',
        };
    }

    const topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);

    return {
      totalCompleted: completedTasks.length,
      productiveDay: daysOfWeek[mostProductiveDayIndex],
      energySweetSpot,
      topCategory: getCategoryName(topCategory),
    };
  }, [completedTasks, categories]);


  if (userLoading || dataLoading || !user) {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="text-xl font-semibold">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="text-primary" />
                        Productivity Stats
                    </CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 gap-4">
                    <StatCard icon={CheckCircle} title="Total Tasks Completed" value={stats.totalCompleted} />
                    <StatCard icon={Calendar} title="Most Productive Day" value={stats.productiveDay} />
                    <StatCard icon={Zap} title="Energy Sweet Spot" value={stats.energySweetSpot} />
                    <StatCard icon={Tag} title="Top Category" value={stats.topCategory} />
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
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
                                    <Badge variant="secondary">{getCategoryName(task.category)}</Badge>
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
                                      <Badge variant="secondary">{getCategoryName(task.category)}</Badge>
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
        </div>
    </div>
  );
}
