# Architecture Decision Records

## ADR-001: Refactor POC vs Rebuild from Scratch

**Date:** 2026-03-17
**Status:** Accepted

### Context

A working POC for Topick exists. Initial review identified code quality issues (duplication, no tests, magic numbers). The question: refactor or rebuild?

### Decision

**Refactor the existing POC** rather than rebuild from scratch.

### Rationale

Security audit revealed the architecture is actually solid:
- ✅ RLS enabled with proper policies
- ✅ Service role key isolated to server
- ✅ Input validation on all endpoints
- ✅ Server-side scoring (rankings protected)
- ✅ Database constraints enforced
- ✅ Secrets not in git

The issues are **code quality, not architecture**:
- One duplicated function (easy fix)
- No tests (can add incrementally)
- Magic numbers (extract to constants)
- Verbose validation (replace with Zod)

Rebuilding would mean re-implementing:
- Working UI components with polish
- Share modal with image generation
- Archive system
- Animations and timing
- Dark mode
- Mobile responsiveness

This is unnecessary risk for code quality fixes.

### Consequences

- Keep existing codebase
- Refactor in 6 focused phases
- Add tests alongside service extraction
- No UI changes needed

---

## ADR-002: Technology Stack Confirmation

**Date:** 2026-03-17
**Status:** Accepted

### Context

Need to confirm or change technology choices for the production build.

### Decision

**Keep the proven stack with minor upgrades:**

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | SvelteKit 2 | Proven in POC |
| UI | Svelte 5 (runes) | Modern reactivity |
| Styling | Tailwind CSS 3 | Keep existing (v4 upgrade deferred) |
| Database | Supabase (PostgreSQL) | Keep existing |
| Hosting | Netlify | Keep existing |
| Package Manager | pnpm | Migrate from npm |
| Testing | Vitest | Add (Playwright E2E deferred) |
| Validation | Zod | Add (missing in POC) |

### Rationale

- **SvelteKit 2 + Svelte 5** - POC proves it works well for this use case
- **Supabase** - Schema is solid, data exists, no reason to change
- **Tailwind CSS 4** - Minor upgrade, new features helpful
- **pnpm** - Faster, stricter, no npm quirks
- **Vitest** - Native to Vite ecosystem, fast, TypeScript-first
- **Zod** - Runtime validation with TypeScript inference

### Alternatives Rejected

- Next.js - Unnecessary complexity
- Firebase - Supabase PostgreSQL better for relational data
- Jest - Vitest faster and native ESM

---

## ADR-003: Project Structure

**Date:** 2026-03-17
**Status:** Accepted

### Context

Define directory structure that supports clean architecture, testability, and scalability.

### Decision

```
src/
├── lib/
│   ├── components/
│   │   ├── game/       # Game-specific: DraftInterface, Results
│   │   ├── ui/         # Generic: Button, Modal, Toast
│   │   └── layout/     # Structure: Header, Footer
│   ├── services/       # Business logic (server+client)
│   ├── stores/         # Svelte 5 rune stores
│   ├── utils/          # Pure functions
│   ├── config/         # Constants, env vars
│   └── server/         # Server-only code (Supabase client)
├── routes/             # SvelteKit pages and API
└── app.css             # Global styles

tests/
├── unit/               # Vitest unit tests
├── integration/        # API route tests
└── e2e/                # Playwright browser tests
```

### Key Principles

1. **Separation of concerns** - Services handle logic, components handle UI
2. **Server isolation** - `lib/server/` never imported on client
3. **Testability** - Services are pure functions, easy to unit test
4. **Colocation** - Game components together, UI primitives together

---

## ADR-004: Anonymous User Identity

**Date:** 2026-03-17
**Status:** Accepted (with noted limitations)

### Context

POC uses client-generated UUIDs in localStorage. This is spoofable but enables frictionless play.

### Decision

**Keep anonymous identity for MVP** with documented limitations.

### Implementation

