import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy,
  writeBatch,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import type { Task, Category, EnergyLog, MomentumScore, EnergyLevel, Project, RecurringTask, DailyReport, WorkdayTask, EisenhowerMatrix } from './types';
import { format, isSameDay, parseISO, subDays } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { calculateDailyMomentumScore as calculateDailyMomentumScoreFlow } from '@/ai/flows/calculate-daily-momentum-score';

const categories: Category[] = [
  { "id": "work", "name": "Work" },
  { "id": "personal", "name": "Personal" },
  { "id": "learning", "name": "Learning" },
  { "id": "health", "name": "Health" },
  { "id": "chore", "name": "Chore" }
];

const getToday = () => format(new Date(), 'yyyy-MM-dd');

// Task Functions
export async function getTasks(db: Firestore, userId: string): Promise<Task[]> {
  const tasksCol = collection(db, 'users', userId, 'tasks');
  const taskSnapshot = await getDocs(tasksCol);
  const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  return taskList;
}

export async function getTasksForDate(db: Firestore, userId: string, date: string): Promise<Task[]> {
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const taskSnapshot = await getDocs(tasksCol);
    const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    return taskList.filter(task => task.createdAt && format(new Date(task.createdAt), 'yyyy-MM-dd') === date);
}

export async function addTask(db: Firestore, userId: string, taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'>): Promise<Task> {
    const tasksCol = collection(db, 'users', userId, 'tasks');

    const baseData = {
        category: 'personal',
        energyLevel: 'Medium' as EnergyLevel,
        priority: 'Important & Not Urgent' as EisenhowerMatrix,
        ...taskData,
    };

    const newTaskData = {
        ...baseData,
        category: baseData.category ?? 'personal',
        energyLevel: baseData.energyLevel ?? 'Medium',
        priority: baseData.priority ?? 'Important & Not Urgent',
        userId,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(tasksCol, newTaskData)
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: tasksCol.path,
            operation: 'create',
            requestResourceData: newTaskData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });
    return { id: docRef.id, ...newTaskData };
}

export function updateTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'userId'>>): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    return updateDoc(taskRef, updates)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: taskRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw to be caught by the caller
      });
}

export function deleteTask(db: Firestore, userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    return deleteDoc(taskRef)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: taskRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw to be caught by the caller
      });
}

// Category Functions - Now from an in-memory array as they are static
export function getCategories(): Category[] {
  return categories;
}

// Energy Log Functions
export async function getEnergyLog(db: Firestore, userId: string): Promise<EnergyLog[]> {
    const logCol = collection(db, 'users', userId, 'energy-log');
    const logSnapshot = await getDocs(logCol);
    return logSnapshot.docs.map(doc => doc.data() as EnergyLog);
}

