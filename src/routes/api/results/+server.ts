import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateShareText } from '$lib/utils';
import type { APIResponse, Results } from '$lib/types';
import {
	resultsQuerySchema,
	formatValidationError,
	createErrorResponse
} from '$lib/server/validation';
import { calculateCrowdStats, getPuzzleById, getSubmission } from '$lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters into an object for Zod validation
		const queryParams = {
			user_id: url.searchParams.get('user_id') ?? undefined,
			puzzle_id: url.searchParams.get('puzzle_id') ?? undefined
		};

		// Validate with Zod
		const parseResult = resultsQuerySchema.safeParse(queryParams);
		if (!parseResult.success) {
			return formatValidationError(parseResult.error);
		}

		const { user_id, puzzle_id } = parseResult.data;

		// Fetch user's submission
		const submission = await getSubmission(user_id, puzzle_id);
		if (!submission) {
			return createErrorResponse("No submission found. Play today's puzzle first!", 404);
		}

		// Fetch puzzle
		const puzzle = await getPuzzleById(puzzle_id);
		if (!puzzle) {
			return createErrorResponse('Puzzle not found', 404);
		}

		// Calculate crowd stats
		const trueRankings = puzzle.true_rankings;
		const crowdStats = await calculateCrowdStats(puzzle_id, puzzle.items, trueRankings);

		// Generate share text
		const shareText = generateShareText(
			puzzle.puzzle_number,
			puzzle.prompt,
			submission.drafted_items,
			submission.captain,
			trueRankings,
			submission.total_score,
			url.host
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
		return createErrorResponse('Server error. Please try again.', 500);
	}
};
