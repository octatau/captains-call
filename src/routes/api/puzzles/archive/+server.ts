import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { APIResponse, ArchiveListResponse } from '$lib/types';
import {
	archiveQuerySchema,
	formatValidationError,
	createErrorResponse
} from '$lib/server/validation';
import {
	getArchivePuzzles,
	buildArchiveList,
	getUserSubmissionsForPuzzles
} from '$lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters into an object for Zod validation
		const queryParams = {
			user_id: url.searchParams.get('user_id') ?? undefined
		};

		// Validate with Zod
		const parseResult = archiveQuerySchema.safeParse(queryParams);
		if (!parseResult.success) {
			return formatValidationError(parseResult.error);
		}

		const { user_id } = parseResult.data;

		// Fetch all puzzles
		const puzzles = await getArchivePuzzles();
		if (!puzzles) {
			return createErrorResponse('Failed to fetch puzzles', 500);
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
		return createErrorResponse('Server error. Please try again.', 500);
	}
};
