# Topick - Refactoring Plan

> Hardening a working POC into production-ready code

**Status:** Shipped
**Ship Date:** 2026-03-17

## Summary

The Topick refactor is complete. A working POC was hardened into production-ready code across 6 phases:

- **Phase 1:** Project hygiene (pnpm, Vitest, constants extraction)
- **Phase 2:** Service layer extraction (testable business logic)
- **Phase 3:** Test coverage (219 tests, >90% coverage on services)
- **Phase 4:** Zod validation (type-safe input validation)
- **Phase 5:** Rate limiting (10 req/min per IP on submit endpoint)
- **Phase 6:** Final polish (error boundary, a11y fixes, zero build warnings)

**Deferred items:**
- E2E tests (Playwright) - not in scope for this refactor
- Distributed rate limiting (Upstash Redis) - in-memory sufficient for casual game
- Lighthouse Performance 90+ metric - not verified, can be optimized later

---

## Current State

The POC is functional with solid fundamentals:
- ✅ RLS enabled, service role key server-only
- ✅ Server-side scoring, rankings protected
- ✅ Input validation on all endpoints
- ✅ Database constraints enforced

**What needs improvement:**
- ~~Code duplication (calculateCrowdStats in 2 places)~~ (Phase 2 extracted to single service)
- ~~No test coverage~~ (Phase 1 added Vitest infrastructure)
- ~~Magic numbers scattered~~ (Phase 1 centralized in constants.ts)
- ~~Manual validation (verbose, inconsistent)~~ (Phase 4 replaced with Zod schemas)
- No rate limiting

---

## Tech Stack (No Changes)

| Layer | Technology | Status |
|-------|------------|--------|
| Framework | SvelteKit 2 + Svelte 5 | Keep |
| Styling | Tailwind CSS | Keep |
| Database | Supabase (PostgreSQL) | Keep |
| Hosting | Netlify | Keep |
| Package Manager | npm → pnpm | Migrate |
| Testing | None → Vitest | Add |
| Validation | Manual → Zod | Add |

---

## Refactoring Phases

### Phase 1: Project Hygiene (COMPLETE - REVIEW APPROVED)
**Goal:** Clean foundation for refactoring

**Deliverables:**
- [x] Migrate npm to pnpm
- [x] Add Vitest configuration
- [x] Create `src/lib/config/constants.ts`
- [x] Extract all magic numbers to constants
- [x] Remove unused code (`src/lib/index.ts`)

**Files modified:**
- `package.json` - added vitest, test scripts
- `pnpm-lock.yaml` - created (package-lock.json removed)
- `vite.config.ts` - added vitest config
- `src/lib/config/constants.ts` - created with all game constants
- `src/lib/config/constants.test.ts` - created with basic tests (expanded during QA to 13 tests)
- `src/routes/api/submit/+server.ts` - uses constants
- `src/routes/api/results/+server.ts` - uses constants
- `src/lib/components/DraftInterface.svelte` - uses constants
- `src/lib/components/ResultsDisplay.svelte` - uses constants
- `src/lib/components/ShareCard.svelte` - uses constants
- `src/lib/components/HowToPlayModal.svelte` - uses constants
- `src/lib/utils.ts` - uses constants
- `src/lib/index.ts` - deleted (was unused)

**Exit Criteria:** `pnpm test` runs and passes, constants centralized

**QA Results (2026-03-17):**
- `pnpm install`: PASS (via npx pnpm)
- `pnpm test`: PASS (13 tests)
- `pnpm build`: PASS (with a11y warnings - not Phase 1 scope)
- Constants file exists and exports expected values: PASS
- All modified files import from constants: PASS
- No hardcoded game magic numbers remain: PASS
- `src/lib/index.ts` removed: PASS

**Notes:**
- Build produces a11y warnings for click handlers without keyboard events (DraftInterface, HowToPlayModal, ShareModal) - these are pre-existing issues, not introduced by Phase 1
- CSS numeric values (padding, margins, colors) correctly remain inline
- HTTP status codes correctly remain inline (industry standard)

**Code Review (2026-03-17): APPROVED**
No blocking issues. Minor suggestions noted below.

*Should Fix (non-blocking):*
- `PERCENTAGE_PRECISION_MULTIPLIER`/`PERCENTAGE_PRECISION_DIVISOR` naming is over-engineered for what is simply "round to 1 decimal place". Consider simplifying to a single `PERCENTAGE_DECIMALS = 1` constant with a helper function in Phase 2.

*Minor:*
- `src/routes/api/submit/+server.ts:72` and `src/routes/api/results/+server.ts:49,65` use `as unknown as` casts. This is noted in success metrics as a Phase 2 cleanup target.
- Test file has 13 comprehensive tests covering scoring math, bounds checking, and invariants - good coverage for a constants file.

