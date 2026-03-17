import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateShareText } from '$lib/utils';
import type { Results } from '$lib/types';
import {
	submitRequestSchema,
	formatValidationError,
	createErrorResponse
} from '$lib/server/validation';
import {
	calculateScore,
	calculateCrowdStats,
	getPuzzleById,
	hasSubmitted,
	createSubmission
} from '$lib/server/services';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate request body with Zod
		const parseResult = submitRequestSchema.safeParse(body);
		if (!parseResult.success) {
			return formatValidationError(parseResult.error);
		}

		const { user_id, puzzle_id, drafted_items, captain } = parseResult.data;

		// Fetch puzzle
		const puzzle = await getPuzzleById(puzzle_id);
		if (!puzzle) {
			return createErrorResponse('Puzzle not found', 404);
		}

		// Verify all selected items exist in puzzle
		const invalidItems = drafted_items.filter((item) => !puzzle.items.includes(item));
		if (invalidItems.length > 0) {
			return createErrorResponse('Invalid items selected', 400);
		}

		// Check for duplicate submission
		const alreadySubmitted = await hasSubmitted(user_id, puzzle_id);
		if (alreadySubmitted) {
			return createErrorResponse("You've already submitted today! Come back tomorrow.", 409);
		}

		// Calculate score
		const trueRankings = puzzle.true_rankings;
		const score = calculateScore(drafted_items, captain, trueRankings);

		// Save submission
		const submissionResult = await createSubmission({
			userId: user_id,
			puzzleId: puzzle_id,
			draftedItems: drafted_items,
			captain,
			score
		});

		if (!submissionResult.success) {
			return createErrorResponse(submissionResult.error, 500);
		}

		// Calculate crowd stats
		const crowdStats = await calculateCrowdStats(puzzle_id, puzzle.items, trueRankings);

		// Generate share text
		const shareText = generateShareText(
			puzzle.puzzle_number,
			drafted_items,
			captain,
			trueRankings,
			score.totalScore
		);

		// Build results
		const results: Results = {
			submission: {
				drafted_items,
				captain,
				base_score: score.baseScore,
				captain_bonus: score.captainBonus,
				total_score: score.totalScore
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
			data: {
				submission_id: submissionResult.submission.id,
				score: {
					base_score: score.baseScore,
					captain_bonus: score.captainBonus,
					total_score: score.totalScore
				},
				results
			}
		});
	} catch (error) {
		console.error('Error processing submission:', error);
		return createErrorResponse('Server error. Please try again.', 500);
	}
};
