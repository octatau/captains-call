# Changelog

## [2026-03-17] - Initial Release

### Added
- Daily puzzle game with 10 items, guess which 5 are in the top 5
- Captain selection (guess the #1 item) for bonus points
- Server-side scoring with 8-point maximum (5 for top 5 + 3 for #1 bonus)
- Crowd statistics showing what percentage of players selected each item
- Archive mode to play past puzzles
- Share results as image or text with spoiler-free formatting
- Dark mode with system preference detection
- Mobile-responsive design
- Error boundary for graceful error handling

### Technical
- SvelteKit 2 with Svelte 5 (runes) for reactive UI
- Supabase (PostgreSQL) for database with Row Level Security
- Zod validation on all API endpoints
- In-memory rate limiting (10 requests/minute per IP) on submission endpoint
- 219 unit and integration tests with >90% coverage on services
- Centralized configuration in constants.ts
- Service layer architecture for testable business logic
- Accessibility improvements: keyboard navigation, ARIA attributes, screen reader support