```typescript
// Client generates UUID on first visit
const userId = localStorage.getItem('topick_user_id')
  ?? crypto.randomUUID();
localStorage.setItem('topick_user_id', userId);
```

### Known Limitations

1. Users can clear localStorage to play multiple times
2. Users can fabricate UUIDs
3. No cross-device continuity
4. Can't implement leaderboards or social features

### Future Path

When/if competitive features needed:
1. Add optional authentication (Supabase Auth)
2. Link anonymous submissions to authenticated accounts
3. Flag submissions from unverified users

### Why This Is Acceptable

- Casual daily game, not competitive ranked play
- Low incentive to cheat (no prizes/leaderboards)
- Frictionless onboarding more valuable than perfect integrity

---

## ADR-005: Scoring Calculation Location

**Date:** 2026-03-17
**Status:** Accepted

### Context

Where should score calculation happen - client or server?

### Decision

**Server-side only.** Client never sees true_rankings until after submission.

### Implementation

1. Client submits: `{ puzzle_id, drafted_items, captain }`
2. Server fetches puzzle, calculates score, stores submission
3. Server returns: `{ score, true_rankings, crowd_stats }`

### Rationale

- **Integrity** - Can't manipulate scores client-side
- **Simplicity** - Single source of truth
- **Spoiler prevention** - Rankings hidden until commit

---

## ADR-006: Testing Strategy

**Date:** 2026-03-17
**Status:** Accepted

### Context

POC has zero tests. Define testing approach for production build.

### Decision

Two-tier testing with coverage targets:

| Tier | Tool | Coverage Target | What to Test |
|------|------|-----------------|--------------|
| Unit | Vitest | >90% for services | Scoring, shuffle, date utils, validation |
| Integration | Vitest | >80% for API | Endpoints, error handling, edge cases |

E2E tests (Playwright) deferred — not in scope for this refactor.

### Test-Driven Phases

- Phase 2 (Core Logic): Tests written alongside services
- Phase 3 (API): Integration tests for API routes

### What NOT to Test

- Svelte component rendering (low ROI for this app)
- Third-party libraries (Supabase, html2canvas)
- Styling/CSS

---

## ADR-007: Service Layer Architecture

**Date:** 2026-03-17
**Status:** Accepted

### Context

API routes contained duplicated logic (e.g., `calculateCrowdStats` in both submit and results). Business logic was mixed with request handling, making testing difficult.

### Decision

**Extract business logic into server-side services** under `src/lib/server/services/`.

### Structure

```
src/lib/server/services/
├── index.ts        # Re-exports all services
├── scoring.ts      # Score calculation (pure functions)
├── stats.ts        # Crowd statistics (single source of truth)
├── puzzle.ts       # Puzzle retrieval and transformation
└── submission.ts   # Submission CRUD operations
```

### Design Principles

1. **Pure functions where possible** - `calculateScore`, `calculateCrowdStatsFromSubmissions`, `shuffleItems` are pure
2. **Isolated database access** - Database calls in dedicated service functions, not in routes
3. **Testability** - Pure functions can be unit tested without mocking; DB functions can be tested with mocks
4. **Thin routes** - API routes handle: validation, call service, format response

### Service Boundaries

| Service | Responsibility | Pure Functions |
|---------|---------------|----------------|
| scoring | Score calculation | `calculateScore`, `getTrueTopN` |
| stats | Crowd statistics | `calculateCrowdStatsFromSubmissions` |
| puzzle | Puzzle access, transformation | `shuffleItems`, `toApiPuzzle`, `buildArchiveList` |
| submission | Submission CRUD | None (all DB access) |

### Trade-offs

- **Pro**: Testable without integration tests
- **Pro**: Single source of truth for all business logic
- **Pro**: Routes are easier to read and maintain
- **Con**: More files to navigate
- **Con**: Some indirection (routes call services)

### Consequences

- API routes reduced by ~40% in line count
- Duplicated `calculateCrowdStats` eliminated
- Ready for unit tests (Phase 3)

---

## ADR-008: Test Coverage Strategy

**Date:** 2026-03-17
**Status:** Accepted

