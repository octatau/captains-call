/**
 * Structured error responses for API validation
 *
 * Provides consistent error formatting with field-level details.
 */

import { json } from '@sveltejs/kit';
import type { ZodError } from 'zod';

/**
 * Field-level validation error
 */
export interface FieldError {
	field: string;
	message: string;
}

/**
 * Structured API error response
 */
export interface ValidationErrorResponse {
	success: false;
	error: string;
	field_errors?: FieldError[];
}

/**
 * Convert a ZodError into a structured API error response
 *
 * @param zodError - The Zod validation error
 * @returns JSON response with status 400
 */
export function formatValidationError(zodError: ZodError) {
	// Zod v4 uses 'issues' instead of 'errors'
	const fieldErrors: FieldError[] = zodError.issues.map((issue) => ({
		field: issue.path.join('.') || 'request',
		message: issue.message
	}));

	// Use the first error message as the primary error
	const primaryError = fieldErrors[0]?.message || 'Validation failed';

	const response: ValidationErrorResponse = {
		success: false,
		error: primaryError,
		field_errors: fieldErrors.length > 1 ? fieldErrors : undefined
	};

	return json(response, { status: 400 });
}

/**
 * Create a simple error response (for non-validation errors)
 */
export function createErrorResponse(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}
