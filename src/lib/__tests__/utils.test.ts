/**
 * Unit tests for utility functions
 *
 * Tests date/timezone utilities and other pure functions in utils.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getUserLocalDate,
	isValidUUID,
	seededShuffle,
	generateShareText,
	formatDate,
	isToday,
	calculateTimeUntilNextPuzzle
} from '../utils';
import { TOP_N, MAX_TOTAL_SCORE } from '$lib/config/constants';

describe('getUserLocalDate', () => {
	beforeEach(() => {
		// Mock Date to a known point in time: 2024-03-15 14:30:00 UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T14:30:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns UTC date when no timezone offset provided', () => {
		const result = getUserLocalDate();
		expect(result).toBe('2024-03-15');
	});

	it('returns UTC date when timezone offset is 0', () => {
		const result = getUserLocalDate(0);
		expect(result).toBe('2024-03-15');
	});

	it('returns correct date for positive timezone offset (behind UTC)', () => {
		// Pacific Time: UTC-8 (480 minutes)
		// At 14:30 UTC, it's 06:30 Pacific (still same day)
		const result = getUserLocalDate(480);
		expect(result).toBe('2024-03-15');
	});

	it('returns previous day for large positive offset (behind UTC)', () => {
		// At 02:30 UTC, Hawaii (UTC-10, 600 min offset) would be 16:30 on the previous day
		vi.setSystemTime(new Date('2024-03-15T02:30:00Z'));
		const result = getUserLocalDate(600);
		expect(result).toBe('2024-03-14');
	});

	it('returns correct date for negative timezone offset (ahead of UTC)', () => {
		// Tokyo: UTC+9 (-540 minutes in JS)
		// At 14:30 UTC, it's 23:30 Tokyo (still same day)
		const result = getUserLocalDate(-540);
		expect(result).toBe('2024-03-15');
	});

	it('returns next day for large negative offset (ahead of UTC)', () => {
		// At 16:00 UTC, Tokyo (UTC+9) would be 01:00 next day
		vi.setSystemTime(new Date('2024-03-15T16:00:00Z'));
		const result = getUserLocalDate(-540);
		expect(result).toBe('2024-03-16');
	});

	it('handles edge case at midnight UTC', () => {
		vi.setSystemTime(new Date('2024-03-15T00:00:00Z'));
		const result = getUserLocalDate();
		expect(result).toBe('2024-03-15');
	});

	it('handles edge case just before midnight UTC', () => {
		vi.setSystemTime(new Date('2024-03-15T23:59:59Z'));
		const result = getUserLocalDate();
		expect(result).toBe('2024-03-15');
	});
});

describe('isValidUUID', () => {
	it('returns true for valid v4 UUID', () => {
		expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
	});

	it('returns true for uppercase UUID', () => {
		expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
	});

	it('returns true for mixed case UUID', () => {
		expect(isValidUUID('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
	});

	it('returns false for empty string', () => {
		expect(isValidUUID('')).toBe(false);
	});

	it('returns false for UUID without dashes', () => {
		expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
	});

	it('returns false for invalid characters', () => {
		expect(isValidUUID('550g8400-e29b-41d4-a716-446655440000')).toBe(false);
	});

	it('returns false for too short UUID', () => {
		expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
	});

	it('returns false for too long UUID', () => {
		expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
	});

	it('returns false for random string', () => {
		expect(isValidUUID('not-a-uuid-at-all')).toBe(false);
	});
});

describe('seededShuffle', () => {
	const items = ['A', 'B', 'C', 'D', 'E'];

	describe('determinism', () => {
		it('returns same result for same seed', () => {
			const result1 = seededShuffle(items, 'test-seed');
			const result2 = seededShuffle(items, 'test-seed');
			expect(result1).toEqual(result2);
		});

		it('returns different results for different seeds', () => {
			const result1 = seededShuffle(items, 'seed-one');
			const result2 = seededShuffle(items, 'seed-two');
			expect(result1).not.toEqual(result2);
		});
	});

	describe('preservation', () => {
		it('preserves all elements', () => {
			const result = seededShuffle(items, 'any-seed');
			expect(result.sort()).toEqual([...items].sort());
		});

		it('does not modify original array', () => {
			const original = ['A', 'B', 'C'];
			const copy = [...original];
			seededShuffle(original, 'seed');
			expect(original).toEqual(copy);
		});
	});

	describe('edge cases', () => {
		it('handles empty array', () => {
			const result = seededShuffle([], 'seed');
			expect(result).toEqual([]);
		});

		it('handles single element', () => {
			const result = seededShuffle(['A'], 'seed');
			expect(result).toEqual(['A']);
		});

		it('handles empty seed', () => {
			const result = seededShuffle(items, '');
			expect(result).toHaveLength(items.length);
		});
	});
});

describe('generateShareText', () => {
	const trueRankings = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10 };
	const prompt = 'Longest Rivers';
	const host = 'topick.app';

	it('includes puzzle number and prompt in header', () => {
		const result = generateShareText(42, prompt, ['A', 'B', 'C', 'D', 'E'], 'A', trueRankings, 6, host);
		expect(result).toContain('#42');
		expect(result).toContain(prompt);
	});

	it('includes total score', () => {
		const result = generateShareText(1, prompt, ['A', 'B', 'C', 'D', 'E'], 'A', trueRankings, 6, host);
		expect(result).toContain(`6/${MAX_TOTAL_SCORE}`);
	});

	it('uses filled star when captain is #1, hollow when missed', () => {
		const nailed = generateShareText(1, prompt, ['A', 'B', 'C', 'D', 'E'], 'A', trueRankings, 6, host);
		expect(nailed).toContain('⭐');
		expect(nailed).not.toContain('☆');

		const missed = generateShareText(1, prompt, ['A', 'B', 'C', 'D', 'E'], 'B', trueRankings, 5, host);
		expect(missed).toContain('☆');
		expect(missed).not.toContain('⭐');
	});

	it('uses filled dots for top-N hits and hollow dots for misses', () => {
		const result = generateShareText(1, prompt, ['A', 'B', 'C', 'F', 'G'], 'A', trueRankings, 4, host);
		// captain A is excluded from dot row; B, C are hits (●), F, G are misses (○)
		const dotLine = result.split('\n')[1];
		expect(dotLine).toContain('●');
		expect(dotLine).toContain('○');
		expect((dotLine.match(/●/g) || []).length).toBe(2);
		expect((dotLine.match(/○/g) || []).length).toBe(2);
	});

	it('includes host', () => {
		const result = generateShareText(1, prompt, ['A', 'B', 'C', 'D', 'E'], 'A', trueRankings, 6, 'example.com');
		expect(result).toContain('example.com');
	});
});

describe('formatDate', () => {
	it('formats date string correctly', () => {
		const result = formatDate('2024-03-15');
		expect(result).toContain('Mar');
		expect(result).toContain('15');
		expect(result).toContain('2024');
	});

	it('handles single digit day', () => {
		const result = formatDate('2024-03-01');
		expect(result).toContain('Mar');
		expect(result).toContain('1');
	});

	it('handles different months', () => {
		expect(formatDate('2024-01-15')).toContain('Jan');
		expect(formatDate('2024-06-15')).toContain('Jun');
		expect(formatDate('2024-12-15')).toContain('Dec');
	});
});

describe('isToday', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-03-15T14:30:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns true for today', () => {
		expect(isToday('2024-03-15')).toBe(true);
	});

	it('returns false for yesterday', () => {
		expect(isToday('2024-03-14')).toBe(false);
	});

	it('returns false for tomorrow', () => {
		expect(isToday('2024-03-16')).toBe(false);
	});

	it('returns false for different year', () => {
		expect(isToday('2023-03-15')).toBe(false);
	});
});

describe('calculateTimeUntilNextPuzzle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns time until midnight', () => {
		// Set time to 22:30:45
		vi.setSystemTime(new Date('2024-03-15T22:30:45'));
		const result = calculateTimeUntilNextPuzzle();
		expect(result).toBe('01:29:15');
	});

	it('returns close to 24h at just after midnight', () => {
		// Just after midnight
		vi.setSystemTime(new Date('2024-03-15T00:00:01'));
		const result = calculateTimeUntilNextPuzzle();
		expect(result).toBe('23:59:59');
	});

	it('returns 12:00:00 at noon', () => {
		vi.setSystemTime(new Date('2024-03-15T12:00:00'));
		const result = calculateTimeUntilNextPuzzle();
		expect(result).toBe('12:00:00');
	});

	it('pads single digit values', () => {
		vi.setSystemTime(new Date('2024-03-15T23:55:05'));
		const result = calculateTimeUntilNextPuzzle();
		expect(result).toBe('00:04:55');
	});
});