---

### Phase 2: Service Layer Extraction (COMPLETE - REVIEW APPROVED)
**Goal:** Testable business logic separated from API handlers

**Deliverables:**
- [x] Create `src/lib/server/services/scoring.ts`
- [x] Create `src/lib/server/services/puzzle.ts`
- [x] Create `src/lib/server/services/submission.ts`
- [x] Create `src/lib/server/services/stats.ts`
- [x] Refactor API routes to use services
- [x] Remove duplicated `calculateCrowdStats`

**New files:**
```
src/lib/server/services/
├── index.ts        # Re-exports all services
├── scoring.ts      # calculateScore, getTrueTopN
├── puzzle.ts       # getPuzzle*, toApiPuzzle, shuffleItems, buildArchiveList
├── submission.ts   # createSubmission, getSubmission, hasSubmitted
└── stats.ts        # calculateCrowdStats (single source of truth)
```

**Files modified:**
- `src/routes/api/submit/+server.ts` - refactored to use services (reduced from 232 to 161 lines)
- `src/routes/api/results/+server.ts` - refactored to use services (reduced from 155 to 99 lines)
- `src/routes/api/puzzle/+server.ts` - refactored to use services (reduced from 106 to 86 lines)
- `src/routes/api/puzzles/archive/+server.ts` - refactored to use services (reduced from 95 to 67 lines)

**Exit Criteria:** API routes are thin wrappers, all logic in services

**Completed (2026-03-17):**
- `pnpm test`: PASS (13 tests)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- API routes now import from `$lib/server/services`
- Duplicated `calculateCrowdStats` removed - single implementation in stats.ts
- All `as unknown as` casts removed from API routes (moved to service layer)
- Percentage calculation simplified to `PERCENTAGE_DECIMALS = 1` with helper function

**Notes:**
- Services export pure functions where possible (scoring, stats calculation)
- Database access isolated in service functions for testability
- `calculateCrowdStatsFromSubmissions` exported separately for unit testing without DB

**QA Results (2026-03-17): PASSED**

*Verification checks:*
- `pnpm test`: PASS (73 tests - 13 constants + 60 service unit tests)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- All 4 service files exist with expected exports: PASS
  - `scoring.ts`: exports `calculateScore`, `getTrueTopN`
  - `stats.ts`: exports `calculateCrowdStats`, `calculateCrowdStatsFromSubmissions`
  - `puzzle.ts`: exports `getPuzzleByDate`, `getPuzzleByNumber`, `shuffleItems`, `toApiPuzzle`, `buildArchiveList`, and more
  - `submission.ts`: exports `createSubmission`, `getSubmission`, `hasSubmitted`, `getUserSubmissionsForPuzzles`
- API routes are thin wrappers: PASS (validation + service calls + response formatting only)
- No duplicated `calculateCrowdStats`: PASS (single implementation in stats.ts, imported by submit and results routes)
- No `as unknown as` casts in routes: PASS (0 occurrences in `/src/routes`)

*Unit tests written (60 tests across 3 files):*
- `src/lib/server/services/__tests__/scoring.test.ts` (22 tests)
  - calculateScore: happy path, edge cases, error handling, invariants
  - getTrueTopN: sorting, filtering, edge cases
- `src/lib/server/services/__tests__/stats.test.ts` (16 tests)
  - calculateCrowdStatsFromSubmissions: percentages, sorting, empty data, integrity
- `src/lib/server/services/__tests__/puzzle.test.ts` (22 tests)
  - shuffleItems: determinism, uniqueness per user, preservation, quality
  - buildArchiveList: completion status, field preservation

*Coverage gaps (low risk):*
- Database functions not unit tested (require mocking or integration tests - Phase 3 scope)
- Date/timezone utilities not tested (Phase 3 scope)

**Recommendation:** Ready for code review

**Code Review (2026-03-17): APPROVED**
No blocking issues. Implementation matches Phase 2 deliverables and ADR-007 design principles.

*Should Fix (non-blocking):*
- `src/lib/server/services/stats.ts:12` - `PERCENTAGE_DECIMALS` is defined locally instead of being imported from constants.ts. Meanwhile, `constants.ts` still exports the old `PERCENTAGE_PRECISION_MULTIPLIER/DIVISOR` which are only used in tests. Consider either: (a) move `PERCENTAGE_DECIMALS` to constants.ts and remove the old exports, or (b) update the constants test to use the new approach. Low priority as behavior is correct.
- `src/lib/server/services/stats.ts:68` - Type assertion `as SubmissionData[]` on Supabase response. This is acceptable given the query explicitly selects these fields, but consider adding a type guard or Zod parsing in Phase 4 for stronger runtime validation.

