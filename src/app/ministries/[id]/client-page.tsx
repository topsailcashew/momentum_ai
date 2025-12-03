'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Church, ArrowLeft, Settings, FileText, Target, FolderKanban, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Ministry, StrategicPlan, StrategicGoal, Project, Task } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { StrategicPlanSection } from '@/components/ministries/strategic-plan-section';
import { GoalsSection } from '@/components/ministries/goals-section';
import { MinistryProjectsSection } from '@/components/ministries/ministry-projects-section';
import { MinistryTrackingTable } from '@/components/ministries/ministry-tracking-table';
import { MinistryDialog } from '@/components/ministries/ministry-dialog';

export function MinistryDetailClientPage() {
  const params = useParams();
  const ministryId = params.id as string;
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [ministry, setMinistry] = React.useState<Ministry | null>(null);
  const [strategicPlans, setStrategicPlans] = React.useState<StrategicPlan[]>([]);
  const [goals, setGoals] = React.useState<StrategicGoal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Listen to ministry
  React.useEffect(() => {
    if (!user || !firestore || !ministryId) {
      setLoading(false);
      return;
    }

    const ministryRef = collection(firestore, 'users', user.uid, 'ministries');
    const unsubscribe = onSnapshot(ministryRef, (snapshot) => {
      const ministryDoc = snapshot.docs.find(doc => doc.id === ministryId);
      if (ministryDoc) {
        setMinistry({ id: ministryDoc.id, ...ministryDoc.data() } as Ministry);
      } else {
        setMinistry(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to ministry:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, ministryId]);

  // Listen to strategic plans
  React.useEffect(() => {
    if (!user || !firestore || !ministryId) return;

    const plansCol = collection(firestore, 'users', user.uid, 'strategic-plans');
    const q = query(plansCol, where('ministryId', '==', ministryId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StrategicPlan));
      setStrategicPlans(plansData);
    });

    return () => unsubscribe();
  }, [user, firestore, ministryId]);

  // Listen to goals
  React.useEffect(() => {
    if (!user || !firestore || !ministryId) return;

    const goalsCol = collection(firestore, 'users', user.uid, 'strategic-goals');
    const q = query(goalsCol, where('ministryId', '==', ministryId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StrategicGoal));
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, [user, firestore, ministryId]);

  // Listen to projects
  React.useEffect(() => {
    if (!user || !firestore || !ministryId) return;

    const projectsCol = collection(firestore, 'users', user.uid, 'projects');
    const q = query(projectsCol, where('ministryId', '==', ministryId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, [user, firestore, ministryId]);

  // Listen to tasks
  React.useEffect(() => {
    if (!user || !firestore || !ministryId) return;

    const tasksCol = collection(firestore, 'users', user.uid, 'tasks');
    const q = query(tasksCol, where('ministryId', '==', ministryId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user, firestore, ministryId]);

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ministry) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Church className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ministry not found</h3>
          <p className="text-muted-foreground text-center mb-6">
            This ministry doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/ministries')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ministries
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activePlan = strategicPlans.length > 0 ? strategicPlans[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/ministries')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Church className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">{ministry.name}</h1>
            </div>
            {ministry.description && (
              <p className="text-muted-foreground mt-2 ml-14">{ministry.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Edit Ministry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strategic Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter(g => g.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'in-progress').length} in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.completed).length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strategic Plan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlan ? '1' : '0'}</div>
            <p className="text-xs text-muted-foreground">
              {activePlan ? 'Active' : 'Not created'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategic-plan">Strategic Plan</TabsTrigger>
          <TabsTrigger value="goals">Goals & Metrics</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tracking">Tracking Table</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ministry Overview</CardTitle>
              <CardDescription>
                A quick snapshot of your ministry's strategic initiatives and progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePlan && (
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">{activePlan.title}</h3>
                  {activePlan.visionStatement && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Vision:</span> {activePlan.visionStatement}
                    </p>
                  )}
                </div>
              )}
              {goals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Active Goals</h4>
                  <div className="space-y-2">
                    {goals.slice(0, 5).map(goal => (
                      <div key={goal.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                        <span className="text-sm">{goal.title}</span>
                        <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                          {goal.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic-plan">
          <StrategicPlanSection
            ministry={ministry}
            strategicPlan={activePlan}
          />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsSection
            ministry={ministry}
            strategicPlan={activePlan}
            goals={goals}
          />
        </TabsContent>

        <TabsContent value="projects">
          <MinistryProjectsSection
            ministry={ministry}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="tracking">
          <MinistryTrackingTable
            ministry={ministry}
            projects={projects}
            tasks={tasks}
          />
        </TabsContent>
      </Tabs>

      <MinistryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        ministry={ministry}
        onSuccess={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
}
