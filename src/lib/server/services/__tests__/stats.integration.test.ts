/**
 * Integration tests for stats service database functions
 *
 * Tests calculateCrowdStats with mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { calculateCrowdStats } from '../stats';

// Mock the Supabase client
vi.mock('$lib/server/supabaseAdmin', () => ({
	supabaseAdmin: {
		from: vi.fn()
	}
}));

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

function createMockQueryChain(data: unknown[] | null, error: unknown | null = null) {
	return {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockResolvedValue({ data, error })
	};
}

describe('calculateCrowdStats', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('fetches submissions for the puzzle', async () => {
		const submissions = [
			{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
			{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'B' }
		];
		const mockChain = createMockQueryChain(submissions);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await calculateCrowdStats('puzzle-123', allItems, trueRankings);

		expect(supabaseAdmin.from).toHaveBeenCalledWith('submissions');
		expect(mockChain.select).toHaveBeenCalledWith('drafted_items, captain');
		expect(mockChain.eq).toHaveBeenCalledWith('puzzle_id', 'puzzle-123');
	});

	it('returns zero stats when no submissions', async () => {
		const mockChain = createMockQueryChain([]);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await calculateCrowdStats('puzzle-123', allItems, trueRankings);

		expect(result).toHaveLength(allItems.length);
		for (const stat of result) {
			expect(stat.drafted_percentage).toBe(0);
			expect(stat.captained_percentage).toBe(0);
		}
	});

	it('returns zero stats on database error', async () => {
		const mockChain = createMockQueryChain(null, { message: 'DB error' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await calculateCrowdStats('puzzle-123', allItems, trueRankings);

		expect(result).toHaveLength(allItems.length);
		for (const stat of result) {
			expect(stat.drafted_percentage).toBe(0);
			expect(stat.captained_percentage).toBe(0);
		}
	});

	it('calculates correct percentages from real submissions', async () => {
		const submissions = [
			{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
			{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' },
			{ drafted_items: ['F', 'G', 'H', 'I', 'J'], captain: 'F' }
		];
		const mockChain = createMockQueryChain(submissions);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await calculateCrowdStats('puzzle-123', allItems, trueRankings);

		// Item A: drafted by 2/3 = 66.7%, captained by 2/3 = 66.7%
		const itemA = result.find((s) => s.item_name === 'A');
		expect(itemA?.drafted_percentage).toBe(66.7);
		expect(itemA?.captained_percentage).toBe(66.7);

		// Item F: drafted by 1/3 = 33.3%, captained by 1/3 = 33.3%
		const itemF = result.find((s) => s.item_name === 'F');
		expect(itemF?.drafted_percentage).toBe(33.3);
		expect(itemF?.captained_percentage).toBe(33.3);
	});

	it('includes rank in results', async () => {
		const submissions = [{ drafted_items: ['A', 'B', 'C', 'D', 'E'], captain: 'A' }];
		const mockChain = createMockQueryChain(submissions);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await calculateCrowdStats('puzzle-123', allItems, trueRankings);

		const itemA = result.find((s) => s.item_name === 'A');
		const itemJ = result.find((s) => s.item_name === 'J');
		expect(itemA?.rank).toBe(1);
		expect(itemJ?.rank).toBe(10);
	});

	it('returns results sorted by rank', async () => {
		const submissions = [{ drafted_items: ['J', 'I', 'H', 'G', 'F'], captain: 'J' }];
		const mockChain = createMockQueryChain(submissions);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await calculateCrowdStats('puzzle-123', allItems, trueRankings);

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
});