*Minor:*
- Test coverage for `submission.ts` is limited to integration testing (no pure functions to unit test). This is acceptable per ADR-007 which notes submission service is "all DB access".
- Tests in `stats.test.ts` line 261 include a test case with duplicate items in `drafted_items` which is invalid input per game rules. Consider adding a note that this tests defensive handling, not a valid scenario.

*Positive observations:*
- Pure function separation (ADR-007) well implemented: `calculateCrowdStatsFromSubmissions`, `calculateScore`, `getTrueTopN`, `shuffleItems`, `buildArchiveList` are all pure and testable
- API routes are thin: validation + service calls + response formatting only
- Error messages are user-friendly and actionable
- Type safety improved - no `as unknown as` casts in routes
- 60 unit tests provide good coverage of business logic edge cases

---

### Phase 3: Test Coverage (COMPLETE)
**Goal:** >90% coverage on services, confidence for future changes

**Deliverables:**
- [x] Unit tests for `scoring.ts`
- [x] Unit tests for `stats.ts`
- [x] Unit tests for `puzzle.ts` (shuffle determinism)
- [x] Unit tests for date/timezone utilities
- [x] Integration tests for `/api/submit` (via submission service tests)
- [x] Integration tests for `/api/puzzle` (via puzzle service tests)

**Test files:**
```
src/lib/server/services/__tests__/
├── scoring.test.ts       # 22 tests - pure scoring functions
├── stats.test.ts         # 16 tests - pure stats calculation
├── stats.integration.test.ts   # 6 tests - DB-dependent stats
├── puzzle.test.ts        # 32 tests - shuffle, buildArchiveList, toApiPuzzle
├── puzzle.integration.test.ts  # 16 tests - DB-dependent puzzle functions
└── submission.test.ts    # 11 tests - DB-dependent submission functions

src/lib/__tests__/
└── utils.test.ts         # 40 tests - date utilities, seededShuffle, UUID validation

src/lib/config/
└── constants.test.ts     # 13 tests - constant validation
```

**Note:** E2E tests (Playwright) deferred — not in scope for this refactor.

**Exit Criteria:** `pnpm test` passes, coverage report shows >90% on services

**Completed (2026-03-17):**
- Total tests: 156 (up from 73)
- Coverage on `src/lib/server/services/`:
  - Statements: 100%
  - Branches: 98.5%
  - Functions: 100%
  - Lines: 100%
- All pure functions have comprehensive tests
- All DB functions tested with mocked Supabase client
- Date/timezone utilities tested with fake timers

**Files created:**
- `src/lib/server/services/__tests__/puzzle.integration.test.ts`
- `src/lib/server/services/__tests__/stats.integration.test.ts`
- `src/lib/server/services/__tests__/submission.test.ts`
- `src/lib/__tests__/utils.test.ts`

**Configuration changes:**
- Added `@vitest/coverage-v8` dependency
- Updated `vite.config.ts` with coverage configuration

**QA Results (2026-03-17): PASSED**

*Verification checks:*
- `pnpm test`: PASS (156 tests - 13 constants + 40 utils + 103 services)
- `pnpm test --coverage`: PASS (100% statements, 100% lines, 100% functions, 98.5% branches)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- Coverage configuration in `vite.config.ts`: PASS (thresholds set at 90% for all metrics)

*Test file structure verification:*
- `src/lib/__tests__/utils.test.ts`: EXISTS (40 tests)
- `src/lib/server/services/__tests__/puzzle.integration.test.ts`: EXISTS (16 tests)
- `src/lib/server/services/__tests__/stats.integration.test.ts`: EXISTS (6 tests)
- `src/lib/server/services/__tests__/submission.test.ts`: EXISTS (11 tests)

*Test quality assessment:*

1. **Edge case coverage**: Excellent
   - Date utilities: timezone edge cases, midnight boundaries, day transitions
   - UUID validation: empty, malformed, missing dashes, extra characters
   - Shuffle: empty arrays, single items, special characters in seeds
   - Scoring: boundary values (rank 5 vs 6), zero scores, partial scores
   - Stats: empty submissions, single user, 1000 users (performance)

2. **Error path testing**: Comprehensive
   - Database errors return graceful fallbacks (null or empty)
   - Invalid input throws meaningful errors
   - All mocked DB functions test success, not-found, and error cases

3. **Mocking approach**: Appropriate
   - Pure functions tested without mocks (scoring, stats calculation, shuffle)
   - DB functions use mock query chains that verify query construction
   - No over-mocking - tests verify actual behavior, not implementation

4. **Assertion quality**: Strong
   - Descriptive test names read as specifications
   - Tests verify behavior, not implementation details
   - Invariant tests ensure mathematical constraints hold

