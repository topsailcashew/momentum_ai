'use client';
import * as React from 'react';
import {
  getTasks,
  getTodayEnergy,
  getLatestMomentum,
  getCategories,
  getProjects,
  getTodaysReport,
} from '@/lib/data-firestore';
import { MomentumCard } from '@/components/dashboard/momentum-card';
import { TaskList } from '@/components/dashboard/task-list';
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { ProjectOverview } from '@/components/dashboard/project-overview';
import { DailyReportCard } from '@/components/dashboard/daily-report-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Task, Category, Project, DailyReport, EnergyLog, MomentumScore } from '@/lib/types';

export function DashboardClientPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [todayEnergy, setTodayEnergy] = useState<EnergyLog | undefined>(undefined);
  const [latestMomentum, setLatestMomentum] = useState<MomentumScore | undefined>(undefined);
  const [todaysReport, setTodaysReport] = useState<DailyReport | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user && firestore) {
      setDataLoading(true);
      Promise.all([
        getTasks(firestore, user.uid),
        getProjects(firestore, user.uid),
        getCategories(),
        getTodayEnergy(firestore, user.uid),
        getLatestMomentum(firestore, user.uid),
        getTodaysReport(firestore, user.uid),
      ]).then(([tasks, projects, categories, todayEnergy, latestMomentum, report]) => {
        setTasks(tasks);
        setProjects(projects);
        setCategories(categories);
        setTodayEnergy(todayEnergy);
        setLatestMomentum(latestMomentum);
        setTodaysReport(report);
        setDataLoading(false);
      }).catch(error => {
        console.error("Error fetching dashboard data:", error);
        setDataLoading(false);
      });
    }
  }, [user, firestore]);

  if (userLoading || dataLoading || !user || !firestore) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Pomodoro />
        <TaskList
            initialTasks={tasks}
            categories={categories}
            projects={projects}
            todayEnergy={todayEnergy}
            userId={user.uid}
        />
      </div>
      
      <ProjectOverview projects={projects} tasks={tasks} userId={user.uid} />
      
      <DailyReportCard initialReport={todaysReport as DailyReport} userId={user.uid} />
      
      <MomentumCard
          initialLatestMomentum={latestMomentum}
          initialTodayEnergy={todayEnergy}
          tasks={tasks}
          projects={projects}
          userId={user.uid}
      />
    </div>
  );
}
