'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Task, Category, EnergyLog, MomentumScore, EnergyLevel, Project, RecurringTask, DailyReport } from './types';
import { format } from 'date-fns';

const dataDir = path.join(process.cwd(), 'data');

async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      const defaultData = filename === 'reports.json' ? {} : [];
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData as T;
    }
    console.error(`Error reading or creating ${filename}:`, error);
    throw error;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

const getToday = () => format(new Date(), 'yyyy-MM-dd');

// Task Functions
export async function getTasks(): Promise<Task[]> {
  return readData<Task[]>('tasks.json');
}

export async function addTask(taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt'>): Promise<Task> {
  const tasks = await getTasks();
  const newTask: Task = {
    ...taskData,
    id: Date.now().toString(),
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  await writeData('tasks.json', tasks);
  return newTask;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | undefined> {
  const tasks = await getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return undefined;

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  await writeData('tasks.json', tasks);
  return tasks[taskIndex];
}

export async function deleteTask(taskId: string): Promise<void> {
    const tasks = await getTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await writeData('tasks.json', updatedTasks);
}

// Category Functions
export async function getCategories(): Promise<Category[]> {
  return readData<Category[]>('categories.json');
}

// Energy Log Functions
export async function getEnergyLog(): Promise<EnergyLog[]> {
    return readData<EnergyLog[]>('energy-log.json');
}

export async function setTodayEnergy(level: EnergyLevel): Promise<EnergyLog> {
  const logs = await getEnergyLog();
  const today = getToday();
  const todayLogIndex = logs.findIndex(log => log.date === today);

  let newLog: EnergyLog;
  if (todayLogIndex > -1) {
    logs[todayLogIndex].level = level;
    newLog = logs[todayLogIndex];
  } else {
    newLog = { date: today, level };
    logs.push(newLog);
  }
  await writeData('energy-log.json', logs);
  return newLog;
}

export async function getTodayEnergy(): Promise<EnergyLog | undefined> {
    const logs = await getEnergyLog();
    const today = getToday();
    return logs.find(log => log.date === today);
}


// Momentum Score Functions
export async function getMomentumHistory(): Promise<MomentumScore[]> {
    return readData<MomentumScore[]>('momentum.json');
}

export async function getLatestMomentum(): Promise<MomentumScore | undefined> {
    const history = await getMomentumHistory();
    return history.sort((a, b) => b.date.localeCompare(a.date))[0];
}

export async function saveMomentumScore(scoreData: Omit<MomentumScore, 'date'>): Promise<MomentumScore> {
    const history = await getMomentumHistory();
    const today = getToday();
    const todayScoreIndex = history.findIndex(s => s.date === today);
    
    const newScore: MomentumScore = {
        ...scoreData,
        date: today,
    };
    
    if (todayScoreIndex > -1) {
        history[todayScoreIndex] = newScore;
    } else {
        history.push(newScore);
    }
    
    await writeData('momentum.json', history);
    return newScore;
}

// Project Functions
export async function getProjects(): Promise<Project[]> {
    return readData<Project[]>('projects.json');
}

export async function addProject(projectData: Omit<Project, 'id'>): Promise<Project> {
    const projects = await getProjects();
    const newProject: Project = {
        ...projectData,
        id: Date.now().toString(),
    };
    projects.push(newProject);
    await writeData('projects.json', projects);
    return newProject;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project | undefined> {
    const projects = await getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return undefined;

    projects[projectIndex] = { ...projects[projectIndex], ...updates };
    await writeData('projects.json', projects);
    return projects[projectIndex];
}

export async function deleteProject(projectId: string): Promise<void> {
    const projects = await getProjects();
    const updatedProjects = projects.filter(p => p.id !== projectId);
    await writeData('projects.json', updatedProjects);

    // Also delete tasks associated with the project
    const tasks = await getTasks();
    const updatedTasks = tasks.filter(t => t.projectId !== projectId);
    await writeData('tasks.json', updatedTasks);
}

// Recurring Task Functions
export async function getRecurringTasks(): Promise<RecurringTask[]> {
  return readData<RecurringTask[]>('recurring-tasks.json');
}

export async function addRecurringTask(taskData: Omit<RecurringTask, 'id' | 'lastCompleted'>): Promise<RecurringTask> {
  const tasks = await getRecurringTasks();
  const newTask: RecurringTask = {
    ...taskData,
    id: Date.now().toString(),
    lastCompleted: null,
  };
  tasks.push(newTask);
  await writeData('recurring-tasks.json', tasks);
  return newTask;
}

export async function updateRecurringTask(taskId: string, updates: Partial<RecurringTask>): Promise<RecurringTask | undefined> {
  const tasks = await getRecurringTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return undefined;

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  await writeData('recurring-tasks.json', tasks);
  return tasks[taskIndex];
}

// Report Functions
export async function getReports(): Promise<Record<string, DailyReport>> {
    return readData<Record<string, DailyReport>>('reports.json');
}

export async function getTodaysReport(): Promise<DailyReport> {
    const reports = await getReports();
    const today = getToday();
    if (!reports[today]) {
        const tasks = await getTasks();
        const todaysTasks = tasks.filter(t => t.createdAt && format(new Date(t.createdAt), 'yyyy-MM-dd') === today);
        reports[today] = {
            date: today,
            startTime: null,
            endTime: null,
            generatedReport: null,
            goals: todaysTasks.length,
            completed: todaysTasks.filter(t => t.completed).length,
            inProgress: todaysTasks.filter(t => !t.completed).length,
        };
        await writeData('reports.json', reports);
    } else {
        // Recalculate stats in case tasks were added/completed
        const tasks = await getTasks();
        const todaysTasks = tasks.filter(t => t.createdAt && format(new Date(t.createdAt), 'yyyy-MM-dd') === today);
        reports[today].goals = todaysTasks.length;
        reports[today].completed = todaysTasks.filter(t => t.completed).length;
        reports[today].inProgress = todaysTasks.filter(t => !t.completed).length;
    }
    return reports[today];
}

export async function updateTodaysReport(updates: Partial<DailyReport>): Promise<DailyReport> {
    const reports = await getReports();
    const today = getToday();
    const todaysReport = await getTodaysReport();

    reports[today] = { ...todaysReport, ...updates };
    await writeData('reports.json', reports);
    return reports[today];
}
