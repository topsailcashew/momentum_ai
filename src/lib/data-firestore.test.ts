import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, addTask, updateTask, deleteTask, getCategories } from './data-firestore';
import { createMockFirestore, createMockDocumentReference, createMockQuerySnapshot } from '@/test/mocks';
import { mockTask, createMockTask } from '@/test/fixtures';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

// Mock the error handler
vi.mock('./firestore-error-handler', () => ({
  withFirestoreErrorHandling: vi.fn((promise) => promise),
}));

describe('Task CRUD Operations', () => {
  const mockDb = createMockFirestore();
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should retrieve all tasks for a user', async () => {
      const mockTasks = [
        { ...mockTask, id: 'task-1' },
        { ...mockTask, id: 'task-2', name: 'Task 2' },
      ];

      const mockSnapshot = createMockQuerySnapshot(mockTasks);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getTasks(mockDb, userId);

      expect(firestore.collection).toHaveBeenCalledWith(mockDb, 'users', userId, 'tasks');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-1');
      expect(result[1].id).toBe('task-2');
    });

    it('should return empty array when no tasks exist', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getTasks(mockDb, userId);

      expect(result).toEqual([]);
    });
  });

  describe('addTask', () => {
    it('should add a new task with default values', async () => {
      const newTaskData = {
        name: 'New Task',
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-task-id';
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await addTask(mockDb, userId, newTaskData);

      expect(firestore.collection).toHaveBeenCalledWith(mockDb, 'users', userId, 'tasks');
      expect(firestore.addDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-task-id');
      expect(result.name).toBe('New Task');
      expect(result.completed).toBe(false);
      expect(result.userId).toBe(userId);
      expect(result.category).toBe('personal');
      expect(result.energyLevel).toBe('Medium');
      expect(result.priority).toBe('Important & Not Urgent');
      expect(result.state).toBe('ready');
      expect(result.createdAt).toBeDefined();
    });

    it('should add a task with custom values', async () => {
      const newTaskData = {
        name: 'Custom Task',
        category: 'work',
        energyLevel: 'High' as const,
        priority: 'Urgent & Important' as const,
        projectId: 'project-1',
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-task-id';
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await addTask(mockDb, userId, newTaskData);

      expect(result.name).toBe('Custom Task');
      expect(result.category).toBe('work');
      expect(result.energyLevel).toBe('High');
      expect(result.priority).toBe('Urgent & Important');
      expect(result.projectId).toBe('project-1');
    });

    it('should filter out undefined values before saving', async () => {
      const newTaskData = {
        name: 'Test Task',
        projectId: undefined,
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-task-id';

      let capturedData: any;
      vi.mocked(firestore.addDoc).mockImplementation(async (collection, data) => {
        capturedData = data;
        return mockDocRef as any;
      });
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      await addTask(mockDb, userId, newTaskData);

      expect(capturedData).toBeDefined();
      expect('projectId' in capturedData).toBe(false);
    });

    it('should include state and stateHistory', async () => {
      const newTaskData = {
        name: 'Task with State',
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-task-id';
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await addTask(mockDb, userId, newTaskData);

      expect(result.state).toBe('ready');
      expect(result.stateHistory).toEqual([]);
    });
  });

  describe('updateTask', () => {
    it('should update task fields', async () => {
      const taskId = 'task-123';
      const updates = {
        name: 'Updated Task Name',
        completed: true,
        completedAt: new Date().toISOString(),
      };

      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      await updateTask(mockDb, userId, taskId, updates);

      expect(firestore.doc).toHaveBeenCalledWith(mockDb, 'users', userId, 'tasks', taskId);
      expect(firestore.updateDoc).toHaveBeenCalledWith({}, updates);
    });

    it('should handle partial updates', async () => {
      const taskId = 'task-123';
      const updates = { name: 'Just updating name' };

      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      await updateTask(mockDb, userId, taskId, updates);

      expect(firestore.updateDoc).toHaveBeenCalledWith({}, updates);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const taskId = 'task-123';

      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      await deleteTask(mockDb, userId, taskId);

      expect(firestore.doc).toHaveBeenCalledWith(mockDb, 'users', userId, 'tasks', taskId);
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });
  });
});

describe('Category Functions', () => {
  describe('getCategories', () => {
    it('should return static categories', () => {
      const categories = getCategories();

      expect(categories).toHaveLength(5);
      expect(categories).toEqual([
        { id: 'work', name: 'Work' },
        { id: 'personal', name: 'Personal' },
        { id: 'learning', name: 'Learning' },
        { id: 'health', name: 'Health' },
        { id: 'chore', name: 'Chore' },
      ]);
    });

    it('should return the same reference on multiple calls', () => {
      const categories1 = getCategories();
      const categories2 = getCategories();

      expect(categories1).toBe(categories2);
    });
  });
});