export function setTodayEnergy(db: Firestore, userId: string, level: EnergyLevel): Promise<void> {
    const today = getToday();
    const logRef = doc(db, 'users', userId, 'energy-log', today);
    const newLog: EnergyLog = { date: today, level, userId };

    return setDoc(logRef, newLog, { merge: true })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: logRef.path,
          operation: 'write',
          requestResourceData: newLog,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export async function getTodayEnergy(db: Firestore, userId: string): Promise<EnergyLog | undefined> {
    const today = getToday();
    const logRef = doc(db, 'users', userId, 'energy-log', today);
    const docSnap = await getDoc(logRef);
    return docSnap.exists() ? docSnap.data() as EnergyLog : undefined;
}

// Momentum Score Functions
export async function getMomentumHistory(db: Firestore, userId: string): Promise<MomentumScore[]> {
    const momentumCol = collection(db, 'users', userId, 'momentum');
    const q = query(momentumCol, orderBy('date', 'desc'));
    const momentumSnapshot = await getDocs(q);
    return momentumSnapshot.docs.map(doc => doc.data() as MomentumScore);
}

export async function getLatestMomentum(db: Firestore, userId: string): Promise<MomentumScore | undefined> {
    const momentumCol = collection(db, 'users', userId, 'momentum');
    const q = query(momentumCol, orderBy('date', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return undefined;
    }
    return snapshot.docs[0].data() as MomentumScore;
}

export function saveMomentumScore(db: Firestore, userId: string, scoreData: Omit<MomentumScore, 'date' | 'userId'>): Promise<void> {
    const today = getToday();
    const momentumRef = doc(db, 'users', userId, 'momentum', today);
    const newScore: MomentumScore = { ...scoreData, date: today, userId };

    return setDoc(momentumRef, newScore, { merge: true })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: momentumRef.path,
          operation: 'write',
          requestResourceData: newScore,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}


export async function calculateAndSaveMomentumScore(db: Firestore, userId: string) {
    const allTasks = await getTasks(db, userId);
    const todayEnergy = await getTodayEnergy(db, userId);

    if (!todayEnergy) return;

    const completedToday = allTasks.filter(task => task.completed && task.completedAt && isSameDay(parseISO(task.completedAt), new Date()));
    if(completedToday.length === 0) return;

    const latestMomentum = await getLatestMomentum(db, userId);
    let streak = 1;
    let streakBonus = 0;

    if (latestMomentum) {
        const lastScoreDate = parseISO(latestMomentum.date);
        const yesterday = subDays(new Date(), 1);
        if (isSameDay(lastScoreDate, yesterday)) {
            streak = (latestMomentum.streak || 1) + 1;
        }
    }
    streakBonus = streak > 1 ? streak * 10 : 0;

    const scoreInput = {
        energyLevel: todayEnergy.level,
        completedTasks: completedToday.map(t => ({
            taskId: t.id,
            taskName: t.name,
            energyLevel: (t.energyLevel ?? 'Medium') as EnergyLevel
        })),
        streakBonus,
    };

    const aiResult = await calculateDailyMomentumScoreFlow(scoreInput);

    await saveMomentumScore(db, userId, {
        score: aiResult.dailyScore,
        summary: aiResult.summary,
        streak: streak
    });
}


// Project Functions
export async function getProjects(db: Firestore, userId: string): Promise<Project[]> {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    return projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function addProject(db: Firestore, userId: string, projectData: Omit<Project, 'id' | 'userId'>): Promise<Project> {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const dataWithUserId = { ...projectData, userId };
    const docRef = await addDoc(projectsCol, dataWithUserId);
    return { id: docRef.id, ...dataWithUserId };
}

export function updateProject(db: Firestore, userId: string, projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    return updateDoc(projectRef, updates)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: projectRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export async function deleteProject(db: Firestore, userId: string, projectId: string) {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);

    const tasksCol = collection(db, 'users', userId, 'tasks');
    const q = query(tasksCol, where('projectId', '==', projectId));
    
    try {
        const tasksSnapshot = await getDocs(q);
        const batch = writeBatch(db);
        tasksSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(projectRef); // Also delete the project itself
        await batch.commit();
    } catch(e) {
        // This is a complex operation, if it fails, we surface a generic error for now
        // A more robust solution might involve a cloud function.
        console.error("Failed to delete project and its tasks", e);
        const permissionError = new FirestorePermissionError({
          path: projectRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
}


// Recurring Task Functions
export async function getRecurringTasks(db: Firestore, userId: string): Promise<RecurringTask[]> {
  const tasksCol = collection(db, 'users', userId, 'recurring-tasks');
  const snapshot = await getDocs(tasksCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask));
}

export async function addRecurringTask(db: Firestore, userId: string, taskData: Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId' | 'createdAt'>): Promise<RecurringTask> {
    const tasksCol = collection(db, 'users', userId, 'recurring-tasks');
    const baseData = {
        category: 'personal',
        energyLevel: 'Medium' as EnergyLevel,
        priority: 'Important & Not Urgent' as EisenhowerMatrix,
        ...taskData,
    };

    const newTaskData = {
        ...baseData,
        category: baseData.category ?? 'personal',
        energyLevel: baseData.energyLevel ?? 'Medium',
        priority: baseData.priority ?? 'Important & Not Urgent',
        lastCompleted: null,
        userId,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(tasksCol, newTaskData)
      .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: tasksCol.path,
            operation: 'create',
            requestResourceData: newTaskData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });
    return { id: docRef.id, ...newTaskData };
}

export function updateRecurringTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<RecurringTask, 'id' | 'userId'>>): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'recurring-tasks', taskId);
    return updateDoc(taskRef, updates)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: taskRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

// Report Functions
export async function getReports(db: Firestore, userId: string): Promise<Record<string, DailyReport>> {
    const reportsCol = collection(db, 'users', userId, 'reports');
    const snapshot = await getDocs(reportsCol);
    const reports: Record<string, DailyReport> = {};
    snapshot.forEach(doc => {
        reports[doc.id] = doc.data() as DailyReport;
    });
    return reports;
}

export async function getTodaysReport(db: Firestore, userId: string): Promise<DailyReport> {
    const today = getToday();
    const reportRef = doc(db, 'users', userId, 'reports', today);
    const reportSnap = await getDoc(reportRef);

    const tasks = await getTasksForWorkday(db, userId, today);
    
    const defaultReport: DailyReport = {
        date: today,
        userId: userId,
        startTime: null,
        endTime: null,
        generatedReport: null,
        goals: tasks.length,
        completed: tasks.filter(t => t.completed).length,
    };
    
    const existingReport = reportSnap.exists() ? reportSnap.data() as DailyReport : defaultReport;

    const updatedReport = {
        ...existingReport,
        goals: tasks.length,
        completed: tasks.filter(t => t.completed).length,
    };

    if (!reportSnap.exists() || reportSnap.data().goals !== updatedReport.goals || reportSnap.data().completed !== updatedReport.completed) {
        await setDoc(reportRef, updatedReport, { merge: true });
    }

    return updatedReport;
}

export async function updateTodaysReport(db: Firestore, userId: string, updates: Partial<DailyReport>): Promise<DailyReport> {
    const today = getToday();
    const reportRef = doc(db, 'users', userId, 'reports', today);

    const currentReport = await getTodaysReport(db, userId);
    const newReportData = { ...currentReport, ...updates };
    await setDoc(reportRef, newReportData, { merge: true });
    return newReportData;
}

export async function resetTodaysReport(db: Firestore, userId: string): Promise<DailyReport> {
  const updates: Partial<DailyReport> = {
    startTime: null,
    endTime: null,
    generatedReport: null,
  };
  return await updateTodaysReport(db, userId, updates);
}

// Workday Task Functions
export async function getWorkdayTasks(db: Firestore, userId: string, date: string): Promise<WorkdayTask[]> {
  const workdayCol = collection(db, 'users', userId, 'workday-tasks');
  const q = query(workdayCol, where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkdayTask));
}

/**
 * Gets all tasks that were assigned to a specific workday with their full details.
 * This joins workday-tasks with actual task data (regular + recurring).
 */
export async function getTasksForWorkday(db: Firestore, userId: string, date: string): Promise<Task[]> {
  // Get workday tasks for this date
  const workdayTasks = await getWorkdayTasks(db, userId, date);

  // Get all regular and recurring tasks
  const [regularTasks, recurringTasks] = await Promise.all([
    getTasks(db, userId),
    getRecurringTasks(db, userId)
  ]);

  // Join workday tasks with actual task details
  const tasksWithDetails = workdayTasks.map(wt => {
    if (wt.taskType === 'regular') {
      const regularTask = regularTasks.find(t => t.id === wt.taskId);
      return regularTask || null;
    } else if (wt.taskType === 'recurring') {
      const recurringTask = recurringTasks.find(rt => rt.id === wt.taskId);
      if (recurringTask) {
        // Check if the recurring task was completed on this specific date
        const completedOnDate = recurringTask.lastCompleted
          ? format(new Date(recurringTask.lastCompleted), 'yyyy-MM-dd') === date
          : false;

        // Convert recurring task to Task format
        return {
          id: recurringTask.id,
          userId: recurringTask.userId,
          name: recurringTask.name,
          category: recurringTask.category ?? 'personal',
          energyLevel: recurringTask.energyLevel ?? 'Medium',
          completed: completedOnDate,
          completedAt: completedOnDate ? recurringTask.lastCompleted : null,
          createdAt: recurringTask.createdAt,
          projectId: recurringTask.projectId,
          deadline: recurringTask.deadline,
          collaboration: recurringTask.collaboration,
          details: recurringTask.details,
          priority: recurringTask.priority,
          score: undefined,
        } as Task;
      }
      return null;
    }
    return null;
  }).filter((t): t is Task => t !== null);

  return tasksWithDetails;
}

export async function addWorkdayTask(
  db: Firestore,
  userId: string,
  taskId: string,
  taskType: 'regular' | 'recurring',
  date?: string
): Promise<WorkdayTask> {
  const today = date || getToday();
  const workdayCol = collection(db, 'users', userId, 'workday-tasks');

  const newWorkdayTask = {
    userId,
    date: today,
    taskId,
    taskType,
    notes: null,
    addedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(workdayCol, newWorkdayTask);
  return { id: docRef.id, ...newWorkdayTask };
}

export async function removeWorkdayTask(db: Firestore, userId: string, workdayTaskId: string): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'workday-tasks', workdayTaskId);
  return deleteDoc(taskRef);
}

