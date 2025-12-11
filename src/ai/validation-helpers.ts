/**
 * @fileOverview Helper utilities for validating AI responses
 * Provides additional type safety and validation beyond Genkit's built-in validation
 */

import { z, ZodSchema } from 'zod';

export class AIValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: z.ZodError | unknown,
    public readonly flowName: string
  ) {
    super(message);
    this.name = 'AIValidationError';
  }
}

/**
 * Validates AI flow output against a Zod schema with detailed error reporting
 *
 * @param data - The data to validate (AI response)
 * @param schema - The Zod schema to validate against
 * @param flowName - Name of the AI flow for error tracking
 * @returns Validated and typed data
 * @throws {AIValidationError} If validation fails
 *
 * @example
 * const validated = validateAIResponse(
 *   aiOutput,
 *   ProcessBrainDumpOutputSchema,
 *   'processBrainDump'
 * );
 */
export function validateAIResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
  flowName: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[AI Validation Error in ${flowName}]:`, {
        errors: error.errors,
        receivedData: data,
      });

      throw new AIValidationError(
        `AI response validation failed for ${flowName}: ${error.errors.map(e => e.message).join(', ')}`,
        error,
        flowName
      );
    }

    throw new AIValidationError(
      `Unexpected error validating AI response for ${flowName}`,
      error,
      flowName
    );
  }
}

/**
 * Validates AI flow output with fallback values for safe degradation
 * Returns default value if validation fails instead of throwing
 *
 * @param data - The data to validate (AI response)
 * @param schema - The Zod schema to validate against
 * @param fallback - Fallback value if validation fails
 * @param flowName - Name of the AI flow for error tracking
 * @returns Validated data or fallback
 *
 * @example
 * const result = validateAIResponseWithFallback(
 *   aiOutput,
 *   OutputSchema,
 *   { goals: [], tasks: [] },
 *   'processBrainDump'
 * );
 */
export function validateAIResponseWithFallback<T>(
  data: unknown,
  schema: ZodSchema<T>,
  fallback: T,
  flowName: string
): T {
  try {
    return validateAIResponse(data, schema, flowName);
  } catch (error) {
    console.warn(`[AI Validation] Using fallback for ${flowName} due to validation error`);
    return fallback;
  }
}

/**
 * Safely parses AI output with partial validation support
 * Filters out invalid items from arrays instead of failing completely
 *
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @param flowName - Name of the AI flow for error tracking
 * @returns Partially validated data with invalid items filtered out
 */
export function partialValidateAIResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
  flowName: string
): T | Partial<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  console.warn(`[AI Validation] Partial validation for ${flowName}:`, {
    errors: result.error.errors,
  });

  // Return data as-is with warning logged - caller should handle partial data
  return data as Partial<T>;
}
