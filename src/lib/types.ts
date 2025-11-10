export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  name: string;
  category: string;
  energyLevel: EnergyLevel;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  projectId?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface EnergyLog {
  date: string; // YYYY-MM-DD
  level: EnergyLevel;
}

export interface MomentumScore {
  date: string; // YYYY-MM-DD
  score: number;
  streak: number;
  summary: string;
}

export interface Project {
    id: string;
    name: string;
}
