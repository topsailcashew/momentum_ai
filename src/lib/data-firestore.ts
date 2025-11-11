
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  limit,
  orderBy,
  writeBatch,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import type { Task, Category, EnergyLog, MomentumScore, EnergyLevel, Project, RecurringTask, DailyReport } from './types';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

export function addTask(db: Firestore, userId: string, taskData: Omit<Task, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt'>) {
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const newTaskData = {
        ...taskData,
        userId,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
    };

    addDoc(tasksCol, newTaskData)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: tasksCol.path,
          operation: 'create',
          requestResourceData: newTaskData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function updateTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<Task, 'id'>>) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    updateDoc(taskRef, updates)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: taskRef.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function deleteTask(db: Firestore, userId: string, taskId: string) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    deleteDoc(taskRef)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: taskRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
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

export function setTodayEnergy(db: Firestore, userId: string, level: EnergyLevel) {
    const today = getToday();
    const logRef = doc(db, 'users', userId, 'energy-log', today);
    const newLog: EnergyLog = { date: today, level, userId };

    setDoc(logRef, newLog, { merge: true })
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

export function saveMomentumScore(db: Firestore, userId: string, scoreData: Omit<MomentumScore, 'date' | 'userId'>) {
    const today = getToday();
    const momentumRef = doc(db, 'users', userId, 'momentum', today);
    const newScore: MomentumScore = { ...scoreData, date: today, userId };

    setDoc(momentumRef, newScore, { merge: true })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: momentumRef.path,
          operation: 'write',
          requestResourceData: newScore,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

// Project Functions
export async function getProjects(db: Firestore, userId: string): Promise<Project[]> {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    return projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export function addProject(db: Firestore, userId: string, projectData: Omit<Project, 'id' | 'userId'>) {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const dataWithUserId = { ...projectData, userId };
    
    addDoc(projectsCol, dataWithUserId)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: projectsCol.path,
          operation: 'create',
          requestResourceData: dataWithUserId,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function updateProject(db: Firestore, userId: string, projectId: string, updates: Partial<Project>) {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    updateDoc(projectRef, updates)
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

export function addRecurringTask(db: Firestore, userId: string, taskData: Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId'>) {
    const tasksCol = collection(db, 'users', userId, 'recurring-tasks');
    const newTaskData = { ...taskData, lastCompleted: null, userId };
    addDoc(tasksCol, newTaskData)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: tasksCol.path,
          operation: 'create',
          requestResourceData: newTaskData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function updateRecurringTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<RecurringTask, 'id'>>) {
    const taskRef = doc(db, 'users', userId, 'recurring-tasks', taskId);
    updateDoc(taskRef, updates)
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

    const tasks = await getTasks(db, userId);
    const todaysTasks = tasks.filter(t => t.createdAt && format(new Date(t.createdAt), 'yyyy-MM-dd') === today);
    
    const defaultReport: DailyReport = {
        date: today,
        userId: userId,
        startTime: null,
        endTime: null,
        generatedReport: null,
        goals: 0,
        completed: 0,
        inProgress: 0,
    };
    
    const existingReport = reportSnap.exists() ? reportSnap.data() as DailyReport : defaultReport;

    const updatedReport = {
        ...existingReport,
        goals: todaysTasks.length,
        completed: todaysTasks.filter(t => t.completed).length,
        inProgress: todaysTasks.filter(t => !t.completed).length,
    };

    if (!reportSnap.exists() || JSON.stringify(existingReport) !== JSON.stringify(updatedReport)) {
        setDoc(reportRef, updatedReport, { merge: true }).catch(err => console.error("Error syncing today's report", err));
    }

    return updatedReport;
}

export function updateTodaysReport(db: Firestore, userId: string, updates: Partial<DailyReport>) {
    const today = getToday();
    const reportRef = doc(db, 'users', userId, 'reports', today);

    // This is non-blocking, we just fire and forget.
    getTodaysReport(db, userId).then(currentReport => {
      const newReportData = { ...currentReport, ...updates };
      setDoc(reportRef, newReportData, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: reportRef.path,
          operation: 'write',
          requestResourceData: newReportData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    });
}

// User Profile
export function updateUserProfile(db: Firestore, userId: string, updates: { displayName: string }): void {
  const userRef = doc(db, 'users', userId);
  updateDoc(userRef, updates)
  .catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: updates,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function createUserProfile(db: Firestore, userId: string, data: { email: string | null; displayName: string | null; photoURL: string | null }) {
    const userRef = doc(db, 'users', userId);
    const profileData = {
      id: userId,
      ...data,
    }
    setDoc(userRef, profileData, { merge: true })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
