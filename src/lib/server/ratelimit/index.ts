/**
 * Lightweight in-memory rate limiter for serverless functions.
 *
 * Limitations (acceptable for this use case):
 * - Cold starts reset the counter (each function instance has fresh memory)
 * - Multiple function instances don't share state
 * - Memory grows with unique IPs until function recycles
 *
 * This provides reasonable protection against automated abuse for a casual
 * daily game. The existing hasSubmitted() check already prevents duplicate
 * submissions per user per puzzle at the database level.
 *
 * For production apps requiring strict rate limiting, use Upstash Redis or
 * similar distributed store.
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

interface RateLimitConfig {
	/** Maximum requests allowed in the window */
	maxRequests: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetTime: number;
}

// In-memory store - shared across requests within same function instance
const store = new Map<string, RateLimitEntry>();

// Default config: 10 requests per minute per IP
const DEFAULT_CONFIG: RateLimitConfig = {
	maxRequests: 10,
	windowMs: 60 * 1000
};

/**
 * Clean up expired entries to prevent memory leaks.
 * Called periodically during rate limit checks.
 */
function cleanupExpired(): void {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (now >= entry.resetTime) {
			store.delete(key);
		}
	}
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the client (typically IP address)
 * @param config - Rate limit configuration (optional, uses defaults)
 * @returns Result indicating if request is allowed and remaining quota
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
	const now = Date.now();

	// Cleanup expired entries periodically (roughly every 100 checks)
	if (Math.random() < 0.01) {
		cleanupExpired();
	}

	const entry = store.get(identifier);

	// No existing entry or window expired - start fresh
	if (!entry || now >= entry.resetTime) {
		const resetTime = now + config.windowMs;
		store.set(identifier, { count: 1, resetTime });
		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetTime
		};
	}

	// Within window - check count
	if (entry.count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: entry.resetTime
		};
	}

	// Increment and allow
	entry.count += 1;
	return {
		allowed: true,
		remaining: config.maxRequests - entry.count,
		resetTime: entry.resetTime
	};
}

/**
 * Extract client IP from request headers.
 * Netlify sets x-nf-client-connection-ip for the real client IP.
 * Falls back to x-forwarded-for or a placeholder if not available.
 */
export function getClientIp(request: Request): string {
	// Netlify-specific header (most reliable)
	const netlifyIp = request.headers.get('x-nf-client-connection-ip');
	if (netlifyIp) {
		return netlifyIp;
	}

	// Standard proxy header (may contain multiple IPs)
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		// Take the first IP (original client)
		return forwardedFor.split(',')[0].trim();
	}

	// Fallback - should not happen in production behind Netlify
	return 'unknown';
}

/**
 * Configuration for the /api/submit endpoint.
 * 10 requests per minute is generous for a daily game where users
 * typically submit once per day.
 */
export const SUBMIT_RATE_LIMIT: RateLimitConfig = {
	maxRequests: 10,
	windowMs: 60 * 1000 // 1 minute
};

// Export for testing
export type { RateLimitConfig, RateLimitResult };
export { cleanupExpired as _cleanupExpired, store as _store };
