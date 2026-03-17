import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidUUID } from '$lib/utils';
import type { APIResponse, ArchiveListResponse } from '$lib/types';
import {
	getArchivePuzzles,
	buildArchiveList,
	getUserSubmissionsForPuzzles
} from '$lib/server/services';

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

		// Fetch all puzzles
		const puzzles = await getArchivePuzzles();
		if (!puzzles) {
			return json(
				{ success: false, error: 'Failed to fetch puzzles' } as APIResponse<never>,
				{ status: 500 }
			);
		}

		if (puzzles.length === 0) {
			return json({
				success: true,
				data: {
					puzzles: [],
					total_count: 0
				}
			} as APIResponse<ArchiveListResponse>);
		}

		// Fetch user's submissions for all puzzles
		const puzzleIds = puzzles.map((p) => p.id);
		const submissionsMap = await getUserSubmissionsForPuzzles(user_id, puzzleIds);

		// Build archive list with completion status
		const archivePuzzles = buildArchiveList(puzzles, submissionsMap);

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
