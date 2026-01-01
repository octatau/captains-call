import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabaseClient';
import { isValidUUID } from '$lib/utils';
import type { APIResponse, ArchivePuzzle, ArchiveListResponse } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const user_id = url.searchParams.get('user_id');

		// Validate user_id
		if (!user_id || !isValidUUID(user_id)) {
			return json(
				{ success: false, error: 'Invalid user_id format' } as APIResponse<never>,
				{ status: 400 }
			);
		}

		// Fetch all puzzles ordered by date (newest first)
		const { data: puzzlesData, error: puzzlesError } = await supabaseAdmin
			.from('puzzles')
			.select('id, puzzle_number, daily_date, prompt')
			.order('daily_date', { ascending: false });

		if (puzzlesError) {
			console.error('Error fetching puzzles:', puzzlesError);
			return json(
				{ success: false, error: 'Failed to fetch puzzles' } as APIResponse<never>,
				{ status: 500 }
			);
		}

		if (!puzzlesData || puzzlesData.length === 0) {
			return json({
				success: true,
				data: {
					puzzles: [],
					total_count: 0
				}
			} as APIResponse<ArchiveListResponse>);
		}

		// Fetch user's submissions for all these puzzles
		const puzzleIds = puzzlesData.map((p) => p.id);
		const { data: submissionsData } = await supabaseAdmin
			.from('submissions')
			.select('puzzle_id, total_score, submitted_at')
			.eq('user_id', user_id)
			.in('puzzle_id', puzzleIds);

		// Create a map of puzzle_id to submission data
		const submissionsMap = new Map();
		if (submissionsData) {
			submissionsData.forEach((sub) => {
				submissionsMap.set(sub.puzzle_id, {
					total_score: sub.total_score,
					submitted_at: sub.submitted_at
				});
			});
		}

		// Build archive list with completion status
		const archivePuzzles: ArchivePuzzle[] = puzzlesData.map((puzzle) => {
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

		return json({
			success: true,
			data: {
				puzzles: archivePuzzles,
				total_count: archivePuzzles.length
			}
		} as APIResponse<ArchiveListResponse>);
	} catch (error) {
		console.error('Error fetching archive:', error);
		return json(
			{
				success: false,
				error: 'Server error. Please try again.'
			} as APIResponse<never>,
			{ status: 500 }
		);
	}
};
