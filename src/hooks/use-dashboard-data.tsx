'use client';

import * as React from 'react';
import {
  getTasks,
  getTodayEnergy,
  getLatestMomentum,
  getCategories,
  getProjects,
  getTodaysReport,
  getRecurringTasks,
  getEnergyLog,
} from '@/lib/data-firestore';
import { useUser, useFirestore } from '@/firebase';
import type { Task, Category, Project, DailyReport, EnergyLog, MomentumScore, RecurringTask } from '@/lib/types';

interface DashboardDataContextType {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  recurringTasks: RecurringTask[];
  energyLog: EnergyLog[];
  todayEnergy?: EnergyLog;
  latestMomentum?: MomentumScore;
  todaysReport: DailyReport | null;
  loading: boolean;
  error: Error | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setRecurringTasks: React.Dispatch<React.SetStateAction<RecurringTask[]>>;
}

const DashboardDataContext = React.createContext<DashboardDataContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [recurringTasks, setRecurringTasks] = React.useState<RecurringTask[]>([]);
  const [energyLog, setEnergyLog] = React.useState<EnergyLog[]>([]);
  const [todayEnergy, setTodayEnergy] = React.useState<EnergyLog | undefined>(undefined);
  const [latestMomentum, setLatestMomentum] = React.useState<MomentumScore | undefined>(undefined);
  const [todaysReport, setTodaysReport] = React.useState<DailyReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (user && firestore) {
      setLoading(true);
      const fetchAllData = async () => {
        try {
          const [
            tasksData, 
            projectsData, 
            categoriesData, 
            todayEnergyData, 
            latestMomentumData, 
            reportData,
            recurringTasksData,
            energyLogData,
          ] = await Promise.all([
            getTasks(firestore, user.uid),
            getProjects(firestore, user.uid),
            getCategories(),
            getTodayEnergy(firestore, user.uid),
            getLatestMomentum(firestore, user.uid),
            getTodaysReport(firestore, user.uid),
            getRecurringTasks(firestore, user.uid),
            getEnergyLog(firestore, user.uid),
          ]);
          setTasks(tasksData);
          setProjects(projectsData);
          setCategories(categoriesData);
          setTodayEnergy(todayEnergyData);
          setLatestMomentum(latestMomentumData);
          setTodaysReport(reportData);
          setRecurringTasks(recurringTasksData);
          setEnergyLog(energyLogData);
        } catch (error: any) {
          console.error("Error fetching dashboard data:", error);
          setError(error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    } else if (!user) {
      // If no user, we might not want to show loading forever
      setLoading(false);
    }
  }, [user, firestore]);

  const value = {
    tasks,
    projects,
    categories,
    recurringTasks,
    energyLog,
    todayEnergy,
    latestMomentum,
    todaysReport,
    loading,
    error,
    setTasks,
    setProjects,
    setRecurringTasks,
  };

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const context = React.useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