### Context

Phase 3 requires >90% test coverage on services. Services contain both pure business logic and database-dependent functions.

### Decision

**Use a two-tier testing approach:**

1. **Unit tests** for pure functions (no mocking needed)
   - `calculateScore`, `getTrueTopN` (scoring.ts)
   - `calculateCrowdStatsFromSubmissions` (stats.ts)
   - `shuffleItems`, `toApiPuzzle`, `buildArchiveList` (puzzle.ts)
   - Date utilities in utils.ts

2. **Integration tests with mocked Supabase** for database functions
   - Mock `supabaseAdmin.from()` chain
   - Test all code paths: success, not found, error

### Implementation

```typescript
// Mock pattern for Supabase queries
vi.mock('$lib/supabaseClient', () => ({
  supabaseAdmin: { from: vi.fn() }
}));

// Create mock query chain
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error })
};
vi.mocked(supabaseAdmin.from).mockReturnValue(mockChain);
```

### Coverage Configuration

```typescript
// vite.config.ts
coverage: {
  provider: 'v8',
  include: ['src/lib/server/services/**/*.ts'],
  exclude: ['**/index.ts', '**/__tests__/**'],
  thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 }
}
```

### Results

- 156 total tests
- 100% statement/line/function coverage on services
- 98.5% branch coverage (one edge case in private function)

### Rationale

- Pure function tests run fast and are reliable
- Mocked Supabase tests verify query construction without real DB
- V8 coverage provider is fast and accurate
- High thresholds enforce discipline

---

## ADR-009: Zod for Input Validation

**Date:** 2026-03-17
**Status:** Accepted

### Context

Phase 4 requires replacing manual validation with a schema-based solution. The POC used inline validation with repetitive `if (!x || !isValidUUID(x))` patterns across all API routes.

### Decision

**Use Zod v4 for all API input validation.**

### Implementation

```
src/lib/server/validation/
├── index.ts        # Re-exports
├── schemas.ts      # All Zod schemas
└── errors.ts       # Error formatting utilities
```

Each API route uses a dedicated schema:
- `submitRequestSchema` - POST /api/submit body validation
- `puzzleQuerySchema` - GET /api/puzzle query params
- `resultsQuerySchema` - GET /api/results query params
- `archiveQuerySchema` - GET /api/puzzles/archive query params

### Key Features

1. **Type inference** - `z.infer<typeof schema>` generates TypeScript types
2. **Custom refinements** - e.g., captain must be in drafted_items
3. **Coercion** - `z.coerce.number()` handles query string parsing
4. **Structured errors** - Field-level errors with actionable messages

### Error Response Format

```typescript
{
  success: false,
  error: "Primary error message",
  field_errors: [
    { field: "user_id", message: "Invalid user_id format" },
    { field: "captain", message: "Your #1 guess must be one of your selected items" }
  ]
}
```

### Why Zod v4

- Native ESM support
- Smaller bundle size than v3
- `issues` property for error details (instead of `errors`)
- TypeScript-first design

### Trade-offs

- **Pro**: Removes ~50 lines of manual validation per route
- **Pro**: Type safety via inference
- **Pro**: Consistent error messages
- **Pro**: Self-documenting schemas
- **Con**: Additional dependency (13KB gzipped)
- **Con**: Zod v4 API slightly different from v3 (uses `issues` not `errors`)

### Results

- 46 new tests for validation schemas
- Total tests: 202
- All manual `isValidUUID` calls removed from routes
- Routes reduced by 15-35% in line count

---

## ADR-010: In-Memory Rate Limiting for Serverless Functions

**Date:** 2026-03-17
**Status:** Accepted

### Context

Phase 5 requires rate limiting on `/api/submit` to protect against API abuse. The project is deployed on Netlify using serverless functions.

### Research: Netlify Built-in Options

1. **Netlify Functions** - Netlify does not provide configurable per-IP rate limiting for serverless functions via `netlify.toml` or dashboard settings.

