import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabaseClient';
import { isValidUUID, generateShareText } from '$lib/utils';
import type { APIResponse, DBPuzzle, CrowdStat, DBSubmission, Results } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const user_id = url.searchParams.get('user_id');
		const puzzle_id = url.searchParams.get('puzzle_id');

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

		// Fetch user's submission
		const { data: submissionData, error: submissionError } = await supabaseAdmin
			.from('submissions')
			.select('*')
			.eq('user_id', user_id)
			.eq('puzzle_id', puzzle_id)
			.single();

		if (submissionError || !submissionData) {
			return json(
				{
					success: false,
					error: 'No submission found. Play today\'s puzzle first!'
				} as APIResponse<never>,
				{ status: 404 }
			);
		}

		const submission = submissionData as unknown as DBSubmission;

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

		// Calculate crowd stats
		const trueRankings = puzzle.true_rankings as Record<string, number>;
		const crowdStats = await calculateCrowdStats(puzzle_id, puzzle.items, trueRankings);

		// Generate share text
		const shareText = generateShareText(
			puzzle.puzzle_number,
			submission.drafted_items,
			submission.captain,
			trueRankings,
			submission.total_score
		);

		// Return complete results
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
			sources: puzzle.sources as string[],
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
			drafted_percentage: Math.round((draftedCount / totalUsers) * 1000) / 10,
			captained_percentage: Math.round((captainedCount / totalUsers) * 1000) / 10
		};
	});

	stats.sort((a, b) => a.rank - b.rank);
	return stats;
}
