import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabaseClient';
import { isValidUUID, getUserLocalDate, seededShuffle } from '$lib/utils';
import type { APIResponse, Puzzle, DBPuzzle } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const user_id = url.searchParams.get('user_id');
		const puzzle_id = url.searchParams.get('puzzle_id');
		const date = url.searchParams.get('date');
		const timezone = url.searchParams.get('timezone');

		// Validate user_id
		if (!user_id || !isValidUUID(user_id)) {
			return json(
				{ success: false, error: 'Invalid user_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		let puzzleQuery = supabaseAdmin
			.from('puzzles')
			.select('id, puzzle_number, daily_date, prompt, items, published_at')
			.not('published_at', 'is', null)
			.lte('published_at', new Date().toISOString());

		// Support archive mode: fetch by puzzle_id or date
		if (puzzle_id) {
			if (!isValidUUID(puzzle_id)) {
				return json(
					{ success: false, error: 'Invalid puzzle_id format' } as APIResponse<never>,
					{ status: 400 }
				);
			}
			puzzleQuery = puzzleQuery.eq('id', puzzle_id);
		} else if (date) {
			// Fetch puzzle for specific date
			puzzleQuery = puzzleQuery.eq('daily_date', date);
		} else {
			// Default: fetch today's puzzle based on user's timezone
			const timezoneOffset = timezone ? parseInt(timezone) : undefined;
			const userLocalDate = getUserLocalDate(timezoneOffset);
			puzzleQuery = puzzleQuery.eq('daily_date', userLocalDate);
		}

		const { data: puzzleData, error: puzzleError } = await puzzleQuery.single();

		if (puzzleError || !puzzleData) {
			return json(
				{ success: false, error: 'No puzzle available yet. Check back soon!' } as APIResponse<never>,
				{ status: 404 }
			);
		}

		const dbPuzzle = puzzleData as unknown as DBPuzzle;

		// Shuffle items using user_id + puzzle_id as seed for consistency
		const seed = `${user_id}_${dbPuzzle.id}`;
		const shuffledItems = seededShuffle(dbPuzzle.items, seed);

		// Check if user has already submitted for this puzzle
		const { data: submissionData } = await supabaseAdmin
			.from('submissions')
			.select('id')
			.eq('user_id', user_id)
			.eq('puzzle_id', dbPuzzle.id)
			.single();

		const has_submitted = !!submissionData;

		// Return puzzle WITHOUT true_rankings (security)
		const puzzle: Puzzle = {
			id: dbPuzzle.id,
			puzzle_number: dbPuzzle.puzzle_number,
			daily_date: dbPuzzle.daily_date,
			prompt: dbPuzzle.prompt,
			items: shuffledItems,
			has_submitted
		};

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
