import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidUUID, generateShareText } from '$lib/utils';
import type { APIResponse, Results } from '$lib/types';
import { DRAFT_SIZE } from '$lib/config/constants';
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
		const { user_id, puzzle_id, drafted_items, captain } = body;

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

		// Validate drafted_items
		if (
			!Array.isArray(drafted_items) ||
			drafted_items.length !== DRAFT_SIZE ||
			new Set(drafted_items).size !== DRAFT_SIZE
		) {
			return json(
				{ success: false, error: `Must select exactly ${DRAFT_SIZE} unique items` } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Validate captain
		if (!captain || !drafted_items.includes(captain)) {
			return json(
				{
					success: false,
					error: 'Your #1 guess must be one of your selected items'
				} as APIResponse<never>,
				{ status: 400 }
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

		// Verify all selected items exist in puzzle
		const validItems = drafted_items.every((item: string) => puzzle.items.includes(item));
		if (!validItems) {
			return json(
				{ success: false, error: 'Invalid items selected' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Check for duplicate submission
		const alreadySubmitted = await hasSubmitted(user_id, puzzle_id);
		if (alreadySubmitted) {
			return json(
				{
					success: false,
					error: "You've already submitted today! Come back tomorrow."
				} as APIResponse<never>,
				{ status: 409 }
			);
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
			return json(
				{ success: false, error: submissionResult.error } as APIResponse<never>,
				{ status: 500 }
			);
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
		return json(
			{
				success: false,
				error: 'Server error. Please try again.'
			} as APIResponse<never>,
			{ status: 500 }
		);
	}
};
