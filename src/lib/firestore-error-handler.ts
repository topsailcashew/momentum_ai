/**
 * @fileOverview Firestore error handling utilities to reduce code duplication
 */

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type FirestoreOperation = 'create' | 'update' | 'delete' | 'write' | 'read';

interface ErrorHandlerOptions {
  path: string;
  operation: FirestoreOperation;
  requestResourceData?: any;
}

/**
 * Wraps a Firestore operation promise with standardized error handling.
 * Converts Firestore errors to FirestorePermissionError and emits them to the error emitter.
 *
 * @param promise - The Firestore operation promise to wrap
 * @param options - Error handling configuration
 * @returns The result of the promise if successful
 * @throws {FirestorePermissionError} If the operation fails
 *
 * @example
 * const docRef = await withFirestoreErrorHandling(
 *   addDoc(collection, data),
 *   { path: collection.path, operation: 'create', requestResourceData: data }
 * );
 */
export async function withFirestoreErrorHandling<T>(
  promise: Promise<T>,
  options: ErrorHandlerOptions
): Promise<T> {
  try {
    return await promise;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: options.path,
      operation: options.operation,
      requestResourceData: options.requestResourceData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