*Coverage breakdown by service:*
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| puzzle.ts | 100% | 100% | 100% | 100% |
| scoring.ts | 100% | 100% | 100% | 100% |
| stats.ts | 100% | 94.44% | 100% | 100% |
| submission.ts | 100% | 100% | 100% | 100% |

*The 98.5% branch coverage gap (line 26 in stats.ts):*
This is likely the fallback branch for empty submissions array in `calculateCrowdStatsFromSubmissions`. The function handles this path, but the specific branch in the internal logic may not be hit directly. This is a minor gap with no practical risk as the behavior is covered by the "empty submissions" test.

**Recommendation:** Ready for code review

**Code Review (2026-03-17): APPROVED**
No blocking issues. Implementation meets Phase 3 requirements.

*Should Fix (non-blocking):*
- `src/lib/server/services/__tests__/puzzle.integration.test.ts:279` - Duplicate import of `afterEach` at end of file. The `afterEach` is already imported at line 7 via `import { describe, it, expect, vi, beforeEach } from 'vitest'`. This second import is dead code and should be removed.
- Coverage configuration excludes `src/lib/__tests__/**` but utils.test.ts is in that location. Consider either: (a) moving utils.test.ts to colocate with utils.ts, or (b) adding a separate coverage target for utils.ts. Currently, utils.ts coverage is not tracked against the 90% threshold.

*Minor:*
- Test count claims in PLAN.md (156 tests) slightly undercount actual tests (164 occurrences of `it(` or `test(` in test files, though some may be in non-test files). Exact count: 13 constants + 40 utils + 22 scoring + 32 puzzle + 16 puzzle.integration + 16 stats + 6 stats.integration + 11 submission = 156 actual tests. The grep also finds `it(` in Svelte component files, which inflates the raw count.
- `utils.test.ts` does not test several client-only functions (`getOrCreateUserId`, `shareResults`, `generateImageFromElement`, `downloadImage`, `shareImage`, `copyImageToClipboard`). These require browser APIs (localStorage, navigator, DOM) which are not available in Node test environment. This is acceptable per ADR-006 which excludes browser-dependent code from unit tests.
- `getTimezoneOffset` function in utils.ts is not tested. This is a trivial wrapper around `Date.getTimezoneOffset()` so testing would provide minimal value.

*Positive observations:*
- Test quality is high - tests verify behavior, not implementation details
- Mock approach is appropriate - pure functions tested without mocks, DB functions with mock query chains
- Edge cases are well covered: empty arrays, boundary values, error paths
- Determinism tests for shuffle functions use proper methodology (verify same input produces same output)
- No flaky tests detected - all tests use fake timers for date/time dependent tests
- Coverage thresholds set at 90% per ADR-008
- `@vitest/coverage-v8` added as dev dependency

---

### Phase 4: Input Validation with Zod (COMPLETE - REVIEW APPROVED)
**Goal:** Type-safe, consistent validation with clear error messages

**Deliverables:**
- [x] Add Zod dependency
- [x] Create `src/lib/server/validation/schemas.ts`
- [x] Refactor `/api/submit` to use Zod
- [x] Refactor `/api/puzzle` to use Zod
- [x] Refactor `/api/results` to use Zod
- [x] Refactor `/api/puzzles/archive` to use Zod
- [x] Improve error responses (structured errors)

**New files:**
```
src/lib/server/validation/
├── index.ts        # Re-exports schemas and error utilities
├── schemas.ts      # Zod schemas for all API endpoints
└── errors.ts       # formatValidationError, createErrorResponse

src/lib/server/validation/__tests__/
├── schemas.test.ts # 37 tests - schema validation
└── errors.test.ts  # 9 tests - error formatting
```

**Files modified:**
- `package.json` - added zod ^4.3.6
- `src/routes/api/submit/+server.ts` - uses Zod validation (reduced from 161 to 111 lines)
- `src/routes/api/puzzle/+server.ts` - uses Zod validation (reduced from 86 to 56 lines)
- `src/routes/api/results/+server.ts` - uses Zod validation (reduced from 99 to 79 lines)
- `src/routes/api/puzzles/archive/+server.ts` - uses Zod validation (reduced from 67 to 64 lines)

**Exit Criteria:** All API routes use Zod, manual validation removed

**Completed (2026-03-17):**
- `pnpm test`: PASS (202 tests - 156 prior + 46 new validation tests)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- All API routes use Zod schemas for validation
- Manual `isValidUUID` calls removed from routes (now handled by Zod)
- Structured error responses with field-level errors
- Type inference via `z.infer<>` for request/query types

