import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidUUID, generateShareText } from '$lib/utils';
import type { APIResponse, Results } from '$lib/types';
import {
	calculateCrowdStats,
	getPuzzleById,
	getSubmission
} from '$lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const user_id = url.searchParams.get('user_id');
		const puzzle_id = url.searchParams.get('puzzle_id');

		// Validate user_id
		if (!user_id || !isValidUUID(user_id)) {
			return json(
				{ success: false, error: 'Invalid user_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Validate puzzle_id
		if (!puzzle_id || !isValidUUID(puzzle_id)) {
			return json(
				{ success: false, error: 'Invalid puzzle_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Fetch user's submission
		const submission = await getSubmission(user_id, puzzle_id);
		if (!submission) {
			return json(
				{
					success: false,
					error: 'No submission found. Play today\'s puzzle first!'
				} as APIResponse<never>,
				{ status: 404 }
			);
		}

		// Fetch puzzle
		const puzzle = await getPuzzleById(puzzle_id);
		if (!puzzle) {
			return json(
				{ success: false, error: 'Puzzle not found' } as APIResponse<never>,
				{ status: 404 }
			);
		}

		// Calculate crowd stats
		const trueRankings = puzzle.true_rankings;
		const crowdStats = await calculateCrowdStats(puzzle_id, puzzle.items, trueRankings);

		// Generate share text
		const shareText = generateShareText(
			puzzle.puzzle_number,
			submission.drafted_items,
			submission.captain,
			trueRankings,
			submission.total_score
		);

		// Build results
		const results: Results = {
			submission: {
				drafted_items: submission.drafted_items,
				captain: submission.captain,
				base_score: submission.base_score,
				captain_bonus: submission.captain_bonus,
				total_score: submission.total_score
			},
			puzzle: {
				prompt: puzzle.prompt,
				true_rankings: trueRankings
			},
			crowd_stats: crowdStats,
			sources: puzzle.sources,
			share_text: shareText
		};

		return json({
			success: true,
			data: results
		} as APIResponse<Results>);
	} catch (error) {
		console.error('Error fetching results:', error);
		return json(
			{
				success: false,
				error: 'Server error. Please try again.'
			} as APIResponse<never>,
			{ status: 500 }
		);
	}
};
