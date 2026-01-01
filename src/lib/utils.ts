// Utility functions for Captain's Call

const STORAGE_KEY = 'captains_call_user_id';

/**
 * Client-side only: Get or create user ID from localStorage
 */
export function getOrCreateUserId(): string {
	if (typeof localStorage === 'undefined') {
		throw new Error('localStorage not available (server-side context)');
	}

	let userId = localStorage.getItem(STORAGE_KEY);

	if (!userId) {
		userId = crypto.randomUUID();
		localStorage.setItem(STORAGE_KEY, userId);
	}

	return userId;
}

/**
 * Get user's timezone offset in minutes (for local midnight calculation)
 * Negative values mean ahead of UTC, positive means behind
 */
export function getTimezoneOffset(): number {
	return new Date().getTimezoneOffset();
}

/**
 * Calculate time until next puzzle (local midnight)
 * Returns formatted string HH:MM:SS
 */
export function calculateTimeUntilNextPuzzle(): string {
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);

	const diff = tomorrow.getTime() - now.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);

	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Server-side seeded shuffle for consistent randomization per user
 * Uses a simple LCG (Linear Congruential Generator) for deterministic shuffling
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
	const arr = [...array];
	let hash = 0;

	// Generate hash from seed string
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0; // Convert to 32-bit integer
	}

	// Fisher-Yates shuffle with seeded random
	for (let i = arr.length - 1; i > 0; i--) {
		// LCG parameters (from Numerical Recipes)
		hash = (hash * 1664525 + 1013904223) | 0;
		const j = Math.abs(hash) % (i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	return arr;
}

/**
 * Share results using Web Share API (with fallback to clipboard)
 * Client-side only
 */
export async function shareResults(shareText: string): Promise<void> {
	// Try Web Share API first (mobile native sharing)
	if (navigator.share) {
		try {
			await navigator.share({ text: shareText });
			return;
		} catch (error) {
			// User cancelled share, ignore
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}
			// Fall through to clipboard on other errors
		}
	}

	// Fallback to clipboard API
	if (navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(shareText);
			alert('Results copied to clipboard!');
			return;
		} catch (error) {
			// Clipboard failed, fall through to manual copy
		}
	}

	// Last resort: show text for manual copy
	prompt('Copy your results:', shareText);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

/**
 * Get user's local date based on timezone offset
 * Used server-side to determine which puzzle to serve
 */
export function getUserLocalDate(timezoneOffsetMinutes?: number): string {
	const now = new Date();

	if (timezoneOffsetMinutes !== undefined) {
		// Adjust for user's timezone
		// Note: getTimezoneOffset returns positive for behind UTC, negative for ahead
		// So we subtract the user's offset and add UTC offset
		const userDate = new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000);
		return userDate.toISOString().split('T')[0];
	}

	// Default to UTC date
	return now.toISOString().split('T')[0];
}

/**
 * Generate share text from submission and puzzle data
 */
export function generateShareText(
	puzzleNumber: number,
	draftedItems: string[],
	captain: string,
	trueRankings: Record<string, number>,
	totalScore: number
): string {
	// Get true top 5 in order
	const trueTop5 = Object.entries(trueRankings)
		.filter(([_, rank]) => rank <= 5)
		.sort((a, b) => a[1] - b[1])
		.map(([item, _]) => item);

	// Generate emoji grid (🟩 = drafted & correct, ⬛ = correct but undrafted)
	const shareEmojis = trueTop5.map((item) => (draftedItems.includes(item) ? '🟩' : '⬛')).join('');

	// Captain status
	const captainStatus = trueRankings[captain] === 1 ? '⭐ Captain: ✅' : '⭐ Captain: ❌';

	return `Daily Draft #${puzzleNumber}\n${shareEmojis}\n${captainStatus}\nScore: ${totalScore}/8`;
}

/**
 * Format date to display format (e.g., "Jan 1, 2024")
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Check if a date is today (in user's local timezone)
 */
export function isToday(dateString: string): boolean {
	const date = new Date(dateString);
	const today = new Date();

	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}