**Notes:**
- Zod v4 (4.3.6) used - uses `issues` property instead of `errors` for error details
- Validation includes custom refinements (e.g., captain must be in drafted_items)
- Timezone validation bounds: -720 to +840 minutes (UTC-12 to UTC+14)
- `formatValidationError` extracts first error as primary message, includes field_errors when multiple

**QA Results (2026-03-17): PASSED**

*Verification checks:*
- `pnpm test`: PASS (202 tests - all passing)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- Zod dependency in package.json: PASS (`"zod": "^4.3.6"`)
- Validation schemas at `src/lib/server/validation/schemas.ts`: PASS
- Error utilities at `src/lib/server/validation/errors.ts`: PASS
- All 4 API routes use Zod: PASS
  - `/api/submit` - imports `submitRequestSchema`, uses `safeParse`
  - `/api/puzzle` - imports `puzzleQuerySchema`, uses `safeParse`
  - `/api/results` - imports `resultsQuerySchema`, uses `safeParse`
  - `/api/puzzles/archive` - imports `archiveQuerySchema`, uses `safeParse`
- No `isValidUUID` calls in routes: PASS (0 occurrences in `/src/routes`)

*Validation quality assessment:*

1. **Use of constants from config**: PASS
   - `schemas.ts` imports `DRAFT_SIZE` from `$lib/config/constants`
   - Error messages reference the constant value (e.g., "Must select exactly 5 items")

2. **Custom refinements for business rules**: PASS
   - `submitRequestSchema` includes refinement: captain must be in drafted_items
   - `drafted_items` includes uniqueness refinement
   - `puzzle_number` includes positive integer validation
   - `timezone` includes bounds validation (-720 to +840)

3. **Structured error responses**: PASS
   - `formatValidationError` returns `{ success: false, error, field_errors? }`
   - Field-level errors include path and message
   - Primary error extracted from first issue
   - `field_errors` omitted when only one error (cleaner response)

4. **Type inference**: PASS
   - Each schema exports inferred type via `z.infer<>`
   - Types used in route handlers for type safety

*Test quality (46 tests):*
- `schemas.test.ts` (37 tests): Happy paths, missing fields, invalid formats, boundary values, coercion
- `errors.test.ts` (9 tests): Status codes, single/multiple errors, nested paths

*No coverage gaps identified.*

**Recommendation:** Ready for code review

**Code Review (2026-03-17): APPROVED**
No blocking issues. Implementation matches Phase 4 deliverables and ADR-009 design.

*Should Fix (non-blocking):*
- `src/lib/server/validation/schemas.ts:11-13` - `MIN_TIMEZONE_OFFSET` and `MAX_TIMEZONE_OFFSET` are defined locally in schemas.ts. Consider moving to constants.ts for consistency with other magic numbers (e.g., `DRAFT_SIZE` is already imported from there). Low priority as values are correct and unlikely to change.
- Exported types (`SubmitRequest`, `PuzzleQuery`, etc.) are not explicitly imported in route handlers. Routes rely on `parseResult.data` type inference which works correctly, but explicit type imports could improve code documentation. This is a style preference, not a functional issue.

*Minor:*
- `src/lib/server/validation/__tests__/errors.test.ts:36` - Test verifies error message length is greater than 0 rather than checking specific message content. This is acceptable as it avoids brittle tests tied to Zod's internal error messages.
- Test coverage for `formatValidationError` does not verify the `field` path joins correctly for deeply nested errors (only one level of nesting tested at line 88). Edge case, low risk.

*Positive observations:*
- Zod schemas use constants from config (`DRAFT_SIZE`) - good consistency
- Custom refinements properly validate business rules (captain in drafted_items, unique items)
- Error messages are user-friendly and actionable ("Your #1 guess must be one of your selected items")
- All routes use `safeParse` pattern consistently for non-throwing validation
- Business validation (items exist in puzzle) correctly remains in routes (requires DB access)
- Error responses do not leak internal details - Supabase errors logged server-side only
- 46 new tests provide comprehensive coverage of schema validation

---

### Phase 5: Rate Limiting (COMPLETE)
**Goal:** Protect against API abuse

**Deliverables:**
- [x] Evaluate Netlify built-in rate limiting capabilities
- [x] Implement rate limiting (in-memory - Netlify built-in insufficient)
- [x] Test rate limiting behavior

**Approach:** Evaluated Netlify's built-in options. Netlify does not provide per-IP rate limiting for serverless functions via configuration. Implemented lightweight in-memory rate limiting within the function itself.

**New files:**
```
src/lib/server/ratelimit/
├── index.ts                    # Rate limiter implementation
└── __tests__/ratelimit.test.ts # 17 tests
```

**Files modified:**
- `src/routes/api/submit/+server.ts` - Added rate limiting check at start of handler
- `netlify.toml` - Updated build command to use pnpm, added documentation comment