2. **Netlify Edge Functions** - Could intercept requests for rate limiting, but require external state (like Upstash Redis) to track request counts across invocations since they are stateless.

3. **Netlify Rate Limiting Add-on** - A paid Enterprise feature that only applies to static assets, not serverless functions.

**Conclusion:** Netlify does not provide built-in rate limiting suitable for this use case.

### Decision

**Implement lightweight in-memory rate limiting within the serverless function itself.**

### Implementation

```typescript
// src/lib/server/ratelimit/index.ts
const store = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, config = { maxRequests: 10, windowMs: 60000 }) {
  // Check/update in-memory store
  // Return { allowed, remaining, resetTime }
}
```

**Configuration:**
- 10 requests per minute per IP
- Uses `x-nf-client-connection-ip` header (Netlify-specific)
- Returns HTTP 429 with `Retry-After` header when rate limited

### Known Limitations

1. **Cold start resets** - Each new function instance starts with empty memory
2. **No shared state** - Multiple function instances don't share rate limit data
3. **Memory growth** - Store grows with unique IPs until function recycles

### Why These Limitations Are Acceptable

1. **Low abuse incentive** - Casual daily game with no prizes/leaderboards
2. **Database-level protection** - `hasSubmitted()` already prevents duplicate submissions per user per puzzle
3. **Defense-in-depth** - Rate limiter catches automated scripts hitting the endpoint rapidly
4. **Cost-free** - No external services required

### Alternative Considered: Upstash Redis

Upstash provides a Redis-compatible distributed store ideal for serverless rate limiting:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1m") });
```

**Why deferred:**
- Adds external dependency and operational complexity
- Requires Upstash account and environment variables
- Minimal additional protection for this use case
- Can add later if abuse becomes a problem

### Trade-offs

- **Pro**: Zero external dependencies
- **Pro**: No additional cost
- **Pro**: Simple implementation (< 100 lines)
- **Pro**: Sufficient for casual game with database-level protection
- **Con**: Not distributed (attackers could theoretically hit different instances)
- **Con**: Cold starts reset counters

### Results

- 17 new tests for rate limiting
- Total tests: 219
- `/api/submit` now rate limited at 10 requests/minute per IP
- Proper HTTP 429 response with `Retry-After` header

---

## ADR-011: Error Handling and Accessibility

**Date:** 2026-03-17
**Status:** Accepted

### Context

Phase 6 required adding production-level error handling and fixing pre-existing a11y warnings identified during builds.

### Decisions

**1. Error Boundary via +error.svelte**

Created `src/routes/+error.svelte` as SvelteKit's built-in error boundary mechanism. This handles:
- 404 errors (page not found)
- 500 errors (server errors)
- Other unexpected errors

The component provides user-friendly error messages and actionable buttons (Try Again, Go Home).

**2. A11y Fixes for Interactive Elements**

Fixed warnings for click handlers on non-interactive elements:

| Component | Issue | Solution |
|-----------|-------|----------|
| DraftInterface | `<div>` with click | Changed to `<div role="button" tabindex="0">` with `onkeydown` handler |
| HowToPlayModal | Dialog backdrop | Added `role="dialog" aria-modal="true" tabindex="-1"` |
| ShareModal | Dialog backdrop | Same as HowToPlayModal |

**3. Quoted Attribute Warnings**

Fixed Svelte 5 warnings about quoted attributes on components (e.g., `class="{theme.primary.text}"` to `class={theme.primary.text}`).

### Why These Approaches

- **Error boundary**: SvelteKit's +error.svelte is the idiomatic approach, works at route level
- **role="button" vs button element**: The item cards in DraftInterface contain nested buttons (star, remove). Using `<button>` as the outer element would create invalid HTML. `role="button"` with keyboard handlers provides same a11y while allowing nested interactive elements.
- **Dialog role for modals**: Standard WAI-ARIA pattern for modal dialogs. `tabindex="-1"` makes the dialog container focusable but not in tab order.

### Results

- Build completes with zero warnings
- Error states handled gracefully
- All interactive elements keyboard-accessible
