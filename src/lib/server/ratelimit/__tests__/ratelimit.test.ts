import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	checkRateLimit,
	getClientIp,
	SUBMIT_RATE_LIMIT,
	_store,
	_cleanupExpired
} from '../index';

describe('checkRateLimit', () => {
	beforeEach(() => {
		// Clear the store before each test
		_store.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should allow first request', () => {
		const result = checkRateLimit('test-ip', { maxRequests: 5, windowMs: 1000 });

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it('should decrement remaining count with each request', () => {
		const config = { maxRequests: 5, windowMs: 1000 };

		const r1 = checkRateLimit('test-ip', config);
		expect(r1.remaining).toBe(4);

		const r2 = checkRateLimit('test-ip', config);
		expect(r2.remaining).toBe(3);

		const r3 = checkRateLimit('test-ip', config);
		expect(r3.remaining).toBe(2);
	});

	it('should block requests when limit exceeded', () => {
		const config = { maxRequests: 3, windowMs: 1000 };

		checkRateLimit('test-ip', config); // 1
		checkRateLimit('test-ip', config); // 2
		checkRateLimit('test-ip', config); // 3

		const result = checkRateLimit('test-ip', config);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it('should track different IPs separately', () => {
		const config = { maxRequests: 2, windowMs: 1000 };

		checkRateLimit('ip-1', config);
		checkRateLimit('ip-1', config);
		checkRateLimit('ip-2', config);

		const result1 = checkRateLimit('ip-1', config);
		const result2 = checkRateLimit('ip-2', config);

		expect(result1.allowed).toBe(false);
		expect(result2.allowed).toBe(true);
	});

	it('should reset after window expires', () => {
		const config = { maxRequests: 2, windowMs: 1000 };

		checkRateLimit('test-ip', config);
		checkRateLimit('test-ip', config);

		// Should be blocked
		const blocked = checkRateLimit('test-ip', config);
		expect(blocked.allowed).toBe(false);

		// Advance time past window
		vi.advanceTimersByTime(1001);

		// Should be allowed again
		const allowed = checkRateLimit('test-ip', config);
		expect(allowed.allowed).toBe(true);
		expect(allowed.remaining).toBe(1);
	});

	it('should return correct reset time', () => {
		vi.setSystemTime(new Date('2026-03-17T12:00:00.000Z'));
		const config = { maxRequests: 5, windowMs: 60000 };

		const result = checkRateLimit('test-ip', config);

		// Reset time should be 60 seconds from now
		expect(result.resetTime).toBe(Date.now() + 60000);
	});

	it('should maintain reset time within window', () => {
		vi.setSystemTime(new Date('2026-03-17T12:00:00.000Z'));
		const config = { maxRequests: 5, windowMs: 60000 };

		const r1 = checkRateLimit('test-ip', config);
		const initialResetTime = r1.resetTime;

		vi.advanceTimersByTime(10000); // 10 seconds later

		const r2 = checkRateLimit('test-ip', config);

		// Reset time should not change within the window
		expect(r2.resetTime).toBe(initialResetTime);
	});

	it('should use default config when not provided', () => {
		// Default is 10 requests per minute
		for (let i = 0; i < 10; i++) {
			const result = checkRateLimit('test-ip');
			expect(result.allowed).toBe(true);
		}

		const blocked = checkRateLimit('test-ip');
		expect(blocked.allowed).toBe(false);
	});
});

describe('_cleanupExpired', () => {
	beforeEach(() => {
		_store.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should remove expired entries', () => {
		const config = { maxRequests: 5, windowMs: 1000 };

		checkRateLimit('ip-1', config);
		checkRateLimit('ip-2', config);

		expect(_store.size).toBe(2);

		// Advance past window
		vi.advanceTimersByTime(1001);

		_cleanupExpired();

		expect(_store.size).toBe(0);
	});

	it('should keep non-expired entries', () => {
		const shortConfig = { maxRequests: 5, windowMs: 1000 };
		const longConfig = { maxRequests: 5, windowMs: 10000 };

		checkRateLimit('short-ip', shortConfig);
		checkRateLimit('long-ip', longConfig);

		expect(_store.size).toBe(2);

		// Advance past short window but not long
		vi.advanceTimersByTime(2000);

		_cleanupExpired();

		expect(_store.size).toBe(1);
		expect(_store.has('long-ip')).toBe(true);
		expect(_store.has('short-ip')).toBe(false);
	});
});

describe('getClientIp', () => {
	it('should extract Netlify client IP header', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-nf-client-connection-ip': '192.168.1.1'
			}
		});

		expect(getClientIp(request)).toBe('192.168.1.1');
	});

	it('should prefer Netlify header over x-forwarded-for', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-nf-client-connection-ip': '192.168.1.1',
				'x-forwarded-for': '10.0.0.1'
			}
		});

		expect(getClientIp(request)).toBe('192.168.1.1');
	});

	it('should fall back to x-forwarded-for', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-forwarded-for': '10.0.0.1'
			}
		});

		expect(getClientIp(request)).toBe('10.0.0.1');
	});

	it('should extract first IP from x-forwarded-for chain', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-forwarded-for': '10.0.0.1, 172.16.0.1, 192.168.1.1'
			}
		});

		expect(getClientIp(request)).toBe('10.0.0.1');
	});

	it('should trim whitespace from IPs', () => {
		const request = new Request('http://example.com', {
			headers: {
				'x-forwarded-for': '  10.0.0.1  ,  172.16.0.1  '
			}
		});

		expect(getClientIp(request)).toBe('10.0.0.1');
	});

	it('should return unknown when no IP headers present', () => {
		const request = new Request('http://example.com');

		expect(getClientIp(request)).toBe('unknown');
	});
});

describe('SUBMIT_RATE_LIMIT', () => {
	it('should have reasonable defaults for a daily game', () => {
		// 10 requests per minute is generous for a daily game
		expect(SUBMIT_RATE_LIMIT.maxRequests).toBe(10);
		expect(SUBMIT_RATE_LIMIT.windowMs).toBe(60000);
	});
});