**Implementation details:**
- In-memory rate limiting: 10 requests per minute per IP
- Uses Netlify's `x-nf-client-connection-ip` header for reliable client IP detection
- Falls back to `x-forwarded-for` if Netlify header unavailable
- Returns HTTP 429 with `Retry-After` header when rate limited
- Periodic cleanup of expired entries to prevent memory leaks

**Limitations (acceptable for this use case):**
- Cold starts reset the counter (each function instance has fresh memory)
- Multiple function instances don't share state
- Memory grows with unique IPs until function recycles

**Why these limitations are acceptable:**
- This is a casual daily game with low abuse incentive
- Users can only submit once per puzzle per day (enforced by `hasSubmitted()` check)
- Database enforces uniqueness constraint on (user_id, puzzle_id)
- The rate limiter provides defense-in-depth against automated abuse

**Alternative considered but deferred:**
- Upstash Redis for distributed rate limiting - adds external dependency, operational complexity, and cost for minimal additional protection in this use case

**Exit Criteria:** `/api/submit` rate limited to prevent abuse - ACHIEVED

**Completed (2026-03-17):**
- `pnpm test`: PASS (219 tests - 202 prior + 17 new rate limiting tests)
- `pnpm build`: PASS (with pre-existing a11y warnings)

**QA Results (2026-03-17): PASSED**

*Verification checks:*
- `pnpm test`: PASS (219 tests - all passing)
- `pnpm build`: PASS (with pre-existing a11y warnings)
- Rate limit module at `src/lib/server/ratelimit/index.ts`: PASS
- Rate limit tests at `src/lib/server/ratelimit/__tests__/ratelimit.test.ts`: PASS (17 tests)
- `/api/submit` integrates rate limiting: PASS (lines 17-39 of +server.ts)
- Rate limit returns 429 with Retry-After header: PASS

*Implementation quality assessment:*

1. **Memory cleanup**: PASS
   - `cleanupExpired()` removes expired entries from the store
   - Called probabilistically (~1% of requests) to avoid overhead
   - Tested: entries removed after window expires, non-expired retained

2. **IP extraction from Netlify headers**: PASS
   - Uses `x-nf-client-connection-ip` (Netlify-specific, most reliable)
   - Falls back to `x-forwarded-for` (extracts first IP)
   - Falls back to 'unknown' if no headers present
   - Trims whitespace from IP addresses

3. **Configurable limits**: PASS
   - `SUBMIT_RATE_LIMIT` exported with configurable `maxRequests` and `windowMs`
   - Default config also available (10 requests/minute)
   - Limits can be overridden per-call via config parameter

4. **Edge cases tested**: PASS
   - Missing IP headers: returns 'unknown'
   - Multiple IPs in x-forwarded-for: extracts first
   - Different IPs tracked separately
   - Window expiration resets counters
   - Reset time maintained within window

*Test quality (17 tests):*
- `checkRateLimit`: 8 tests covering happy path, rate limiting, windowing
- `_cleanupExpired`: 2 tests covering expired/non-expired entries
- `getClientIp`: 6 tests covering all header combinations
- `SUBMIT_RATE_LIMIT`: 1 test verifying constants

*Minor observations (non-blocking):*
- Coverage report only tracks `src/lib/server/services/` - rate limit module not in coverage thresholds. Consider adding `src/lib/server/ratelimit/**/*.ts` to coverage include in future.
- Cleanup runs probabilistically (1% chance per request) which is non-deterministic but acceptable for memory management

**Recommendation:** Ready for code review

**Code Review (2026-03-17): APPROVED**
No blocking issues. Implementation matches Phase 5 deliverables and ADR-010 design.

*Should Fix (non-blocking):*
- `src/lib/server/ratelimit/index.ts:126` - The `'unknown'` fallback for missing IP headers means all requests without IP headers share a single rate limit bucket. While the comment notes this "should not happen in production behind Netlify", an attacker could theoretically strip headers in certain proxy configurations. Consider either: (a) returning a unique identifier per request (e.g., random UUID) which allows unlimited requests but prevents shared bucket abuse, or (b) blocking requests with no IP entirely. Low priority as Netlify reliably provides the header.
- Coverage configuration at `vite.config.ts` only tracks `src/lib/server/services/` - rate limit module not included. Consider adding `src/lib/server/ratelimit/**/*.ts` to the coverage include pattern. Low priority as the module has 17 tests.

*Minor:*
- `src/lib/server/ratelimit/index.ts:71` - Cleanup runs probabilistically (1% chance per request) which is non-deterministic. This is fine for memory management but makes the cleanup timing untestable without mocking Math.random. The tests handle this by calling `_cleanupExpired` directly.
- The `Retry-After` header calculation in `+server.ts:26` could return 0 or negative if `resetTime` is in the past due to timing edge cases. In practice this is harmless (client would retry immediately), but consider `Math.max(1, retryAfter)` for correctness.

