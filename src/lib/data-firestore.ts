
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

export async function addTask(db: Firestore, userId: string, taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>): Promise<Task> {
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const newTaskData = {
        ...taskData,
        completed: false,
        completedAt: null,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(tasksCol, newTaskData).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: tasksCol.path,
            operation: 'create',
            requestResourceData: newTaskData,
        }));
        throw serverError; // Re-throw to allow promise to reject
    });

    return { ...taskData, id: docRef.id, completed: false, completedAt: null, createdAt: new Date().toISOString() };
}

export async function updateTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, updates).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: taskRef.path,
            operation: 'update',
            requestResourceData: updates,
        }));
        throw serverError;
    });
    const updatedDoc = await getDoc(taskRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Task;
}

export async function deleteTask(db: Firestore, userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: taskRef.path,
            operation: 'delete',
        }));
        throw serverError;
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

export async function setTodayEnergy(db: Firestore, userId: string, level: EnergyLevel): Promise<EnergyLog> {
    const today = getToday();
    const logRef = doc(db, 'users', userId, 'energy-log', today);
    const newLog: EnergyLog = { date: today, level };

    await setDoc(logRef, newLog, { merge: true }).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: logRef.path,
            operation: 'write',
            requestResourceData: newLog,
        }));
        throw serverError;
    });
    return newLog;
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

export async function saveMomentumScore(db: Firestore, userId: string, scoreData: Omit<MomentumScore, 'date'>): Promise<MomentumScore> {
    const today = getToday();
    const momentumRef = doc(db, 'users', userId, 'momentum', today);
    const newScore: MomentumScore = { ...scoreData, date: today };

    await setDoc(momentumRef, newScore, { merge: true }).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: momentumRef.path,
            operation: 'write',
            requestResourceData: newScore,
        }));
        throw serverError;
    });

    return newScore;
}

// Project Functions
export async function getProjects(db: Firestore, userId: string): Promise<Project[]> {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    return projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function addProject(db: Firestore, userId: string, projectData: Omit<Project, 'id'>): Promise<Project> {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const docRef = await addDoc(projectsCol, projectData).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: projectsCol.path,
            operation: 'create',
            requestResourceData: projectData,
        }));
        throw serverError;
    });
    return { ...projectData, id: docRef.id };
}

export async function updateProject(db: Firestore, userId: string, projectId: string, updates: Partial<Project>): Promise<Project | undefined> {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await updateDoc(projectRef, updates).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: projectRef.path,
            operation: 'update',
            requestResourceData: updates,
        }));
        throw serverError;
    });
    const updatedDoc = await getDoc(projectRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Project;
}

export async function deleteProject(db: Firestore, userId: string, projectId: string): Promise<void> {
    // Note: This doesn't delete sub-collections of tasks in a real scenario.
    // For this app's logic, we filter tasks in the client/server actions.
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: projectRef.path,
            operation: 'delete',
        }));
        throw serverError;
    });

    // Also delete tasks associated with the project
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const q = query(tasksCol, where('projectId', '==', projectId));
    const tasksSnapshot = await getDocs(q);
    const batch = writeBatch(db);
    tasksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


// Recurring Task Functions
export async function getRecurringTasks(db: Firestore, userId: string): Promise<RecurringTask[]> {
  const tasksCol = collection(db, 'users', userId, 'recurring-tasks');
  const snapshot = await getDocs(tasksCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask));
}

export async function addRecurringTask(db: Firestore, userId: string, taskData: Omit<RecurringTask, 'id' | 'lastCompleted'>): Promise<RecurringTask> {
    const tasksCol = collection(db, 'users', userId, 'recurring-tasks');
    const newTaskData = { ...taskData, lastCompleted: null };
    const docRef = await addDoc(tasksCol, newTaskData).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: tasksCol.path,
            operation: 'create',
            requestResourceData: newTaskData,
        }));
        throw serverError;
    });
    return { id: docRef.id, ...newTaskData };
}

export async function updateRecurringTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<RecurringTask, 'id'>>): Promise<RecurringTask | undefined> {
    const taskRef = doc(db, 'users', userId, 'recurring-tasks', taskId);
    await updateDoc(taskRef, updates).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: taskRef.path,
            operation: 'update',
            requestResourceData: updates,
        }));
        throw serverError;
    });
    const updatedDoc = await getDoc(taskRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as RecurringTask;
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
        await setDoc(reportRef, updatedReport, { merge: true }).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: reportRef.path,
                operation: 'write',
                requestResourceData: updatedReport,
            }));
            // Don't throw, we can continue with the stale data
        });
    }

    return updatedReport;
}

export async function updateTodaysReport(db: Firestore, userId: string, updates: Partial<DailyReport>): Promise<DailyReport> {
    const today = getToday();
    const todaysReport = await getTodaysReport(db, userId); // Ensures we have the latest stats
    const reportRef = doc(db, 'users', userId, 'reports', today);

    const newReportData = { ...todaysReport, ...updates };

    await setDoc(reportRef, newReportData, { merge: true }).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: reportRef.path,
            operation: 'write',
            requestResourceData: newReportData,
        }));
        throw serverError;
    });
    
    return newReportData;
}
