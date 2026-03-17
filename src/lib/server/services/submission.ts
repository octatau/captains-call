/**
 * Submission service - handles user submissions for puzzles
 *
 * Centralizes all submission-related database operations.
 */

import type { DBSubmission } from '$lib/types';
import { supabaseAdmin } from '$lib/supabaseClient';
import type { ScoreResult } from './scoring';

export interface CreateSubmissionParams {
	userId: string;
	puzzleId: string;
	draftedItems: string[];
	captain: string;
	score: ScoreResult;
}

export interface SubmissionResult {
	success: true;
	submission: DBSubmission;
}

export interface SubmissionError {
	success: false;
	error: string;
}

/**
 * Check if a user has already submitted for a puzzle
 *
 * @param userId - User's unique identifier
 * @param puzzleId - Puzzle's unique identifier
 * @returns true if user has submitted, false otherwise
 */
export async function hasSubmitted(userId: string, puzzleId: string): Promise<boolean> {
	const { data } = await supabaseAdmin
		.from('submissions')
		.select('id')
		.eq('user_id', userId)
		.eq('puzzle_id', puzzleId)
		.single();

	return !!data;
}

/**
 * Get a user's submission for a specific puzzle
 *
 * @param userId - User's unique identifier
 * @param puzzleId - Puzzle's unique identifier
 * @returns The submission data or null if not found
 */
export async function getSubmission(
	userId: string,
	puzzleId: string
): Promise<DBSubmission | null> {
	const { data, error } = await supabaseAdmin
		.from('submissions')
		.select('*')
		.eq('user_id', userId)
		.eq('puzzle_id', puzzleId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DBSubmission;
}

/**
 * Create a new submission for a puzzle
 *
 * Does NOT check for duplicate submissions - caller should use hasSubmitted() first.
 *
 * @param params - Submission parameters
 * @returns The created submission or an error
 */
export async function createSubmission(
	params: CreateSubmissionParams
): Promise<SubmissionResult | SubmissionError> {
	const { userId, puzzleId, draftedItems, captain, score } = params;

	const { data, error } = await supabaseAdmin
		.from('submissions')
		.insert({
			user_id: userId,
			puzzle_id: puzzleId,
			drafted_items: draftedItems,
			captain,
			base_score: score.baseScore,
			captain_bonus: score.captainBonus,
			total_score: score.totalScore
		})
		.select()
		.single();

	if (error || !data) {
		console.error('Error saving submission:', error);
		return {
			success: false,
			error: 'Failed to save submission. Please try again.'
		};
	}

	return {
		success: true,
		submission: data as DBSubmission
	};
}

/**
 * Get submissions for multiple puzzles for a specific user
 *
 * Used for archive listing to show completion status.
 *
 * @param userId - User's unique identifier
 * @param puzzleIds - Array of puzzle IDs to check
 * @returns Map of puzzle_id to submission data
 */
export async function getUserSubmissionsForPuzzles(
	userId: string,
	puzzleIds: string[]
): Promise<Map<string, { total_score: number; submitted_at: string }>> {
	const { data } = await supabaseAdmin
		.from('submissions')
		.select('puzzle_id, total_score, submitted_at')
		.eq('user_id', userId)
		.in('puzzle_id', puzzleIds);

	const submissionsMap = new Map<string, { total_score: number; submitted_at: string }>();

	if (data) {
		for (const sub of data) {
			submissionsMap.set(sub.puzzle_id, {
				total_score: sub.total_score,
				submitted_at: sub.submitted_at
			});
		}
	}

	return submissionsMap;
}
