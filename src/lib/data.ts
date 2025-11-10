'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Task, Category, EnergyLog, MomentumScore, EnergyLevel, Project } from './types';
import { format } from 'date-fns';

const dataDir = path.join(process.cwd(), 'src', 'data');

async function readData<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]', 'utf-8');
      return [] as T;
    }
    console.error(`Error reading or creating ${filename}:`, error);
    throw error;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
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
