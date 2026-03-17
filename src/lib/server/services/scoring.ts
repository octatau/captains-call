/**
 * Scoring service - calculates scores for puzzle submissions
 *
 * All scoring logic is centralized here. Pure functions where possible.
 */

import {
	DRAFT_SIZE,
	CAPTAIN_BONUS,
	TOP_RANK,
	TOP_N
} from '$lib/config/constants';

export interface ScoreResult {
	baseScore: number;
	captainBonus: number;
	totalScore: number;
}

/**
 * Calculate the score for a submission
 *
 * Scoring rules:
 * - 1 point for each drafted item that is in the true top N
 * - Captain bonus if the captain pick is ranked #1
 *
 * @param draftedItems - The items the user selected (must be exactly DRAFT_SIZE)
 * @param captain - The user's #1 pick from their draft
 * @param trueRankings - The actual rankings (item -> rank number)
 * @returns ScoreResult with base score, captain bonus, and total
 */
export function calculateScore(
	draftedItems: string[],
	captain: string,
	trueRankings: Record<string, number>
): ScoreResult {
	// Validate inputs
	if (draftedItems.length !== DRAFT_SIZE) {
		throw new Error(`Expected ${DRAFT_SIZE} drafted items, got ${draftedItems.length}`);
	}

	if (!draftedItems.includes(captain)) {
		throw new Error('Captain must be one of the drafted items');
	}

	// Get items that are in the true top N
	const trueTopN = Object.entries(trueRankings)
		.filter(([_, rank]) => rank <= TOP_N)
		.map(([item]) => item);

	// Base score: count how many drafted items are in the true top N
	const baseScore = draftedItems.filter((item) => trueTopN.includes(item)).length;

	// Captain bonus: only awarded if captain is ranked #1
	const captainBonus = trueRankings[captain] === TOP_RANK ? CAPTAIN_BONUS : 0;

	const totalScore = baseScore + captainBonus;

	return {
		baseScore,
		captainBonus,
		totalScore
	};
}

/**
 * Get the true top N items in ranked order
 *
 * @param trueRankings - The actual rankings (item -> rank number)
 * @returns Array of item names ordered by rank (1 to N)
 */
export function getTrueTopN(trueRankings: Record<string, number>): string[] {
	return Object.entries(trueRankings)
		.filter(([_, rank]) => rank <= TOP_N)
		.sort((a, b) => a[1] - b[1])
		.map(([item]) => item);
}
