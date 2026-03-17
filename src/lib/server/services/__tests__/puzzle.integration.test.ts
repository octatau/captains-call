/**
 * Integration tests for puzzle service database functions
 *
 * Tests database-dependent functions with mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '$lib/supabaseClient';
import {
	getPuzzleById,
	getPuzzleByNumber,
	getPuzzleByDate,
	getTodaysPuzzle,
	getPuzzle,
	getArchivePuzzles
} from '../puzzle';
import type { DBPuzzle } from '$lib/types';

// Mock the Supabase client
vi.mock('$lib/supabaseClient', () => ({
	supabaseAdmin: {
		from: vi.fn()
	}
}));

const mockPuzzle: DBPuzzle = {
	id: 'puzzle-123',
	puzzle_number: 42,
	daily_date: '2024-03-15',
	prompt: 'Test prompt',
	items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
	true_rankings: { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10 },
	sources: ['Source 1', 'Source 2']
};

function createMockQueryChain(
	finalData: unknown | null,
	finalError: unknown | null = null,
	isSingle = true
) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: finalData, error: finalError })
	};

	// For non-single queries, make select return the result directly
	if (!isSingle) {
		chain.select = vi.fn().mockReturnValue({
			...chain,
			then: (cb: (val: { data: unknown; error: unknown }) => void) => {
				cb({ data: finalData, error: finalError });
				return Promise.resolve({ data: finalData, error: finalError });
			}
		});
	}

	return chain;
}

describe('getPuzzleById', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns puzzle when found', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleById('puzzle-123');

		expect(supabaseAdmin.from).toHaveBeenCalledWith('puzzles');
		expect(mockChain.select).toHaveBeenCalledWith('*');
		expect(mockChain.eq).toHaveBeenCalledWith('id', 'puzzle-123');
		expect(mockChain.single).toHaveBeenCalled();
		expect(result).toEqual(mockPuzzle);
	});

	it('returns null when not found', async () => {
		const mockChain = createMockQueryChain(null, { message: 'Not found' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleById('nonexistent');

		expect(result).toBeNull();
	});

	it('returns null on database error', async () => {
		const mockChain = createMockQueryChain(null, { message: 'Database error' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleById('puzzle-123');

		expect(result).toBeNull();
	});
});

describe('getPuzzleByNumber', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns puzzle when found', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleByNumber(42);

		expect(mockChain.eq).toHaveBeenCalledWith('puzzle_number', 42);
		expect(result).toEqual(mockPuzzle);
	});

	it('returns null when not found', async () => {
		const mockChain = createMockQueryChain(null);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleByNumber(999);

		expect(result).toBeNull();
	});
});

describe('getPuzzleByDate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns puzzle when found', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleByDate('2024-03-15');

		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-15');
		expect(result).toEqual(mockPuzzle);
	});

	it('returns null when not found', async () => {
		const mockChain = createMockQueryChain(null);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getPuzzleByDate('2020-01-01');

		expect(result).toBeNull();
	});
});

describe('getTodaysPuzzle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T14:30:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('fetches puzzle for current UTC date when no timezone', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getTodaysPuzzle();

		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-15');
	});

	it('adjusts date based on timezone offset', async () => {
		// Large negative offset (ahead of UTC) - should be next day
		vi.setSystemTime(new Date('2024-03-15T16:00:00Z'));
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getTodaysPuzzle(-540); // Tokyo UTC+9

		// At 16:00 UTC, Tokyo time is 01:00 next day
		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-16');
	});
});

describe('getPuzzle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T14:30:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('prioritizes puzzleId when provided', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getPuzzle({ puzzleId: 'puzzle-123', puzzleNumber: 42, date: '2024-01-01' });

		expect(mockChain.eq).toHaveBeenCalledWith('id', 'puzzle-123');
	});

	it('uses puzzleNumber when no puzzleId', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getPuzzle({ puzzleNumber: 42, date: '2024-01-01' });

		expect(mockChain.eq).toHaveBeenCalledWith('puzzle_number', 42);
	});

	it('uses date when no puzzleId or puzzleNumber', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getPuzzle({ date: '2024-03-10' });

		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-10');
	});

	it('defaults to today when no options', async () => {
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getPuzzle({});

		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-15');
	});

	it('uses timezone offset for today lookup', async () => {
		vi.setSystemTime(new Date('2024-03-15T16:00:00Z'));
		const mockChain = createMockQueryChain(mockPuzzle);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		await getPuzzle({ timezoneOffset: -540 }); // Tokyo UTC+9

		expect(mockChain.eq).toHaveBeenCalledWith('daily_date', '2024-03-16');
	});
});

describe('getArchivePuzzles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns puzzles ordered by date descending', async () => {
		const puzzles = [
			{ id: 'p1', puzzle_number: 1, daily_date: '2024-03-15', prompt: 'P1' },
			{ id: 'p2', puzzle_number: 2, daily_date: '2024-03-14', prompt: 'P2' }
		];

		const mockChain = {
			select: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: puzzles, error: null })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getArchivePuzzles();

		expect(supabaseAdmin.from).toHaveBeenCalledWith('puzzles');
		expect(mockChain.select).toHaveBeenCalledWith('id, puzzle_number, daily_date, prompt');
		expect(mockChain.order).toHaveBeenCalledWith('daily_date', { ascending: false });
		expect(result).toEqual(puzzles);
	});

	it('returns null on database error', async () => {
		const mockChain = {
			select: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getArchivePuzzles();

		expect(result).toBeNull();
	});
});

// Import afterEach at the top level
import { afterEach } from 'vitest';
