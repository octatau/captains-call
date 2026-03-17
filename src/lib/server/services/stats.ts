/**
 * Stats service - calculates crowd statistics for puzzles
 *
 * SINGLE SOURCE OF TRUTH for crowd stats calculation.
 * Previously duplicated in submit and results routes.
 */

import type { CrowdStat } from '$lib/types';
import { supabaseAdmin } from '$lib/supabaseClient';

// Percentage rounding: one decimal place
const PERCENTAGE_DECIMALS = 1;

/**
 * Round a number to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
	const multiplier = Math.pow(10, decimals);
	return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate percentage with proper rounding
 */
function calculatePercentage(count: number, total: number): number {
	if (total === 0) return 0;
	return roundToDecimals((count / total) * 100, PERCENTAGE_DECIMALS);
}

export interface SubmissionData {
	drafted_items: string[];
	captain: string;
}

/**
 * Calculate crowd statistics for a puzzle
 *
 * For each item, calculates:
 * - What percentage of users drafted it
 * - What percentage of users made it their captain (top pick)
 *
 * @param puzzleId - The puzzle to get stats for
 * @param allItems - All items in the puzzle (for zero-stat items)
 * @param trueRankings - The true rankings for sorting results
 * @returns Array of CrowdStat sorted by rank
 */
export async function calculateCrowdStats(
	puzzleId: string,
	allItems: string[],
	trueRankings: Record<string, number>
): Promise<CrowdStat[]> {
	const { data: submissions, error } = await supabaseAdmin
		.from('submissions')
		.select('drafted_items, captain')
		.eq('puzzle_id', puzzleId);

	if (error || !submissions || submissions.length === 0) {
		// Return empty stats for all items
		return allItems.map((item) => ({
			item_name: item,
			rank: trueRankings[item],
			drafted_percentage: 0,
			captained_percentage: 0
		}));
	}

	return calculateCrowdStatsFromSubmissions(
		submissions as SubmissionData[],
		allItems,
		trueRankings
	);
}

/**
 * Pure function to calculate crowd stats from submission data
 *
 * Separated from database access for testability.
 *
 * @param submissions - Array of submission data (drafted_items and captain)
 * @param allItems - All items in the puzzle
 * @param trueRankings - The true rankings for sorting
 * @returns Array of CrowdStat sorted by rank
 */
export function calculateCrowdStatsFromSubmissions(
	submissions: SubmissionData[],
	allItems: string[],
	trueRankings: Record<string, number>
): CrowdStat[] {
	const totalUsers = submissions.length;

	if (totalUsers === 0) {
		return allItems.map((item) => ({
			item_name: item,
			rank: trueRankings[item],
			drafted_percentage: 0,
			captained_percentage: 0
		}));
	}

	const stats: CrowdStat[] = allItems.map((item) => {
		let draftedCount = 0;
		let captainedCount = 0;

		for (const submission of submissions) {
			if (submission.drafted_items.includes(item)) {
				draftedCount++;
			}
			if (submission.captain === item) {
				captainedCount++;
			}
		}

		return {
			item_name: item,
			rank: trueRankings[item],
			drafted_percentage: calculatePercentage(draftedCount, totalUsers),
			captained_percentage: calculatePercentage(captainedCount, totalUsers)
		};
	});

	// Sort by rank (ascending)
	stats.sort((a, b) => a.rank - b.rank);

	return stats;
}
