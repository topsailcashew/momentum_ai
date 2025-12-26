import type { Task, Project, EnergyLog, MomentumScore, RecurringTask, Ministry } from '@/lib/types';
import type { User } from 'firebase/auth';

/**
 * Test data fixtures for consistent test data across test suites
 */

export const mockUser: User = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async () => ({
    token: 'mock-id-token',
    claims: {},
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    signInProvider: 'password',
    signInSecondFactor: null,
  }),
  reload: async () => {},
  toJSON: () => ({ uid: 'test-user-123' }),
  providerId: 'firebase',
};

export const mockTask: Task = {
  id: 'task-1',
  userId: 'test-user-123',
  name: 'Test Task',
  category: 'work',
  energyLevel: 'Medium',
  completed: false,
  completedAt: null,
  createdAt: new Date().toISOString(),
  priority: 'Important & Not Urgent',
  state: 'ready',
  stateHistory: [],
};

export const mockCompletedTask: Task = {
  ...mockTask,
  id: 'task-2',
  name: 'Completed Task',
  completed: true,
  completedAt: new Date().toISOString(),
};

export const mockProject: Project = {
  id: 'project-1',
  userId: 'test-user-123',
  name: 'Test Project',
  priority: 'High',
  status: 'in-progress',
};

export const mockRecurringTask: RecurringTask = {
  id: 'recurring-1',
  userId: 'test-user-123',
  name: 'Weekly Review',
  frequency: 'Weekly',
  lastCompleted: null,
  createdAt: new Date().toISOString(),
  category: 'personal',
  energyLevel: 'Medium',
  priority: 'Important & Not Urgent',
};

export const mockEnergyLog: EnergyLog = {
  date: new Date().toISOString().split('T')[0],
  level: 'High',
  userId: 'test-user-123',
};

export const mockMomentumScore: MomentumScore = {
  date: new Date().toISOString().split('T')[0],
  score: 85,
  streak: 5,
  summary: 'Great progress today!',
  userId: 'test-user-123',
};

export const mockMinistry: Ministry = {
  id: 'ministry-1',
  userId: 'test-user-123',
  name: 'Test Ministry',
  description: 'A test ministry',
  createdAt: new Date().toISOString(),
};

/**
 * Factory functions for creating test data with overrides
 */

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    ...mockTask,
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    ...mockProject,
    id: `project-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

export function createMockRecurringTask(overrides: Partial<RecurringTask> = {}): RecurringTask {
  return {
    ...mockRecurringTask,
    id: `recurring-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}
