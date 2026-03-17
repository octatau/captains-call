import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidUUID } from '$lib/utils';
import type { APIResponse, Puzzle } from '$lib/types';
import {
	getPuzzle,
	toApiPuzzle,
	hasSubmitted
} from '$lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const user_id = url.searchParams.get('user_id');
		const puzzle_id = url.searchParams.get('puzzle_id');
		const puzzle_number = url.searchParams.get('puzzle_number');
		const date = url.searchParams.get('date');
		const timezone = url.searchParams.get('timezone');

		// Validate user_id
		if (!user_id || !isValidUUID(user_id)) {
			return json(
				{ success: false, error: 'Invalid user_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Validate puzzle_id if provided
		if (puzzle_id && !isValidUUID(puzzle_id)) {
			return json(
				{ success: false, error: 'Invalid puzzle_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Validate puzzle_number if provided
		let parsedPuzzleNumber: number | undefined;
		if (puzzle_number) {
			parsedPuzzleNumber = parseInt(puzzle_number);
			if (isNaN(parsedPuzzleNumber)) {
				return json(
					{ success: false, error: 'Invalid puzzle_number format' } as APIResponse<never>,
					{ status: 400 }
				);
			}
		}

		// Parse timezone offset
		const timezoneOffset = timezone ? parseInt(timezone) : undefined;

		// Fetch puzzle using service
		const dbPuzzle = await getPuzzle({
			puzzleId: puzzle_id ?? undefined,
			puzzleNumber: parsedPuzzleNumber,
			date: date ?? undefined,
			timezoneOffset
		});

		if (!dbPuzzle) {
			return json(
				{ success: false, error: 'No puzzle available yet. Check back soon!' } as APIResponse<never>,
				{ status: 404 }
			);
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
		return json(
			{
				success: false,
				error: 'Server error. Please try again.'
			} as APIResponse<never>,
			{ status: 500 }
		);
	}
};
