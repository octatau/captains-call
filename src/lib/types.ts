// TypeScript type definitions for Captain's Call

export interface Puzzle {
	id: string;
	puzzle_number: number;
	daily_date: string;
	prompt: string;
	items: string[]; // Shuffled per-user
	has_submitted: boolean;
}

export interface Submission {
	drafted_items: string[];
	captain: string;
	base_score: number;
	captain_bonus: number;
	total_score: number;
}

export interface Results {
	submission: Submission;
	puzzle: {
		prompt: string;
		true_rankings: Record<string, number>;
	};
	crowd_stats: CrowdStat[];
	sources: string[]; // NEW: Source citations
	share_text: string; // For Web Share API
}

export interface CrowdStat {
	item_name: string;
	rank: number;
	drafted_percentage: number; // Decimal (e.g., 92.3)
	captained_percentage: number; // Decimal (e.g., 34.1)
}

export interface APIResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// Archive-specific types
export interface ArchivePuzzle {
	id: string;
	puzzle_number: number;
	daily_date: string;
	prompt: string;
	has_submitted: boolean;
	submitted_at?: string; // ISO timestamp if submitted
	total_score?: number; // Score if submitted
}

export interface ArchiveListResponse {
	puzzles: ArchivePuzzle[];
	total_count: number;
}

// Database types (internal use in API routes)
export interface DBPuzzle {
	id: string;
	puzzle_number: number;
	daily_date: string;
	prompt: string;
	items: string[]; // JSONB array from database
	true_rankings: Record<string, number>; // JSONB object from database
	sources: string[]; // JSONB array from database
}

export interface DBSubmission {
	id: string;
	user_id: string;
	puzzle_id: string;
	drafted_items: string[];
	captain: string;
	base_score: number;
	captain_bonus: number;
	total_score: number;
	submitted_at: string;
	client_metadata?: Record<string, unknown>;
}
