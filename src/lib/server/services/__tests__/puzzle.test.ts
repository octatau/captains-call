/**
 * Unit tests for puzzle service
 *
 * Tests shuffleItems (pure function via seededShuffle)
 */

import { describe, it, expect } from 'vitest';
import { shuffleItems, buildArchiveList } from '../puzzle';

describe('shuffleItems', () => {
	const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

	describe('determinism', () => {
		it('returns same order for same user+puzzle combination', () => {
			const userId = 'user-123';
			const puzzleId = 'puzzle-456';

			const shuffle1 = shuffleItems(items, userId, puzzleId);
			const shuffle2 = shuffleItems(items, userId, puzzleId);

			expect(shuffle1).toEqual(shuffle2);
		});

		it('returns same order across multiple calls', () => {
			const userId = 'user-abc';
			const puzzleId = 'puzzle-xyz';

			const results: string[][] = [];
			for (let i = 0; i < 10; i++) {
				results.push(shuffleItems(items, userId, puzzleId));
			}

			for (let i = 1; i < results.length; i++) {
				expect(results[i]).toEqual(results[0]);
			}
		});
	});

	describe('uniqueness per user', () => {
		it('returns different order for different users on same puzzle', () => {
			const puzzleId = 'puzzle-same';
			const user1 = 'user-one';
			const user2 = 'user-two';

			const shuffle1 = shuffleItems(items, user1, puzzleId);
			const shuffle2 = shuffleItems(items, user2, puzzleId);

			// Shuffles should be different (extremely unlikely to be same)
			expect(shuffle1).not.toEqual(shuffle2);
		});

		it('returns different order for same user on different puzzles', () => {
			const userId = 'user-same';
			const puzzle1 = 'puzzle-one';
			const puzzle2 = 'puzzle-two';

			const shuffle1 = shuffleItems(items, userId, puzzle1);
			const shuffle2 = shuffleItems(items, userId, puzzle2);

			expect(shuffle1).not.toEqual(shuffle2);
		});
	});

	describe('preservation of items', () => {
		it('returns all original items (no duplicates, no missing)', () => {
			const userId = 'user-test';
			const puzzleId = 'puzzle-test';

			const shuffled = shuffleItems(items, userId, puzzleId);

			expect(shuffled).toHaveLength(items.length);
			expect(shuffled.sort()).toEqual([...items].sort());
		});

		it('does not modify the original array', () => {
			const original = ['A', 'B', 'C', 'D', 'E'];
			const originalCopy = [...original];
			const userId = 'user-test';
			const puzzleId = 'puzzle-test';

			shuffleItems(original, userId, puzzleId);

			expect(original).toEqual(originalCopy);
		});
	});

	describe('edge cases', () => {
		it('handles empty array', () => {
			const result = shuffleItems([], 'user', 'puzzle');
			expect(result).toEqual([]);
		});

		it('handles single item array', () => {
			const result = shuffleItems(['A'], 'user', 'puzzle');
			expect(result).toEqual(['A']);
		});

		it('handles two item array', () => {
			const result = shuffleItems(['A', 'B'], 'user', 'puzzle');
			expect(result).toHaveLength(2);
			expect(result.sort()).toEqual(['A', 'B']);
		});

		it('handles empty userId', () => {
			const result = shuffleItems(items, '', 'puzzle');
			expect(result).toHaveLength(items.length);
		});

		it('handles empty puzzleId', () => {
			const result = shuffleItems(items, 'user', '');
			expect(result).toHaveLength(items.length);
		});

		it('handles special characters in seed', () => {
			const userId = 'user-with-special-chars-!@#$%';
			const puzzleId = 'puzzle-uuid-format-550e8400-e29b-41d4-a716-446655440000';

			const result = shuffleItems(items, userId, puzzleId);
			expect(result).toHaveLength(items.length);
			expect(result.sort()).toEqual([...items].sort());
		});
	});

	describe('shuffle quality', () => {
		it('produces different orderings for different seeds', () => {
			const orderings = new Set<string>();
			const puzzleId = 'puzzle';

			// Try 100 different user IDs
			for (let i = 0; i < 100; i++) {
				const userId = `user-${i}`;
				const shuffled = shuffleItems(items, userId, puzzleId);
				orderings.add(JSON.stringify(shuffled));
			}

			// Should have many unique orderings (not all the same)
			// With 10 items, there are 3.6M possible orderings
			expect(orderings.size).toBeGreaterThan(90);
		});

		it('does not always keep first item in first position', () => {
			let firstItemMoved = false;

			for (let i = 0; i < 50; i++) {
				const shuffled = shuffleItems(items, `user-${i}`, 'puzzle');
				if (shuffled[0] !== items[0]) {
					firstItemMoved = true;
					break;
				}
			}

			expect(firstItemMoved).toBe(true);
		});

		it('does not always keep last item in last position', () => {
			let lastItemMoved = false;

			for (let i = 0; i < 50; i++) {
				const shuffled = shuffleItems(items, `user-${i}`, 'puzzle');
				if (shuffled[shuffled.length - 1] !== items[items.length - 1]) {
					lastItemMoved = true;
					break;
				}
			}

			expect(lastItemMoved).toBe(true);
		});
	});
});

