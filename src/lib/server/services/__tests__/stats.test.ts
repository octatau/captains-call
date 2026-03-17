/**
 * Unit tests for stats service
 *
 * Tests calculateCrowdStatsFromSubmissions (pure function)
 */

import { describe, it, expect } from 'vitest';
import { calculateCrowdStatsFromSubmissions, type SubmissionData } from '../stats';

describe('calculateCrowdStatsFromSubmissions', () => {
	const allItems = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
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

	describe('percentage calculations', () => {
		it('returns 100% drafted when all users draft an item', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'B' },
				{ drafted_items: ['A', 'F', 'G', 'H', 'I'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemA = result.find((s) => s.item_name === 'A');

			expect(itemA?.drafted_percentage).toBe(100);
		});

		it('returns 0% drafted when no users draft an item', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'B' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemJ = result.find((s) => s.item_name === 'J');

			expect(itemJ?.drafted_percentage).toBe(0);
		});

		it('calculates partial percentages correctly', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'B', 'F', 'G', 'H'], captain: 'A' },
				{ drafted_items: ['F', 'G', 'H', 'I', 'J'], captain: 'F' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemA = result.find((s) => s.item_name === 'A');

			// 2 out of 3 users drafted A = 66.7%
			expect(itemA?.drafted_percentage).toBe(66.7);
		});

		it('rounds percentages to 1 decimal place', () => {
			// 1/3 = 33.333...% should round to 33.3%
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['F', 'G', 'H', 'I', 'J'], captain: 'F' },
				{ drafted_items: ['F', 'G', 'H', 'I', 'J'], captain: 'G' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemA = result.find((s) => s.item_name === 'A');

			expect(itemA?.drafted_percentage).toBe(33.3);
		});
	});

	describe('captain percentages', () => {
		it('returns 100% captained when all users captain the same item', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'F', 'G', 'H', 'I'], captain: 'A' },
				{ drafted_items: ['A', 'J', 'B', 'C', 'D'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemA = result.find((s) => s.item_name === 'A');

			expect(itemA?.captained_percentage).toBe(100);
		});

		it('returns 0% captained when no users captain an item', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'B' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemC = result.find((s) => s.item_name === 'C');

			expect(itemC?.captained_percentage).toBe(0);
		});

		it('captained percentage is always less than or equal to drafted percentage', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'B' },
				{ drafted_items: ['A', 'F', 'G', 'H', 'I'], captain: 'F' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			for (const stat of result) {
				expect(stat.captained_percentage).toBeLessThanOrEqual(stat.drafted_percentage);
			}
		});
	});

	describe('sorting', () => {
		it('returns results sorted by rank ascending', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			expect(result.map((s) => s.item_name)).toEqual([
				'A',
				'B',
				'C',
				'D',
				'E',
				'F',
				'G',
				'H',
				'I',
				'J'
			]);
		});

		it('includes rank in each result', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);
			const itemA = result.find((s) => s.item_name === 'A');
			const itemJ = result.find((s) => s.item_name === 'J');

			expect(itemA?.rank).toBe(1);
			expect(itemJ?.rank).toBe(10);
		});
	});

	describe('empty submissions', () => {
		it('returns zero percentages for all items when no submissions', () => {
			const result = calculateCrowdStatsFromSubmissions([], allItems, trueRankings);

			expect(result).toHaveLength(allItems.length);
			for (const stat of result) {
				expect(stat.drafted_percentage).toBe(0);
				expect(stat.captained_percentage).toBe(0);
			}
		});

		it('still includes all items when no submissions', () => {
			const result = calculateCrowdStatsFromSubmissions([], allItems, trueRankings);

			const itemNames = result.map((s) => s.item_name);
			for (const item of allItems) {
				expect(itemNames).toContain(item);
			}
		});
	});

	describe('single submission', () => {
		it('handles single user submission correctly', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			// Drafted items should be 100%
			for (const item of ['A', 'B', 'C', 'D', 'E']) {
				const stat = result.find((s) => s.item_name === item);
				expect(stat?.drafted_percentage).toBe(100);
			}

			// Non-drafted items should be 0%
			for (const item of ['F', 'G', 'H', 'I', 'J']) {
				const stat = result.find((s) => s.item_name === item);
				expect(stat?.drafted_percentage).toBe(0);
			}

			// Captain should be 100%
			const itemA = result.find((s) => s.item_name === 'A');
			expect(itemA?.captained_percentage).toBe(100);
		});
	});

	describe('data integrity', () => {
		it('returns correct structure for each stat', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			for (const stat of result) {
				expect(stat).toHaveProperty('item_name');
				expect(stat).toHaveProperty('rank');
				expect(stat).toHaveProperty('drafted_percentage');
				expect(stat).toHaveProperty('captained_percentage');
				expect(typeof stat.item_name).toBe('string');
				expect(typeof stat.rank).toBe('number');
				expect(typeof stat.drafted_percentage).toBe('number');
				expect(typeof stat.captained_percentage).toBe('number');
			}
		});

		it('returns stats for all items even if never drafted', () => {
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			expect(result).toHaveLength(allItems.length);
		});
	});

	describe('edge cases', () => {
		it('handles many submissions efficiently', () => {
			// Generate 1000 submissions
			const submissions: SubmissionData[] = [];
			for (let i = 0; i < 1000; i++) {
				submissions.push({
					drafted_items: ['A', 'B', 'C', 'D', 'E'],
					captain: 'A'
				});
			}

			const result = calculateCrowdStatsFromSubmissions(submissions, allItems, trueRankings);

			const itemA = result.find((s) => s.item_name === 'A');
			expect(itemA?.drafted_percentage).toBe(100);
			expect(itemA?.captained_percentage).toBe(100);
		});

		it('handles unusual ranking values', () => {
			const weirdRankings: Record<string, number> = {
				A: 100,
				B: 200,
				C: 300
			};
			const items = ['A', 'B', 'C'];
			const submissions: SubmissionData[] = [
				{ drafted_items: ['A', 'B', 'C', 'A', 'B'], captain: 'A' } // Note: duplicate items in draft
			];

			const result = calculateCrowdStatsFromSubmissions(submissions, items, weirdRankings);

			expect(result.map((s) => s.item_name)).toEqual(['A', 'B', 'C']); // Sorted by rank
		});
	});
});
