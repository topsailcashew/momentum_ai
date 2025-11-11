import {
  Firestore,
  FieldValue,
} from 'firebase-admin/firestore';
import type { Task, Category, EnergyLog, MomentumScore, EnergyLevel, Project, RecurringTask, DailyReport } from './types';
import { format } from 'date-fns';

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
  const tasksCol = db.collection('users').doc(userId).collection('tasks');
  const taskSnapshot = await tasksCol.get();
  const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  return taskList;
}

export async function addTask(db: Firestore, userId: string, taskData: Omit<Task, 'id' | 'userId' | 'completed' | 'completedAt' | 'createdAt'>): Promise<Task> {
    const tasksCol = db.collection('users').doc(userId).collection('tasks');

    const newTaskData = {
        ...taskData,
        userId,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
    };

    const docRef = await tasksCol.add(newTaskData);
    return { id: docRef.id, ...newTaskData };
}

export async function deleteTask(db: Firestore, userId: string, taskId: string): Promise<void> {
    const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);
    await taskRef.delete();
}

// Category Functions
export function getCategories(): Category[] {
  return categories;
}

// Energy Log Functions
export async function getEnergyLog(db: Firestore, userId: string): Promise<EnergyLog[]> {
    const logCol = db.collection('users').doc(userId).collection('energy-log');
    const logSnapshot = await logCol.get();
    return logSnapshot.docs.map(doc => doc.data() as EnergyLog);
}

export async function setTodayEnergy(db: Firestore, userId: string, level: EnergyLevel): Promise<void> {
    const today = getToday();
    const logRef = db.collection('users').doc(userId).collection('energy-log').doc(today);
    const newLog: EnergyLog = { date: today, level, userId };
    await logRef.set(newLog, { merge: true });
}

export async function getTodayEnergy(db: Firestore, userId: string): Promise<EnergyLog | undefined> {
    const today = getToday();
    const logRef = db.collection('users').doc(userId).collection('energy-log').doc(today);
    const docSnap = await logRef.get();
    return docSnap.exists ? docSnap.data() as EnergyLog : undefined;
}

// Momentum Score Functions
export async function getMomentumHistory(db: Firestore, userId: string): Promise<MomentumScore[]> {
    const momentumCol = db.collection('users').doc(userId).collection('momentum');
    const q = momentumCol.orderBy('date', 'desc');
    const momentumSnapshot = await q.get();
    return momentumSnapshot.docs.map(doc => doc.data() as MomentumScore);
}

export async function getLatestMomentum(db: Firestore, userId: string): Promise<MomentumScore | undefined> {
    const momentumCol = db.collection('users').doc(userId).collection('momentum');
    const q = momentumCol.orderBy('date', 'desc').limit(1);
    const snapshot = await q.get();
    if (snapshot.empty) {
        return undefined;
    }
    return snapshot.docs[0].data() as MomentumScore;
}

export async function saveMomentumScore(db: Firestore, userId: string, scoreData: Omit<MomentumScore, 'date' | 'userId'>): Promise<void> {
    const today = getToday();
    const momentumRef = db.collection('users').doc(userId).collection('momentum').doc(today);
    const newScore: MomentumScore = { ...scoreData, date: today, userId };
    await momentumRef.set(newScore, { merge: true });
}

// Project Functions
export async function getProjects(db: Firestore, userId: string): Promise<Project[]> {
    const projectsCol = db.collection('users').doc(userId).collection('projects');
    const projectSnapshot = await projectsCol.get();
    return projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function addProject(db: Firestore, userId: string, projectData: Omit<Project, 'id' | 'userId'>): Promise<Project> {
    const projectsCol = db.collection('users').doc(userId).collection('projects');
    const dataWithUserId = { ...projectData, userId };
    const docRef = await projectsCol.add(dataWithUserId);
    return { id: docRef.id, ...dataWithUserId };
}

export async function updateProject(db: Firestore, userId: string, projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = db.collection('users').doc(userId).collection('projects').doc(projectId);
    await projectRef.update(updates);
}

export async function deleteProject(db: Firestore, userId: string, projectId: string) {
    const projectRef = db.collection('users').doc(userId).collection('projects').doc(projectId);

    const tasksCol = db.collection('users').doc(userId).collection('tasks');
    const q = tasksCol.where('projectId', '==', projectId);

    try {
        const tasksSnapshot = await q.get();
        const batch = db.batch();
        tasksSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(projectRef);
        await batch.commit();
    } catch(e) {
        console.error("Failed to delete project and its tasks", e);
        throw e;
    }
}

// Recurring Task Functions
export async function getRecurringTasks(db: Firestore, userId: string): Promise<RecurringTask[]> {
  const tasksCol = db.collection('users').doc(userId).collection('recurring-tasks');
  const snapshot = await tasksCol.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask));
}

export async function addRecurringTask(db: Firestore, userId: string, taskData: Omit<RecurringTask, 'id' | 'lastCompleted' | 'userId'>): Promise<RecurringTask> {
    const tasksCol = db.collection('users').doc(userId).collection('recurring-tasks');
    const newTaskData = { ...taskData, lastCompleted: null, userId };
    const docRef = await tasksCol.add(newTaskData);
    return { id: docRef.id, ...newTaskData };
}

export async function updateRecurringTask(db: Firestore, userId: string, taskId: string, updates: Partial<Omit<RecurringTask, 'id'>>): Promise<void> {
    const taskRef = db.collection('users').doc(userId).collection('recurring-tasks').doc(taskId);
    await taskRef.update(updates);
}

// Report Functions
export async function getReports(db: Firestore, userId: string): Promise<DailyReport[]> {
    const reportsCol = db.collection('users').doc(userId).collection('reports');
    const snapshot = await reportsCol.orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => doc.data() as DailyReport);
}

export async function getTodaysReport(db: Firestore, userId: string): Promise<DailyReport> {
    const today = getToday();
    const reportRef = db.collection('users').doc(userId).collection('reports').doc(today);
    const reportSnap = await reportRef.get();

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

    const existingReport = reportSnap.exists ? reportSnap.data() as DailyReport : defaultReport;

    const updatedReport = {
        ...existingReport,
        goals: todaysTasks.length,
        completed: todaysTasks.filter(t => t.completed).length,
        inProgress: todaysTasks.filter(t => !t.completed).length,
    };

    if (!reportSnap.exists || JSON.stringify(existingReport) !== JSON.stringify(updatedReport)) {
        await reportRef.set(updatedReport, { merge: true });
    }

    return updatedReport;
}

export async function updateTodaysReport(db: Firestore, userId: string, updates: Partial<DailyReport>): Promise<DailyReport> {
    const today = getToday();
    const reportRef = db.collection('users').doc(userId).collection('reports').doc(today);

    const currentReport = await getTodaysReport(db, userId);
    const newReportData = { ...currentReport, ...updates };
    await reportRef.set(newReportData, { merge: true });
    return newReportData;
}

// User Profile
export async function updateUserProfile(db: Firestore, userId: string, updates: { displayName: string }): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  await userRef.update(updates);
}

export async function createUserProfile(db: Firestore, userId: string, data: { email: string | null; displayName: string | null; photoURL: string | null }): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    const profileData = {
      id: userId,
      ...data,
    }
    await userRef.set(profileData, { merge: true });
}
