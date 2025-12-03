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
import type { Task, Category, Project, DailyReport, EnergyLog, MomentumScore, RecurringTask, Ministry } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';

interface DashboardDataContextType {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  recurringTasks: RecurringTask[];
  energyLog: EnergyLog[];
  ministries: Ministry[];
  todayEnergy?: EnergyLog;
  latestMomentum?: MomentumScore;
  todaysReport: DailyReport | null;
  loading: boolean;
  error: Error | null;
  selectedMinistryId: string | null;
  setSelectedMinistryId: React.Dispatch<React.SetStateAction<string | null>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setRecurringTasks: React.Dispatch<React.SetStateAction<RecurringTask[]>>;
  setTodaysReport: React.Dispatch<React.SetStateAction<DailyReport | null>>;
  setTodayEnergy: React.Dispatch<React.SetStateAction<EnergyLog | undefined>>;
  setLatestMomentum: React.Dispatch<React.SetStateAction<MomentumScore | undefined>>;
  refetchData: () => void;
  filteredTasks: Task[];
  filteredProjects: Project[];
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
  const [ministries, setMinistries] = React.useState<Ministry[]>([]);
  const [todayEnergy, setTodayEnergy] = React.useState<EnergyLog | undefined>(undefined);
  const [latestMomentum, setLatestMomentum] = React.useState<MomentumScore | undefined>(undefined);
  const [todaysReport, setTodaysReport] = React.useState<DailyReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [selectedMinistryId, setSelectedMinistryId] = React.useState<string | null>(null);

  const fetchAllData = React.useCallback(async () => {
    if (user && firestore) {
      setLoading(true);
      try {
        const [
          categoriesData,
          todayEnergyData,
          latestMomentumData,
          reportData,
        ] = await Promise.all([
          getCategories(),
          getTodayEnergy(firestore, user.uid),
          getLatestMomentum(firestore, user.uid),
          getTodaysReport(firestore, user.uid),
        ]);
        setCategories(categoriesData);
        setTodayEnergy(todayEnergyData);
        setLatestMomentum(latestMomentumData);
        setTodaysReport(reportData);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    } else if (!user) {
      setLoading(false);
    }
  }, [user, firestore]);

  // Set up real-time listeners for tasks, projects, recurring tasks, and energy log
  React.useEffect(() => {
    if (!user || !firestore) return;

    const unsubscribers: (() => void)[] = [];

    // Listen to tasks
    const tasksCol = collection(firestore, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tasksData);
    }, (error) => {
      console.error("Error listening to tasks:", error);
      setError(error);
    });
    unsubscribers.push(unsubTasks);

    // Listen to projects
    const projectsCol = collection(firestore, 'users', user.uid, 'projects');
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
      console.error("Error listening to projects:", error);
    });
    unsubscribers.push(unsubProjects);

    // Listen to recurring tasks
    const recurringTasksCol = collection(firestore, 'users', user.uid, 'recurring-tasks');
    const unsubRecurring = onSnapshot(recurringTasksCol, (snapshot) => {
      const recurringTasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask));
      setRecurringTasks(recurringTasksData);
    }, (error) => {
      console.error("Error listening to recurring tasks:", error);
    });
    unsubscribers.push(unsubRecurring);

    // Listen to energy log
    const energyLogCol = collection(firestore, 'users', user.uid, 'energy-log');
    const unsubEnergyLog = onSnapshot(energyLogCol, (snapshot) => {
      const energyLogData = snapshot.docs.map(doc => doc.data() as EnergyLog);
      setEnergyLog(energyLogData);
    }, (error) => {
      console.error("Error listening to energy log:", error);
    });
    unsubscribers.push(unsubEnergyLog);

    // Listen to ministries
    const ministriesCol = collection(firestore, 'users', user.uid, 'ministries');
    const unsubMinistries = onSnapshot(ministriesCol, (snapshot) => {
      const ministriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ministry));
      setMinistries(ministriesData);
    }, (error) => {
      console.error("Error listening to ministries:", error);
    });
    unsubscribers.push(unsubMinistries);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, firestore]);

  React.useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // Filtered data based on selected ministry
  const filteredTasks = React.useMemo(() => {
    if (!selectedMinistryId) return tasks;
    return tasks.filter(task => task.ministryId === selectedMinistryId);
  }, [tasks, selectedMinistryId]);

  const filteredProjects = React.useMemo(() => {
    if (!selectedMinistryId) return projects;
    return projects.filter(project => project.ministryId === selectedMinistryId);
  }, [projects, selectedMinistryId]);

  const value = {
    tasks,
    projects,
    categories,
    recurringTasks,
    energyLog,
    ministries,
    todayEnergy,
    latestMomentum,
    todaysReport,
    loading,
    error,
    selectedMinistryId,
    setSelectedMinistryId,
    setTasks,
    setProjects,
    setRecurringTasks,
    setTodaysReport,
    setTodayEnergy,
    setLatestMomentum,
    refetchData: fetchAllData,
    filteredTasks,
    filteredProjects,
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
