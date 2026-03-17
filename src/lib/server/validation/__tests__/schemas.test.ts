/**
 * Unit tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
	submitRequestSchema,
	puzzleQuerySchema,
	resultsQuerySchema,
	archiveQuerySchema
} from '../schemas';

describe('submitRequestSchema', () => {
	const validSubmit = {
		user_id: '550e8400-e29b-41d4-a716-446655440000',
		puzzle_id: '660e8400-e29b-41d4-a716-446655440000',
		drafted_items: ['Item A', 'Item B', 'Item C', 'Item D', 'Item E'],
		captain: 'Item A'
	};

	describe('valid inputs', () => {
		it('accepts valid submission data', () => {
			const result = submitRequestSchema.safeParse(validSubmit);
			expect(result.success).toBe(true);
		});

		it('accepts captain that is any of the drafted items', () => {
			const withMiddleCaptain = { ...validSubmit, captain: 'Item C' };
			const result = submitRequestSchema.safeParse(withMiddleCaptain);
			expect(result.success).toBe(true);
		});
	});

	describe('user_id validation', () => {
		it('rejects missing user_id', () => {
			const { user_id, ...rest } = validSubmit;
			const result = submitRequestSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});

		it('rejects invalid UUID format', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				user_id: 'not-a-uuid'
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Invalid user_id format');
			}
		});

		it('rejects empty string', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				user_id: ''
			});
			expect(result.success).toBe(false);
		});
	});

	describe('puzzle_id validation', () => {
		it('rejects invalid UUID format', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				puzzle_id: '123'
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Invalid puzzle_id format');
			}
		});
	});

	describe('drafted_items validation', () => {
		it('rejects too few items', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				drafted_items: ['Item A', 'Item B', 'Item C', 'Item D'],
				captain: 'Item A'
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Must select exactly 5 items');
			}
		});

		it('rejects too many items', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				drafted_items: ['Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F']
			});
			expect(result.success).toBe(false);
		});

		it('rejects duplicate items', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				drafted_items: ['Item A', 'Item A', 'Item C', 'Item D', 'Item E']
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe('Must select 5 unique items');
			}
		});

		it('rejects non-array', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				drafted_items: 'Item A'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('captain validation', () => {
		it('rejects captain not in drafted items', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				captain: 'Not In List'
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					'Your #1 guess must be one of your selected items'
				);
			}
		});

		it('rejects empty captain', () => {
			const result = submitRequestSchema.safeParse({
				...validSubmit,
				captain: ''
			});
			expect(result.success).toBe(false);
		});

		it('rejects missing captain', () => {
			const { captain, ...rest } = validSubmit;
			const result = submitRequestSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});
});

describe('puzzleQuerySchema', () => {
	const validUserId = '550e8400-e29b-41d4-a716-446655440000';

	describe('valid inputs', () => {
		it('accepts user_id only', () => {
			const result = puzzleQuerySchema.safeParse({ user_id: validUserId });
			expect(result.success).toBe(true);
		});

		it('accepts user_id with puzzle_id', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_id: '660e8400-e29b-41d4-a716-446655440000'
			});
			expect(result.success).toBe(true);
		});

		it('accepts user_id with puzzle_number', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_number: '42'
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.puzzle_number).toBe(42);
			}
		});

		it('accepts user_id with date', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				date: '2026-03-17'
			});
			expect(result.success).toBe(true);
		});

		it('accepts user_id with timezone', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				timezone: '-300'
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.timezone).toBe(-300);
			}
		});
	});

	describe('user_id validation', () => {
		it('rejects missing user_id', () => {
			const result = puzzleQuerySchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('rejects invalid UUID', () => {
			const result = puzzleQuerySchema.safeParse({ user_id: 'invalid' });
			expect(result.success).toBe(false);
		});
	});

	describe('puzzle_number validation', () => {
		it('coerces string to number', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_number: '123'
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.puzzle_number).toBe(123);
			}
		});

		it('rejects non-positive numbers', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_number: '0'
			});
			expect(result.success).toBe(false);
		});

		it('rejects negative numbers', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_number: '-1'
			});
			expect(result.success).toBe(false);
		});

		it('rejects non-integer values', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				puzzle_number: '3.5'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('timezone validation', () => {
		it('accepts minimum timezone offset (UTC-12)', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				timezone: '-720'
			});
			expect(result.success).toBe(true);
		});

		it('accepts maximum timezone offset (UTC+14)', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				timezone: '840'
			});
			expect(result.success).toBe(true);
		});

		it('rejects timezone below minimum', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				timezone: '-721'
			});
			expect(result.success).toBe(false);
		});

		it('rejects timezone above maximum', () => {
			const result = puzzleQuerySchema.safeParse({
				user_id: validUserId,
				timezone: '841'
			});
			expect(result.success).toBe(false);
		});
	});
});

describe('resultsQuerySchema', () => {
	const validQuery = {
		user_id: '550e8400-e29b-41d4-a716-446655440000',
		puzzle_id: '660e8400-e29b-41d4-a716-446655440000'
	};

	it('accepts valid query params', () => {
		const result = resultsQuerySchema.safeParse(validQuery);
		expect(result.success).toBe(true);
	});

	it('rejects missing user_id', () => {
		const { user_id, ...rest } = validQuery;
		const result = resultsQuerySchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('rejects missing puzzle_id', () => {
		const { puzzle_id, ...rest } = validQuery;
		const result = resultsQuerySchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('rejects invalid user_id', () => {
		const result = resultsQuerySchema.safeParse({
			...validQuery,
			user_id: 'bad-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid puzzle_id', () => {
		const result = resultsQuerySchema.safeParse({
			...validQuery,
			puzzle_id: 'bad-uuid'
		});
		expect(result.success).toBe(false);
	});
});

describe('archiveQuerySchema', () => {
	it('accepts valid user_id', () => {
		const result = archiveQuerySchema.safeParse({
			user_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing user_id', () => {
		const result = archiveQuerySchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects invalid user_id', () => {
		const result = archiveQuerySchema.safeParse({
			user_id: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects null user_id', () => {
		const result = archiveQuerySchema.safeParse({
			user_id: null
		});
		expect(result.success).toBe(false);
	});
});
