/**
 * Zod validation schemas for API endpoints
 *
 * All API input validation is defined here for consistency.
 * Uses constants from config to avoid magic numbers.
 */

import { z } from 'zod';
import { DRAFT_SIZE } from '$lib/config/constants';

// Timezone offset range: -720 to +840 minutes (UTC-12 to UTC+14)
const MIN_TIMEZONE_OFFSET = -720;
const MAX_TIMEZONE_OFFSET = 840;

/**
 * Schema for POST /api/submit
 * Validates submission data for a puzzle
 */
export const submitRequestSchema = z
	.object({
		user_id: z.string().uuid({ message: 'Invalid user_id format' }),
		puzzle_id: z.string().uuid({ message: 'Invalid puzzle_id format' }),
		drafted_items: z
			.array(z.string())
			.length(DRAFT_SIZE, { message: `Must select exactly ${DRAFT_SIZE} items` })
			.refine((items) => new Set(items).size === items.length, {
				message: `Must select ${DRAFT_SIZE} unique items`
			}),
		captain: z.string().min(1, { message: 'Captain is required' })
	})
	.refine((data) => data.drafted_items.includes(data.captain), {
		message: 'Your #1 guess must be one of your selected items',
		path: ['captain']
	});

export type SubmitRequest = z.infer<typeof submitRequestSchema>;

/**
 * Schema for GET /api/puzzle
 * Validates query parameters for fetching a puzzle
 */
export const puzzleQuerySchema = z.object({
	user_id: z.string().uuid({ message: 'Invalid user_id format' }),
	puzzle_id: z.string().uuid({ message: 'Invalid puzzle_id format' }).optional(),
	puzzle_number: z.coerce
		.number()
		.int({ message: 'puzzle_number must be an integer' })
		.positive({ message: 'puzzle_number must be positive' })
		.optional(),
	date: z.string().optional(),
	timezone: z.coerce
		.number()
		.int({ message: 'timezone must be an integer' })
		.min(MIN_TIMEZONE_OFFSET, { message: `timezone must be at least ${MIN_TIMEZONE_OFFSET}` })
		.max(MAX_TIMEZONE_OFFSET, { message: `timezone must be at most ${MAX_TIMEZONE_OFFSET}` })
		.optional()
});

export type PuzzleQuery = z.infer<typeof puzzleQuerySchema>;

/**
 * Schema for GET /api/results
 * Validates query parameters for fetching results
 */
export const resultsQuerySchema = z.object({
	user_id: z.string().uuid({ message: 'Invalid user_id format' }),
	puzzle_id: z.string().uuid({ message: 'Invalid puzzle_id format' })
});

export type ResultsQuery = z.infer<typeof resultsQuerySchema>;

/**
 * Schema for GET /api/puzzles/archive
 * Validates query parameters for fetching archive list
 */
export const archiveQuerySchema = z.object({
	user_id: z.string().uuid({ message: 'Invalid user_id format' })
});

export type ArchiveQuery = z.infer<typeof archiveQuerySchema>;
