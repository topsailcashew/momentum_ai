import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjects, addProject, updateProject, deleteProject } from './data-firestore';
import { createMockFirestore, createMockDocumentReference, createMockQuerySnapshot } from '@/test/mocks';
import { mockProject, createMockProject } from '@/test/fixtures';
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
    writeBatch: vi.fn(),
  };
});

// Mock the error handler
vi.mock('./firestore-error-handler', () => ({
  withFirestoreErrorHandling: vi.fn((promise) => promise),
}));

// Mock error emitter
vi.mock('@/firebase/error-emitter', () => ({
  errorEmitter: {
    emit: vi.fn(),
  },
}));

describe('Project CRUD Operations', () => {
  const mockDb = createMockFirestore();
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should retrieve all projects for a user', async () => {
      const mockProjects = [
        { ...mockProject, id: 'project-1' },
        { ...mockProject, id: 'project-2', name: 'Project 2' },
      ];

      const mockSnapshot = createMockQuerySnapshot(mockProjects);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getProjects(mockDb, userId);

      expect(firestore.collection).toHaveBeenCalledWith(mockDb, 'users', userId, 'projects');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('project-1');
      expect(result[1].id).toBe('project-2');
    });

    it('should return empty array when no projects exist', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getProjects(mockDb, userId);

      expect(result).toEqual([]);
    });
  });

  describe('addProject', () => {
    it('should add a new project with userId', async () => {
      const newProjectData = {
        name: 'New Project',
        priority: 'High' as const,
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-project-id';
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await addProject(mockDb, userId, newProjectData);

      expect(firestore.collection).toHaveBeenCalledWith(mockDb, 'users', userId, 'projects');
      expect(firestore.addDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-project-id');
      expect(result.name).toBe('New Project');
      expect(result.priority).toBe('High');
      expect(result.userId).toBe(userId);
    });

    it('should add a project with optional fields', async () => {
      const newProjectData = {
        name: 'Project with Details',
        priority: 'Medium' as const,
        ministryId: 'ministry-1',
        status: 'in-progress' as const,
        description: 'Test description',
        startDate: '2024-01-01',
        dueDate: '2024-12-31',
      };

      const mockDocRef = createMockDocumentReference();
      mockDocRef.id = 'new-project-id';
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await addProject(mockDb, userId, newProjectData);

      expect(result.ministryId).toBe('ministry-1');
      expect(result.status).toBe('in-progress');
      expect(result.description).toBe('Test description');
      expect(result.startDate).toBe('2024-01-01');
      expect(result.dueDate).toBe('2024-12-31');
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const projectId = 'project-123';
      const updates = {
        name: 'Updated Project Name',
        status: 'completed' as const,
      };

      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      await updateProject(mockDb, userId, projectId, updates);

      expect(firestore.doc).toHaveBeenCalledWith(mockDb, 'users', userId, 'projects', projectId);
      expect(firestore.updateDoc).toHaveBeenCalledWith({}, updates);
    });

    it('should handle partial updates', async () => {
      const projectId = 'project-123';
      const updates = { priority: 'Low' as const };

      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      await updateProject(mockDb, userId, projectId, updates);

      expect(firestore.updateDoc).toHaveBeenCalledWith({}, updates);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project and its associated tasks', async () => {
      const projectId = 'project-123';

      const mockTasksSnapshot = createMockQuerySnapshot([
        { id: 'task-1', projectId },
        { id: 'task-2', projectId },
      ]);

      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
        set: vi.fn(),
        update: vi.fn(),
      };

      vi.mocked(firestore.getDocs).mockResolvedValue(mockTasksSnapshot as any);
      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.where).mockReturnValue({} as any);

      await deleteProject(mockDb, userId, projectId);

      expect(firestore.query).toHaveBeenCalled();
      expect(firestore.where).toHaveBeenCalledWith('projectId', '==', projectId);
      expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 2 tasks + 1 project
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should delete a project with no associated tasks', async () => {
      const projectId = 'project-123';

      const mockTasksSnapshot = createMockQuerySnapshot([]);

      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
        set: vi.fn(),
        update: vi.fn(),
      };

      vi.mocked(firestore.getDocs).mockResolvedValue(mockTasksSnapshot as any);
      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.where).mockReturnValue({} as any);

      await deleteProject(mockDb, userId, projectId);

      expect(mockBatch.delete).toHaveBeenCalledTimes(1); // Just the project
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