*Positive observations:*
- IP extraction correctly prefers Netlify's `x-nf-client-connection-ip` header, which cannot be spoofed by clients
- Rate limit check happens before any other processing (line 21-39), minimizing resource usage for rate-limited requests
- HTTP 429 response includes proper `Retry-After` header per RFC 6585
- Memory cleanup prevents unbounded growth via periodic `cleanupExpired()` calls
- Test coverage is comprehensive: 17 tests covering rate limiting, cleanup, and IP extraction
- Error message is user-friendly: "Too many requests. Please try again later."
- Documentation in `netlify.toml` explains the rate limiting approach

---

### Phase 6: Final Polish (COMPLETE - REVIEW APPROVED)
**Goal:** Production confidence

**Deliverables:**
- [x] Add error boundary component (`src/routes/+error.svelte`)
- [x] Audit console.error calls - all appropriate, no debug logs
- [x] Fix pre-existing a11y warnings in components
- [x] Verify all environment variables documented in `.env.example`

**Files created:**
- `src/routes/+error.svelte` - Error boundary with 404/500 handling, retry/home buttons

**Files modified:**
- `src/lib/components/DraftInterface.svelte` - Fixed a11y: div[role="button"] with proper keyboard handling
- `src/lib/components/HowToPlayModal.svelte` - Fixed a11y: dialog role, tabindex, keyboard dismiss
- `src/lib/components/ShareModal.svelte` - Fixed a11y: dialog role, tabindex, keyboard dismiss
- `src/lib/components/ResultsDisplay.svelte` - Fixed quoted attribute warning

**Exit Criteria:**
- [x] `pnpm test` passes (219 tests)
- [x] `pnpm build` passes with no warnings
- [x] No debug console.log statements
- [x] Error boundary handles unexpected errors
- [x] Environment variables documented

**QA Results (2026-03-17): PASSED**

*Verification checks:*

1. **Test Suite (`pnpm test`)**: PASS
   - 219 tests across 11 test files
   - All tests passing
   - Duration: 565ms

2. **Build (`pnpm build`)**: PASS
   - Vite build completes successfully
   - No a11y warnings
   - No other warnings
   - Client and server builds successful

3. **Error Boundary (`src/routes/+error.svelte`)**: PASS
   - File exists and is properly structured
   - Handles 404 (page not found) with appropriate message
   - Handles 500 (server error) with appropriate message
   - Handles other errors with generic fallback
   - Provides "Try Again" and "Go Home" action buttons
   - Uses theme system consistently
   - Includes proper `<svelte:head>` for page title

4. **No Debug `console.log` Statements**: PASS
   - Grep search returns no matches in `/src`
   - Production code is clean

5. **`console.error` Calls Appropriate**: PASS
   - All 15 occurrences are in catch blocks
   - Locations verified:
     - `/src/routes/+page.svelte` (3 occurrences) - fetch/submit error handling
     - `/src/routes/archive/+page.svelte` (1 occurrence) - archive load error
     - `/src/routes/[id]/+page.svelte` (3 occurrences) - puzzle load/submit errors
     - `/src/routes/api/submit/+server.ts` (1 occurrence) - server error handling
     - `/src/routes/api/puzzle/+server.ts` (1 occurrence) - server error handling
     - `/src/routes/api/results/+server.ts` (1 occurrence) - server error handling
     - `/src/routes/api/puzzles/archive/+server.ts` (1 occurrence) - server error handling
     - `/src/lib/utils.ts` (3 occurrences) - image generation/sharing errors
     - `/src/lib/components/ShareModal.svelte` (3 occurrences) - copy/share errors
     - `/src/lib/server/services/submission.ts` (1 occurrence) - DB error handling
   - All are legitimate error logging in error handling paths

6. **Environment Variables Documented (`.env.example`)**: PASS
   - File exists at project root
   - Documents all 3 required variables:
     - `PUBLIC_SUPABASE_URL` - with description
     - `PUBLIC_SUPABASE_ANON_KEY` - with description
     - `SUPABASE_SERVICE_ROLE_KEY` - with security warning (server-side only)
   - Includes helpful link to Supabase dashboard

