/**
 * Puzzle service - handles puzzle retrieval and transformation
 *
 * Centralizes all puzzle-related database queries and business logic.
 */

import type { DBPuzzle, Puzzle, ArchivePuzzle } from '$lib/types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { seededShuffle, getUserLocalDate } from '$lib/utils';

export interface PuzzleQueryOptions {
	puzzleId?: string;
	puzzleNumber?: number;
	date?: string;
	timezoneOffset?: number;
}

export interface PuzzleWithSubmissionStatus {
	puzzle: DBPuzzle;
	hasSubmitted: boolean;
}

/**
 * Get a puzzle by ID
 *
 * @param puzzleId - UUID of the puzzle
 * @returns The puzzle data or null if not found
 */
export async function getPuzzleById(puzzleId: string): Promise<DBPuzzle | null> {
	const { data, error } = await supabaseAdmin
		.from('puzzles')
		.select('*')
		.eq('id', puzzleId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DBPuzzle;
}

/**
 * Get a puzzle by puzzle number
 *
 * @param puzzleNumber - Sequential puzzle number
 * @returns The puzzle data or null if not found
 */
export async function getPuzzleByNumber(puzzleNumber: number): Promise<DBPuzzle | null> {
	const { data, error } = await supabaseAdmin
		.from('puzzles')
		.select('*')
		.eq('puzzle_number', puzzleNumber)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DBPuzzle;
}

/**
 * Get a puzzle by date
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns The puzzle data or null if not found
 */
export async function getPuzzleByDate(date: string): Promise<DBPuzzle | null> {
	const { data, error } = await supabaseAdmin
		.from('puzzles')
		.select('*')
		.eq('daily_date', date)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DBPuzzle;
}

/**
 * Get today's puzzle based on user's timezone
 *
 * @param timezoneOffset - User's timezone offset in minutes (optional)
 * @returns The puzzle data or null if not found
 */
export async function getTodaysPuzzle(timezoneOffset?: number): Promise<DBPuzzle | null> {
	const userLocalDate = getUserLocalDate(timezoneOffset);
	return getPuzzleByDate(userLocalDate);
}

/**
 * Get a puzzle using flexible query options
 *
 * Priority: puzzleId > puzzleNumber > date > today (based on timezone)
 *
 * @param options - Query options
 * @returns The puzzle data or null if not found
 */
export async function getPuzzle(options: PuzzleQueryOptions): Promise<DBPuzzle | null> {
	if (options.puzzleId) {
		return getPuzzleById(options.puzzleId);
	}

	if (options.puzzleNumber !== undefined) {
		return getPuzzleByNumber(options.puzzleNumber);
	}

	if (options.date) {
		return getPuzzleByDate(options.date);
	}

	// Default: today's puzzle
	return getTodaysPuzzle(options.timezoneOffset);
}

/**
 * Shuffle puzzle items deterministically based on user ID
 *
 * Ensures each user sees a consistent shuffle, but different users
 * see different orderings. This prevents sharing of item positions.
 *
 * @param items - Original item list
 * @param userId - User's unique identifier
 * @param puzzleId - Puzzle's unique identifier
 * @returns Shuffled items (deterministic for same user+puzzle)
 */
export function shuffleItems(items: string[], userId: string, puzzleId: string): string[] {
	const seed = `${userId}_${puzzleId}`;
	return seededShuffle(items, seed);
}

/**
 * Transform a database puzzle to an API-safe puzzle
 *
 * Removes sensitive fields (true_rankings, sources) and shuffles items.
 *
 * @param dbPuzzle - Raw puzzle from database
 * @param userId - User's ID for deterministic shuffle
 * @param hasSubmitted - Whether user has already submitted
 * @returns API-safe puzzle object
 */
export function toApiPuzzle(dbPuzzle: DBPuzzle, userId: string, hasSubmitted: boolean): Puzzle {
	return {
		id: dbPuzzle.id,
		puzzle_number: dbPuzzle.puzzle_number,
		daily_date: dbPuzzle.daily_date,
		prompt: dbPuzzle.prompt,
		items: shuffleItems(dbPuzzle.items, userId, dbPuzzle.id),
		has_submitted: hasSubmitted
	};
}

/**
 * Get all puzzles for archive listing
 *
 * Returns puzzles in reverse chronological order (newest first).
 *
 * @returns Array of puzzle data for archive display
 */
export async function getArchivePuzzles(): Promise<
	Pick<DBPuzzle, 'id' | 'puzzle_number' | 'daily_date' | 'prompt'>[] | null
> {
	const { data, error } = await supabaseAdmin
		.from('puzzles')
		.select('id, puzzle_number, daily_date, prompt')
		.order('daily_date', { ascending: false });

	if (error) {
		return null;
	}

	return data as Pick<DBPuzzle, 'id' | 'puzzle_number' | 'daily_date' | 'prompt'>[];
}

/**
 * Build archive puzzle list with user's submission status
 *
 * @param puzzles - Raw puzzle data from database
 * @param submissionsMap - Map of puzzle_id to submission data
 * @returns Array of ArchivePuzzle with completion status
 */
export function buildArchiveList(
	puzzles: Pick<DBPuzzle, 'id' | 'puzzle_number' | 'daily_date' | 'prompt'>[],
	submissionsMap: Map<string, { total_score: number; submitted_at: string }>
): ArchivePuzzle[] {
	return puzzles.map((puzzle) => {
		const submission = submissionsMap.get(puzzle.id);

		return {
			id: puzzle.id,
			puzzle_number: puzzle.puzzle_number,
			daily_date: puzzle.daily_date,
			prompt: puzzle.prompt,
			has_submitted: !!submission,
			submitted_at: submission?.submitted_at,
			total_score: submission?.total_score
		};
	});
}
