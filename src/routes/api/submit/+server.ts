import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabaseClient';
import { isValidUUID, generateShareText } from '$lib/utils';
import type { APIResponse, DBPuzzle, CrowdStat, DBSubmission, Results } from '$lib/types';
import {
	DRAFT_SIZE,
	CAPTAIN_BONUS,
	TOP_RANK,
	TOP_N,
	PERCENTAGE_PRECISION_MULTIPLIER,
	PERCENTAGE_PRECISION_DIVISOR
} from '$lib/config/constants';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { user_id, puzzle_id, drafted_items, captain } = body;

		// Validate user_id and puzzle_id
		if (!user_id || !isValidUUID(user_id)) {
			return json(
				{ success: false, error: 'Invalid user_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

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

		// Validate captain (user's #1 guess)
		if (!captain || !drafted_items.includes(captain)) {
			return json(
				{
					success: false,
					error: 'Your #1 guess must be one of your selected items'
				} as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Fetch puzzle with true_rankings and sources
		const { data: puzzleData, error: puzzleError } = await supabaseAdmin
			.from('puzzles')
			.select('*')
			.eq('id', puzzle_id)
			.single();

		if (puzzleError || !puzzleData) {
			return json(
				{ success: false, error: 'Puzzle not found' } as APIResponse<never>,
				{ status: 404 }
			);
		}

		const puzzle = puzzleData as unknown as DBPuzzle;

		// Verify all selected items exist in puzzle items
		const validItems = drafted_items.every((item) => puzzle.items.includes(item));
		if (!validItems) {
			return json(
				{ success: false, error: 'Invalid items selected' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Check for duplicate submission
		const { data: existingSubmission } = await supabaseAdmin
			.from('submissions')
			.select('id')
			.eq('user_id', user_id)
			.eq('puzzle_id', puzzle_id)
			.single();

		if (existingSubmission) {
			return json(
				{
					success: false,
					error: "You've already submitted today! Come back tomorrow."
				} as APIResponse<never>,
				{ status: 409 }
			);
		}

		// Calculate score
		const trueRankings = puzzle.true_rankings as Record<string, number>;
		const trueTop5 = Object.entries(trueRankings)
			.filter(([_, rank]) => rank <= TOP_N)
			.map(([item, _]) => item);

		const baseScore = drafted_items.filter((item) => trueTop5.includes(item)).length;
		const captainBonus = trueRankings[captain] === TOP_RANK ? CAPTAIN_BONUS : 0;
		const totalScore = baseScore + captainBonus;

		// Save submission
		const { data: submissionData, error: submissionError } = await supabaseAdmin
			.from('submissions')
			.insert({
				user_id,
				puzzle_id,
				drafted_items,
				captain,
				base_score: baseScore,
				captain_bonus: captainBonus,
				total_score: totalScore
			})
			.select()
			.single();

		if (submissionError || !submissionData) {
			console.error('Error saving submission:', submissionError);
			return json(
				{
					success: false,
					error: 'Failed to save submission. Please try again.'
				} as APIResponse<never>,
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
			totalScore
		);

		// Return results with sources
		const results: Results = {
			submission: {
				drafted_items,
				captain,
				base_score: baseScore,
				captain_bonus: captainBonus,
				total_score: totalScore
			},
			puzzle: {
				prompt: puzzle.prompt,
				true_rankings: trueRankings
			},
			crowd_stats: crowdStats,
			sources: puzzle.sources as string[],
			share_text: shareText
		};

		return json({
			success: true,
			data: {
				submission_id: (submissionData as unknown as DBSubmission).id,
				score: {
					base_score: baseScore,
					captain_bonus: captainBonus,
					total_score: totalScore
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

async function calculateCrowdStats(
	puzzleId: string,
	allItems: string[],
	trueRankings: Record<string, number>
): Promise<CrowdStat[]> {
	const { data: submissions, error } = await supabaseAdmin
		.from('submissions')
		.select('drafted_items, captain')
		.eq('puzzle_id', puzzleId);

	if (error || !submissions || submissions.length === 0) {
		return allItems.map((item) => ({
			item_name: item,
			rank: trueRankings[item],
			drafted_percentage: 0,
			captained_percentage: 0
		}));
	}

	const totalUsers = submissions.length;
	const stats: CrowdStat[] = allItems.map((item) => {
		let draftedCount = 0;
		let captainedCount = 0;

		for (const submission of submissions) {
			const sub = submission as unknown as { drafted_items: string[]; captain: string };
			if (sub.drafted_items.includes(item)) draftedCount++;
			if (sub.captain === item) captainedCount++;
		}

		return {
			item_name: item,
			rank: trueRankings[item],
			drafted_percentage: Math.round((draftedCount / totalUsers) * PERCENTAGE_PRECISION_MULTIPLIER) / PERCENTAGE_PRECISION_DIVISOR,
			captained_percentage: Math.round((captainedCount / totalUsers) * PERCENTAGE_PRECISION_MULTIPLIER) / PERCENTAGE_PRECISION_DIVISOR
		};
	});

	stats.sort((a, b) => a.rank - b.rank);
	return stats;
}
