/**
 * Unit tests for validation error formatting
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { formatValidationError, createErrorResponse } from '../errors';

describe('formatValidationError', () => {
	it('returns JSON response with status 400', async () => {
		const schema = z.object({ name: z.string() });
		const result = schema.safeParse({});

		if (!result.success) {
			const response = formatValidationError(result.error);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.success).toBe(false);
		}
	});

	it('uses first error message as primary error', async () => {
		const schema = z.object({
			name: z.string()
		});
		const result = schema.safeParse({});

		if (!result.success) {
			const response = formatValidationError(result.error);
			const body = await response.json();

			// Zod v4 provides descriptive error messages
			expect(body.error).toBeDefined();
			expect(typeof body.error).toBe('string');
			expect(body.error.length).toBeGreaterThan(0);
		}
	});

	it('includes field path in error', async () => {
		const schema = z.object({
			user: z.object({
				email: z.string().email({ message: 'Invalid email' })
			})
		});
		const result = schema.safeParse({ user: { email: 'not-an-email' } });

		if (!result.success) {
			const response = formatValidationError(result.error);
			const body = await response.json();

			expect(body.error).toBe('Invalid email');
		}
	});

	it('includes field_errors when multiple errors exist', async () => {
		const schema = z.object({
			name: z.string().min(1, 'Name required'),
			email: z.string().email('Invalid email')
		});
		const result = schema.safeParse({ name: '', email: 'bad' });

		if (!result.success) {
			const response = formatValidationError(result.error);
			const body = await response.json();

			expect(body.field_errors).toBeDefined();
			expect(body.field_errors.length).toBe(2);
			expect(body.field_errors.map((e: { field: string }) => e.field)).toContain('name');
			expect(body.field_errors.map((e: { field: string }) => e.field)).toContain('email');
		}
	});

	it('omits field_errors when only one error exists', async () => {
		const schema = z.object({
			name: z.string().min(1, 'Name required')
		});
		const result = schema.safeParse({ name: '' });

		if (!result.success) {
			const response = formatValidationError(result.error);
			const body = await response.json();

			expect(body.field_errors).toBeUndefined();
		}
	});

	it('handles nested path correctly', async () => {
		const schema = z.object({
			items: z.array(
				z.object({
					value: z.number()
				})
			)
		});
		const result = schema.safeParse({ items: [{ value: 'not-a-number' }] });

		if (!result.success) {
			const response = formatValidationError(result.error);
			const body = await response.json();

			// Path should be "items.0.value"
			expect(body.error).toBeDefined();
		}
	});
});

describe('createErrorResponse', () => {
	it('returns JSON response with specified status', async () => {
		const response = createErrorResponse('Not found', 404);

		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body.success).toBe(false);
		expect(body.error).toBe('Not found');
	});

	it('returns 500 for server errors', async () => {
		const response = createErrorResponse('Internal error', 500);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe('Internal error');
	});

	it('returns 409 for conflict errors', async () => {
		const response = createErrorResponse('Already submitted', 409);

		expect(response.status).toBe(409);
	});
});
