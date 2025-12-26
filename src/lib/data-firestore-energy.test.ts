import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEnergyLog, setTodayEnergy, getTodayEnergy, getLatestMomentum, saveMomentumScore } from './data-firestore';
import { createMockFirestore, createMockDocumentSnapshot, createMockQuerySnapshot } from '@/test/mocks';
import { mockEnergyLog, mockMomentumScore } from '@/test/fixtures';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

// Mock the error handler
vi.mock('./firestore-error-handler', () => ({
  withFirestoreErrorHandling: vi.fn((promise) => promise),
}));

describe('Energy Log Operations', () => {
  const mockDb = createMockFirestore();
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnergyLog', () => {
    it('should retrieve all energy logs for a user', async () => {
      const mockLogs = [
        { ...mockEnergyLog, date: '2024-01-01', level: 'High' as const },
        { ...mockEnergyLog, date: '2024-01-02', level: 'Medium' as const },
      ];

      const mockSnapshot = createMockQuerySnapshot(mockLogs);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getEnergyLog(mockDb, userId);

      expect(firestore.collection).toHaveBeenCalledWith(mockDb, 'users', userId, 'energy-log');
      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('High');
      expect(result[1].level).toBe('Medium');
    });

    it('should return empty array when no logs exist', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);

      const result = await getEnergyLog(mockDb, userId);

      expect(result).toEqual([]);
    });
  });

  describe('setTodayEnergy', () => {
    it('should set energy level for today', async () => {
      const energyLevel = 'High' as const;

      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);

      await setTodayEnergy(mockDb, userId, energyLevel);

      expect(firestore.doc).toHaveBeenCalled();
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          level: 'High',
          userId,
        }),
        { merge: true }
      );
    });

    it('should use current date for the log entry', async () => {
      const energyLevel = 'Medium' as const;
      let capturedData: any;

      vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
        capturedData = data;
        return undefined as any;
      });
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);

      await setTodayEnergy(mockDb, userId, energyLevel);

      expect(capturedData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });

  describe('getTodayEnergy', () => {
    it('should retrieve today\'s energy log if it exists', async () => {
      const mockLog = { ...mockEnergyLog, level: 'High' as const };
      const mockSnapshot = createMockDocumentSnapshot(mockLog, true);

      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      const result = await getTodayEnergy(mockDb, userId);

      expect(result).toBeDefined();
      expect(result?.level).toBe('High');
    });

    it('should return undefined if no energy log exists for today', async () => {
      const mockSnapshot = createMockDocumentSnapshot(undefined, false);

      vi.mocked(firestore.getDoc).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.doc).mockReturnValue({} as any);

      const result = await getTodayEnergy(mockDb, userId);

      expect(result).toBeUndefined();
    });
  });
});

describe('Momentum Score Operations', () => {
  const mockDb = createMockFirestore();
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLatestMomentum', () => {
    it('should retrieve the latest momentum score', async () => {
      const mockScore = { ...mockMomentumScore, score: 85, streak: 5 };
      const mockSnapshot = createMockQuerySnapshot([mockScore]);

      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.orderBy).mockReturnValue({} as any);
      vi.mocked(firestore.limit).mockReturnValue({} as any);

      const result = await getLatestMomentum(mockDb, userId);

      expect(firestore.orderBy).toHaveBeenCalledWith('date', 'desc');
      expect(firestore.limit).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
      expect(result?.score).toBe(85);
      expect(result?.streak).toBe(5);
    });

    it('should return undefined if no momentum scores exist', async () => {
      const mockSnapshot = {
        ...createMockQuerySnapshot([]),
        empty: true,
      };

      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.orderBy).mockReturnValue({} as any);
      vi.mocked(firestore.limit).mockReturnValue({} as any);

      const result = await getLatestMomentum(mockDb, userId);

      expect(result).toBeUndefined();
    });
  });

  describe('saveMomentumScore', () => {
    it('should save a momentum score for today', async () => {
      const scoreData = {
        score: 90,
        streak: 7,
        summary: 'Amazing progress!',
      };

      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);

      await saveMomentumScore(mockDb, userId, scoreData);

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: 90,
          streak: 7,
          summary: 'Amazing progress!',
          userId,
        }),
        { merge: true }
      );
    });

    it('should use current date for the score', async () => {
      const scoreData = {
        score: 75,
        streak: 3,
        summary: 'Good work!',
      };

      let capturedData: any;
      vi.mocked(firestore.setDoc).mockImplementation(async (ref, data) => {
        capturedData = data;
        return undefined as any;
      });
      vi.mocked(firestore.doc).mockReturnValue({ path: 'test/path' } as any);

      await saveMomentumScore(mockDb, userId, scoreData);

      expect(capturedData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });
});