export async function updateWorkdayTaskNotes(
  db: Firestore,
  userId: string,
  workdayTaskId: string,
  notes: string
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'workday-tasks', workdayTaskId);
  return updateDoc(taskRef, { notes });
}

export async function getAllAvailableTasks(db: Firestore, userId: string): Promise<Array<Task & { source: 'regular' | 'recurring' }>> {
  const regularTasks = await getTasks(db, userId);
  const recurringTasks = await getRecurringTasks(db, userId);

  // Convert recurring tasks to task format
  const recurringAsTaskFormat = recurringTasks.map(rt => ({
    id: rt.id,
    userId: rt.userId,
    name: rt.name,
    category: rt.category ?? 'personal',
    energyLevel: rt.energyLevel ?? 'Medium',
    completed: false,
    completedAt: null,
    createdAt: rt.createdAt,
    projectId: rt.projectId,
    deadline: rt.deadline,
    collaboration: rt.collaboration,
    details: rt.details,
    priority: rt.priority,
    source: 'recurring' as const,
  }));

  const regularWithSource = regularTasks.map(t => ({ ...t, source: 'regular' as const }));

  return [...regularWithSource, ...recurringAsTaskFormat];
}

// User Profile
export function updateUserProfile(db: Firestore, userId: string, updates: { displayName?: string, photoURL?: string }): Promise<void> {
  const userRef = doc(db, 'users', userId);
  return updateDoc(userRef, updates)
  .catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: updates,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function createUserProfile(db: Firestore, userId: string, data: { email: string | null; displayName: string | null; photoURL: string | null }): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const profileData = {
      id: userId,
      ...data,
    }
    return setDoc(userRef, profileData, { merge: true })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
