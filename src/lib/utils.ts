// Utility functions for Topick

import { TOP_N, TOP_RANK, MAX_TOTAL_SCORE } from '$lib/config/constants';

const STORAGE_KEY = 'topick_user_id';

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
	// Get true top N in order
	const trueTopN = Object.entries(trueRankings)
		.filter(([_, rank]) => rank <= TOP_N)
		.sort((a, b) => a[1] - b[1])
		.map(([item, _]) => item);

	// Count correct predictions
	const correctCount = trueTopN.filter((item) => draftedItems.includes(item)).length;

	// Check #1 prediction
	const nailedTheOne = trueRankings[captain] === TOP_RANK;

	// Build share text with better formatting and icons
	const lines = [
		`🎯 Topick #${puzzleNumber}`,
		'',
		`🏆 Score: ${totalScore}/${MAX_TOTAL_SCORE}`,
		`✓ Top ${TOP_N}: ${correctCount}/${TOP_N}`,
		`⭐ #1 Pick: ${nailedTheOne ? '✓ Correct!' : '✗ Missed'}`,
		'',
		'Play today at Topickal!'
	];

	return lines.join('\n');
}

/**
 * Format date to display format (e.g., "Jan 1, 2024")
 */
export function formatDate(dateString: string): string {
	// Append T00:00:00 to force local timezone interpretation
	const date = new Date(dateString + 'T00:00:00');
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
	// Append T00:00:00 to force local timezone interpretation
	const date = new Date(dateString + 'T00:00:00');
	const today = new Date();

	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}

/**
 * Generate an image from a DOM element using html2canvas
 * Returns a Blob that can be downloaded or shared
 */
export async function generateImageFromElement(element: HTMLElement): Promise<Blob | null> {
	try {
		const html2canvas = (await import('html2canvas')).default;

		const canvas = await html2canvas(element, {
			backgroundColor: null,
			scale: 2, // Higher quality
			logging: false,
			windowWidth: element.scrollWidth,
			windowHeight: element.scrollHeight
		});

		return new Promise((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob);
			}, 'image/png');
		});
	} catch (error) {
		console.error('Failed to generate image:', error);
		return null;
	}
}

/**
 * Download an image blob with a given filename
 */
export function downloadImage(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Share image using Web Share API (if supported)
 * Falls back to download if not supported
 */
export async function shareImage(blob: Blob, filename: string, text: string): Promise<boolean> {
	// Check if Web Share API Level 2 is supported (allows sharing files)
	if (navigator.share && navigator.canShare) {
		const file = new File([blob], filename, { type: 'image/png' });
		const shareData = {
			files: [file],
			text: text
		};

		if (navigator.canShare(shareData)) {
			try {
				await navigator.share(shareData);
				return true;
			} catch (error) {
				// User cancelled or error occurred
				if (error instanceof Error && error.name === 'AbortError') {
					return false;
				}
				console.error('Share failed:', error);
			}
		}
	}

	// Fallback to download
	downloadImage(blob, filename);
	return false;
}

/**
 * Copy image to clipboard (supported in modern browsers)
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
	try {
		if (navigator.clipboard && 'write' in navigator.clipboard) {
			const item = new ClipboardItem({ 'image/png': blob });
			await navigator.clipboard.write([item]);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Failed to copy image to clipboard:', error);
		return false;
	}
}