describe('buildArchiveList', () => {
	const puzzles = [
		{ id: 'p1', puzzle_number: 1, daily_date: '2024-01-01', prompt: 'Puzzle 1' },
		{ id: 'p2', puzzle_number: 2, daily_date: '2024-01-02', prompt: 'Puzzle 2' },
		{ id: 'p3', puzzle_number: 3, daily_date: '2024-01-03', prompt: 'Puzzle 3' }
	];

	it('marks puzzles with submissions as completed', () => {
		const submissionsMap = new Map([
			['p1', { total_score: 5, submitted_at: '2024-01-01T12:00:00Z' }]
		]);

		const result = buildArchiveList(puzzles, submissionsMap);

		const puzzle1 = result.find((p) => p.id === 'p1');
		expect(puzzle1?.has_submitted).toBe(true);
		expect(puzzle1?.total_score).toBe(5);
		expect(puzzle1?.submitted_at).toBe('2024-01-01T12:00:00Z');
	});

	it('marks puzzles without submissions as incomplete', () => {
		const submissionsMap = new Map([
			['p1', { total_score: 5, submitted_at: '2024-01-01T12:00:00Z' }]
		]);

		const result = buildArchiveList(puzzles, submissionsMap);

		const puzzle2 = result.find((p) => p.id === 'p2');
		expect(puzzle2?.has_submitted).toBe(false);
		expect(puzzle2?.total_score).toBeUndefined();
		expect(puzzle2?.submitted_at).toBeUndefined();
	});

	it('returns all puzzle fields in result', () => {
		const submissionsMap = new Map<string, { total_score: number; submitted_at: string }>();

		const result = buildArchiveList(puzzles, submissionsMap);

		for (const puzzle of result) {
			expect(puzzle).toHaveProperty('id');
			expect(puzzle).toHaveProperty('puzzle_number');
			expect(puzzle).toHaveProperty('daily_date');
			expect(puzzle).toHaveProperty('prompt');
			expect(puzzle).toHaveProperty('has_submitted');
		}
	});

	it('handles empty puzzles array', () => {
		const submissionsMap = new Map<string, { total_score: number; submitted_at: string }>();

		const result = buildArchiveList([], submissionsMap);

		expect(result).toEqual([]);
	});

	it('handles empty submissions map', () => {
		const submissionsMap = new Map<string, { total_score: number; submitted_at: string }>();

		const result = buildArchiveList(puzzles, submissionsMap);

		expect(result).toHaveLength(3);
		for (const puzzle of result) {
			expect(puzzle.has_submitted).toBe(false);
		}
	});

	it('handles all puzzles completed', () => {
		const submissionsMap = new Map([
			['p1', { total_score: 5, submitted_at: '2024-01-01T12:00:00Z' }],
			['p2', { total_score: 3, submitted_at: '2024-01-02T12:00:00Z' }],
			['p3', { total_score: 8, submitted_at: '2024-01-03T12:00:00Z' }]
		]);

		const result = buildArchiveList(puzzles, submissionsMap);

		for (const puzzle of result) {
			expect(puzzle.has_submitted).toBe(true);
		}
	});

	it('preserves puzzle order from input', () => {
		const submissionsMap = new Map<string, { total_score: number; submitted_at: string }>();

		const result = buildArchiveList(puzzles, submissionsMap);

		expect(result[0].id).toBe('p1');
		expect(result[1].id).toBe('p2');
		expect(result[2].id).toBe('p3');
	});
});
