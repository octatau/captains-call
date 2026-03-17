import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { APIResponse, Puzzle } from '$lib/types';
import {
	puzzleQuerySchema,
	formatValidationError,
	createErrorResponse
} from '$lib/server/validation';
import { getPuzzle, toApiPuzzle, hasSubmitted } from '$lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters into an object for Zod validation
		const queryParams = {
			user_id: url.searchParams.get('user_id') ?? undefined,
			puzzle_id: url.searchParams.get('puzzle_id') ?? undefined,
			puzzle_number: url.searchParams.get('puzzle_number') ?? undefined,
			date: url.searchParams.get('date') ?? undefined,
			timezone: url.searchParams.get('timezone') ?? undefined
		};

		// Validate with Zod
		const parseResult = puzzleQuerySchema.safeParse(queryParams);
		if (!parseResult.success) {
			return formatValidationError(parseResult.error);
		}

		const { user_id, puzzle_id, puzzle_number, date, timezone } = parseResult.data;

		// Fetch puzzle using service
		const dbPuzzle = await getPuzzle({
			puzzleId: puzzle_id,
			puzzleNumber: puzzle_number,
			date: date,
			timezoneOffset: timezone
		});

		if (!dbPuzzle) {
			return createErrorResponse('No puzzle available yet. Check back soon!', 404);
		}

		// Check if user has already submitted
		const has_submitted = await hasSubmitted(user_id, dbPuzzle.id);

		// Transform to API-safe puzzle (removes true_rankings, shuffles items)
		const puzzle: Puzzle = toApiPuzzle(dbPuzzle, user_id, has_submitted);

		return json({
			success: true,
			data: puzzle
		} as APIResponse<Puzzle>);
	} catch (error) {
		console.error('Error fetching puzzle:', error);
		return createErrorResponse('Server error. Please try again.', 500);
	}
};
