import { vi } from 'vitest';
import type { Firestore, DocumentReference, CollectionReference, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';

/**
 * Mock factories for Firebase services
 */

export function createMockFirestore(): Firestore {
  return {
    type: 'firestore',
    app: {} as any,
    toJSON: () => ({}),
  } as Firestore;
}

export function createMockDocumentReference<T = any>(data?: T): DocumentReference<T> {
  return {
    id: `doc-${Math.random().toString(36).substr(2, 9)}`,
    path: 'mock/path',
    firestore: createMockFirestore(),
    parent: {} as any,
    type: 'document',
    converter: null,
    withConverter: vi.fn().mockReturnThis(),
  } as unknown as DocumentReference<T>;
}

export function createMockCollectionReference<T = any>(): CollectionReference<T> {
  return {
    id: `collection-${Math.random().toString(36).substr(2, 9)}`,
    path: 'mock/collection',
    firestore: createMockFirestore(),
    parent: null,
    type: 'collection',
    converter: null,
    withConverter: vi.fn().mockReturnThis(),
  } as unknown as CollectionReference<T>;
}

export function createMockDocumentSnapshot<T = any>(
  data: T | undefined,
  exists = true
): DocumentSnapshot<T> {
  return {
    id: `doc-${Math.random().toString(36).substr(2, 9)}`,
    ref: createMockDocumentReference<T>(),
    exists: () => exists,
    data: () => data,
    get: (field: string) => (data as any)?.[field],
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: vi.fn(),
    },
  } as unknown as DocumentSnapshot<T>;
}

export function createMockQuerySnapshot<T = any>(docs: T[]): QuerySnapshot<T> {
  const mockDocs = docs.map((data, index) =>
    createMockDocumentSnapshot<T>(data, true)
  );

  return {
    docs: mockDocs,
    size: mockDocs.length,
    empty: mockDocs.length === 0,
    forEach: (callback: any) => mockDocs.forEach(callback),
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: vi.fn(),
    },
    query: {} as any,
    docChanges: vi.fn().mockReturnValue([]),
  } as unknown as QuerySnapshot<T>;
}

/**
 * Creates a mock Firestore instance with common methods
 */
export function createMockFirestoreWithMethods() {
  const mockFirestore = createMockFirestore();

  return {
    firestore: mockFirestore,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
  };
}

/**
 * Helper to setup common Firestore mocks
 */
export function setupFirestoreMocks() {
  const mocks = createMockFirestoreWithMethods();

  // Setup default implementations
  mocks.collection.mockReturnValue(createMockCollectionReference());
  mocks.doc.mockReturnValue(createMockDocumentReference());
  mocks.getDocs.mockResolvedValue(createMockQuerySnapshot([]));
  mocks.getDoc.mockResolvedValue(createMockDocumentSnapshot(undefined, false));
  mocks.addDoc.mockResolvedValue(createMockDocumentReference());
  mocks.setDoc.mockResolvedValue(undefined);
  mocks.updateDoc.mockResolvedValue(undefined);
  mocks.deleteDoc.mockResolvedValue(undefined);

  return mocks;
}
