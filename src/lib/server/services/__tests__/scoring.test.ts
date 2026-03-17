/**
 * Unit tests for scoring service
 *
 * Tests calculateScore and getTrueTopN functions
 */

import { describe, it, expect } from 'vitest';
import { calculateScore, getTrueTopN } from '../scoring';
import { DRAFT_SIZE, CAPTAIN_BONUS, TOP_RANK, TOP_N } from '$lib/config/constants';

describe('calculateScore', () => {
	// Sample true rankings: A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10
	const trueRankings: Record<string, number> = {
		A: 1,
		B: 2,
		C: 3,
		D: 4,
		E: 5,
		F: 6,
		G: 7,
		H: 8,
		I: 9,
		J: 10
	};

	describe('happy path', () => {
		it('returns perfect score when all 5 top items drafted and captain is #1', () => {
			const result = calculateScore(['A', 'B', 'C', 'D', 'E'], 'A', trueRankings);

			expect(result.baseScore).toBe(DRAFT_SIZE);
			expect(result.captainBonus).toBe(CAPTAIN_BONUS);
			expect(result.totalScore).toBe(DRAFT_SIZE + CAPTAIN_BONUS);
		});

		it('returns base score only when captain is not #1', () => {
			const result = calculateScore(['A', 'B', 'C', 'D', 'E'], 'B', trueRankings);

			expect(result.baseScore).toBe(DRAFT_SIZE);
			expect(result.captainBonus).toBe(0);
			expect(result.totalScore).toBe(DRAFT_SIZE);
		});

		it('returns partial score when some drafted items are not in top N', () => {
			const result = calculateScore(['A', 'B', 'C', 'F', 'G'], 'A', trueRankings);

			expect(result.baseScore).toBe(3); // A, B, C are in top 5
			expect(result.captainBonus).toBe(CAPTAIN_BONUS);
			expect(result.totalScore).toBe(3 + CAPTAIN_BONUS);
		});

		it('returns zero when no drafted items are in top N', () => {
			const result = calculateScore(['F', 'G', 'H', 'I', 'J'], 'F', trueRankings);

			expect(result.baseScore).toBe(0);
			expect(result.captainBonus).toBe(0);
			expect(result.totalScore).toBe(0);
		});

		it('handles captain bonus correctly when item ranked #1 is drafted but not captain', () => {
			const result = calculateScore(['A', 'F', 'G', 'H', 'I'], 'F', trueRankings);

			expect(result.baseScore).toBe(1); // Only A is in top 5
			expect(result.captainBonus).toBe(0); // F is captain, not ranked #1
			expect(result.totalScore).toBe(1);
		});
	});

	describe('edge cases', () => {
		it('handles exactly one correct item', () => {
			const result = calculateScore(['A', 'F', 'G', 'H', 'I'], 'A', trueRankings);

			expect(result.baseScore).toBe(1);
			expect(result.captainBonus).toBe(CAPTAIN_BONUS);
			expect(result.totalScore).toBe(1 + CAPTAIN_BONUS);
		});

		it('handles items at rank boundary (exactly rank 5)', () => {
			const result = calculateScore(['E', 'F', 'G', 'H', 'I'], 'E', trueRankings);

			expect(result.baseScore).toBe(1); // E is rank 5, still counts
			expect(result.captainBonus).toBe(0); // E is not #1
			expect(result.totalScore).toBe(1);
		});

		it('does not count items at rank 6 (just outside top N)', () => {
			const rankings: Record<string, number> = { F: 6 };
			const result = calculateScore(['F', 'G', 'H', 'I', 'J'], 'F', {
				...trueRankings,
				...rankings
			});

			expect(result.baseScore).toBe(0);
		});
	});

	describe('error handling', () => {
		it('throws error when drafted items count is not DRAFT_SIZE', () => {
			expect(() => calculateScore(['A', 'B', 'C', 'D'], 'A', trueRankings)).toThrow(
				`Expected ${DRAFT_SIZE} drafted items`
			);

			expect(() =>
				calculateScore(['A', 'B', 'C', 'D', 'E', 'F'], 'A', trueRankings)
			).toThrow(`Expected ${DRAFT_SIZE} drafted items`);
		});

		it('throws error when captain is not in drafted items', () => {
			expect(() => calculateScore(['A', 'B', 'C', 'D', 'E'], 'F', trueRankings)).toThrow(
				'Captain must be one of the drafted items'
			);
		});

		it('throws error for empty drafted items array', () => {
			expect(() => calculateScore([], 'A', trueRankings)).toThrow(
				`Expected ${DRAFT_SIZE} drafted items`
			);
		});
	});

	describe('invariants', () => {
		it('base score is never negative', () => {
			const result = calculateScore(['F', 'G', 'H', 'I', 'J'], 'F', trueRankings);
			expect(result.baseScore).toBeGreaterThanOrEqual(0);
		});

		it('base score never exceeds DRAFT_SIZE', () => {
			const result = calculateScore(['A', 'B', 'C', 'D', 'E'], 'A', trueRankings);
			expect(result.baseScore).toBeLessThanOrEqual(DRAFT_SIZE);
		});

		it('captain bonus is either 0 or CAPTAIN_BONUS', () => {
			const withBonus = calculateScore(['A', 'B', 'C', 'D', 'E'], 'A', trueRankings);
			const withoutBonus = calculateScore(['A', 'B', 'C', 'D', 'E'], 'B', trueRankings);

			expect([0, CAPTAIN_BONUS]).toContain(withBonus.captainBonus);
			expect([0, CAPTAIN_BONUS]).toContain(withoutBonus.captainBonus);
		});

		it('total score equals base score plus captain bonus', () => {
			const result = calculateScore(['A', 'B', 'C', 'D', 'E'], 'A', trueRankings);
			expect(result.totalScore).toBe(result.baseScore + result.captainBonus);
		});
	});
});

describe('getTrueTopN', () => {
	const trueRankings: Record<string, number> = {
		A: 1,
		B: 2,
		C: 3,
		D: 4,
		E: 5,
		F: 6,
		G: 7
	};

	it('returns top N items in rank order', () => {
		const result = getTrueTopN(trueRankings);

		expect(result).toHaveLength(TOP_N);
		expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
	});

	it('returns items sorted by rank (ascending)', () => {
		// Deliberately out of order in the object
		const unorderedRankings: Record<string, number> = {
			C: 3,
			A: 1,
			E: 5,
			B: 2,
			D: 4,
			F: 6
		};

		const result = getTrueTopN(unorderedRankings);
		expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
	});

	it('excludes items ranked below TOP_N', () => {
		const result = getTrueTopN(trueRankings);

		expect(result).not.toContain('F');
		expect(result).not.toContain('G');
	});

	it('handles fewer than TOP_N items in rankings', () => {
		const fewRankings: Record<string, number> = {
			A: 1,
			B: 2,
			C: 3
		};

		const result = getTrueTopN(fewRankings);
		expect(result).toHaveLength(3);
		expect(result).toEqual(['A', 'B', 'C']);
	});

	it('handles empty rankings', () => {
		const result = getTrueTopN({});
		expect(result).toHaveLength(0);
		expect(result).toEqual([]);
	});

	it('includes item exactly at rank TOP_N', () => {
		const result = getTrueTopN(trueRankings);
		expect(result).toContain('E'); // Rank 5
	});

	it('excludes item exactly at rank TOP_N + 1', () => {
		const result = getTrueTopN(trueRankings);
		expect(result).not.toContain('F'); // Rank 6
	});
});
