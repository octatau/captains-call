/**
 * Integration tests for submission service database functions
 *
 * Tests database-dependent functions with mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import {
	hasSubmitted,
	getSubmission,
	createSubmission,
	getUserSubmissionsForPuzzles
} from '../submission';
import type { DBSubmission } from '$lib/types';

// Mock the Supabase client
vi.mock('$lib/server/supabaseAdmin', () => ({
	supabaseAdmin: {
		from: vi.fn()
	}
}));

const mockSubmission: DBSubmission = {
	id: 'sub-123',
	user_id: 'user-123',
	puzzle_id: 'puzzle-123',
	drafted_items: ['A', 'B', 'C', 'D', 'E'],
	captain: 'A',
	base_score: 5,
	captain_bonus: 1,
	total_score: 6,
	submitted_at: '2024-03-15T12:00:00Z'
};

function createMockSingleQueryChain(data: unknown | null, error: unknown | null = null) {
	return {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data, error })
	};
}

describe('hasSubmitted', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns true when submission exists', async () => {
		const mockChain = createMockSingleQueryChain({ id: 'sub-123' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await hasSubmitted('user-123', 'puzzle-123');

		expect(supabaseAdmin.from).toHaveBeenCalledWith('submissions');
		expect(mockChain.select).toHaveBeenCalledWith('id');
		expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
		expect(mockChain.eq).toHaveBeenCalledWith('puzzle_id', 'puzzle-123');
		expect(result).toBe(true);
	});

	it('returns false when no submission exists', async () => {
		const mockChain = createMockSingleQueryChain(null);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await hasSubmitted('user-123', 'puzzle-999');

		expect(result).toBe(false);
	});

	it('returns false on database error', async () => {
		const mockChain = createMockSingleQueryChain(null, { message: 'DB error' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await hasSubmitted('user-123', 'puzzle-123');

		expect(result).toBe(false);
	});
});

describe('getSubmission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns submission when found', async () => {
		const mockChain = createMockSingleQueryChain(mockSubmission);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getSubmission('user-123', 'puzzle-123');

		expect(mockChain.select).toHaveBeenCalledWith('*');
		expect(result).toEqual(mockSubmission);
	});

	it('returns null when not found', async () => {
		const mockChain = createMockSingleQueryChain(null);
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getSubmission('user-123', 'puzzle-999');

		expect(result).toBeNull();
	});

	it('returns null on database error', async () => {
		const mockChain = createMockSingleQueryChain(null, { message: 'DB error' });
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getSubmission('user-123', 'puzzle-123');

		expect(result).toBeNull();
	});
});

describe('createSubmission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates submission and returns success', async () => {
		const mockChain = {
			insert: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await createSubmission({
			userId: 'user-123',
			puzzleId: 'puzzle-123',
			draftedItems: ['A', 'B', 'C', 'D', 'E'],
			captain: 'A',
			score: { baseScore: 5, captainBonus: 1, totalScore: 6 }
		});

		expect(supabaseAdmin.from).toHaveBeenCalledWith('submissions');
		expect(mockChain.insert).toHaveBeenCalledWith({
			user_id: 'user-123',
			puzzle_id: 'puzzle-123',
			drafted_items: ['A', 'B', 'C', 'D', 'E'],
			captain: 'A',
			base_score: 5,
			captain_bonus: 1,
			total_score: 6
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.submission).toEqual(mockSubmission);
		}
	});

	it('returns error on database failure', async () => {
		const mockChain = {
			insert: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await createSubmission({
			userId: 'user-123',
			puzzleId: 'puzzle-123',
			draftedItems: ['A', 'B', 'C', 'D', 'E'],
			captain: 'A',
			score: { baseScore: 5, captainBonus: 1, totalScore: 6 }
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe('Failed to save submission. Please try again.');
		}

		consoleSpy.mockRestore();
	});
});

describe('getUserSubmissionsForPuzzles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns map of submissions', async () => {
		const submissions = [
			{ puzzle_id: 'p1', total_score: 5, submitted_at: '2024-03-15T12:00:00Z' },
			{ puzzle_id: 'p2', total_score: 3, submitted_at: '2024-03-14T12:00:00Z' }
		];
		const mockChain = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockResolvedValue({ data: submissions, error: null })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getUserSubmissionsForPuzzles('user-123', ['p1', 'p2', 'p3']);

		expect(mockChain.select).toHaveBeenCalledWith('puzzle_id, total_score, submitted_at');
		expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
		expect(mockChain.in).toHaveBeenCalledWith('puzzle_id', ['p1', 'p2', 'p3']);

		expect(result.size).toBe(2);
		expect(result.get('p1')).toEqual({ total_score: 5, submitted_at: '2024-03-15T12:00:00Z' });
		expect(result.get('p2')).toEqual({ total_score: 3, submitted_at: '2024-03-14T12:00:00Z' });
		expect(result.get('p3')).toBeUndefined();
	});

	it('returns empty map when no submissions', async () => {
		const mockChain = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockResolvedValue({ data: [], error: null })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getUserSubmissionsForPuzzles('user-123', ['p1', 'p2']);

		expect(result.size).toBe(0);
	});

	it('returns empty map on database error', async () => {
		const mockChain = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
		};
		vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain as never);

		const result = await getUserSubmissionsForPuzzles('user-123', ['p1', 'p2']);

		expect(result.size).toBe(0);
	});
});