7. **A11y Fixes Applied**: PASS

   **DraftInterface.svelte:**
   - Item cards use `role="button"` with `tabindex` attribute
   - `aria-pressed` indicates selection state
   - `aria-disabled` for disabled items
   - `onkeydown` handler for keyboard interaction (Enter/Space)
   - Properly handles nested interactive elements (star, remove buttons)

   **HowToPlayModal.svelte:**
   - Modal backdrop has `role="dialog"` and `aria-modal="true"`
   - `aria-labelledby` references the title
   - `tabindex="-1"` makes container focusable
   - Escape key dismisses modal via `<svelte:window onkeydown>`
   - Uses Svelte ignore comments for intentional click-without-keyboard pattern on backdrop

   **ShareModal.svelte:**
   - Modal backdrop has `role="dialog"` and `aria-modal="true"`
   - `aria-labelledby` references the title
   - `tabindex="-1"` makes container focusable
   - Escape key dismisses modal via `<svelte:window onkeydown>`
   - Close button has `aria-label="Close"`
   - Uses Svelte ignore comments for intentional click-without-keyboard pattern on backdrop

   **ResultsDisplay.svelte:**
   - No quoted attribute warnings (Svelte 5 syntax used correctly)
   - Theme interpolations use unquoted `class={theme.x.y}` syntax

**Coverage Gaps:** None identified

**Recommendation:** Ready for code review. All Phase 6 exit criteria met.

**Code Review (2026-03-17): APPROVED**
No blocking issues. Implementation matches Phase 6 deliverables and ADR-011 design.

*Should Fix (non-blocking):*
- `src/lib/components/DraftInterface.svelte:96` - The `tabindex` condition `isDisabled && !isDrafted` is redundant (if `isDisabled` is true, `!isDrafted` is always true by definition). Simplify to `tabindex={isDisabled ? -1 : 0}` for clarity. Low priority.
- `src/routes/+error.svelte:31-37` - Uses `window.location.reload()` and `window.location.href` instead of SvelteKit's `goto()`. This is acceptable for error recovery (full reload is safer), but noted for consistency.

*Minor:*
- `svelte-ignore` comments in HowToPlayModal and ShareModal are appropriate - backdrop click is intentionally mouse-only since Escape key handles keyboard dismissal.
- Error boundary relies on optional chaining for `$page.error?.message` which is fine since SvelteKit always provides an error object in +error.svelte.

*Positive observations:*
- Error boundary correctly handles 404, 500, and unknown error codes with distinct messages
- Uses theme system consistently across all new/modified files
- DraftInterface a11y implementation is thorough: `role="button"`, `tabindex`, `aria-pressed`, `aria-disabled`, keyboard handler
- Modal dialogs use correct WAI-ARIA pattern: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `tabindex="-1"`
- Escape key dismissal via `<svelte:window>` is a clean, maintainable pattern
- No over-engineering - fixes are minimal and targeted

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `package.json` | Modify (pnpm, vitest, zod) | 1, 3, 4 |
| `pnpm-lock.yaml` | Create | 1 |
| `package-lock.json` | Delete | 1 |
| `vite.config.ts` | Modify (vitest) | 1 |
| `src/lib/config/constants.ts` | Create | 1 |
| `src/lib/server/services/scoring.ts` | Create | 2 |
| `src/lib/server/services/puzzle.ts` | Create | 2 |
| `src/lib/server/services/submission.ts` | Create | 2 |
| `src/lib/server/services/stats.ts` | Create | 2 |
| `src/lib/server/validation/schemas.ts` | Create | 4 |
| `src/lib/server/ratelimit/index.ts` | Create | 5 |
| `src/routes/api/submit/+server.ts` | Modify | 2, 4, 5 |
| `src/routes/api/puzzle/+server.ts` | Modify | 2, 4 |
| `src/routes/api/results/+server.ts` | Modify | 2, 4 |
| `src/routes/api/puzzles/archive/+server.ts` | Modify | 2, 4 |
| `tests/**` | Create | 3 |
| `src/lib/index.ts` | Delete (unused) | 1 |
| `src/routes/+error.svelte` | Create | 6 |
| `src/lib/components/DraftInterface.svelte` | Modify (a11y) | 6 |
| `src/lib/components/HowToPlayModal.svelte` | Modify (a11y) | 6 |
| `src/lib/components/ShareModal.svelte` | Modify (a11y) | 6 |
| `src/lib/components/ResultsDisplay.svelte` | Modify (quoted attr) | 6 |

---

## Success Metrics

- [x] Zero code duplication in services (Phase 2)
- [x] Test coverage >90% on `src/lib/server/services/` (Phase 3 - 100% statements, 98.5% branches)
- [x] All API routes use Zod schemas (Phase 4)
- [x] Rate limiting active on submission endpoint (Phase 5 - 10 req/min per IP)
- [ ] Lighthouse Performance 90+ (deferred - can be optimized post-ship)
- [x] No TypeScript `as unknown as` casts in API routes (Phase 2 - moved to services where unavoidable)

---

## Non-Goals (This Refactor)

- UI changes (already working well)
- New features
- Authentication system
- Database schema changes
- Hosting migration
