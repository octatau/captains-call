# Puzzle Quality Standards

Every puzzle goes directly into production. These standards are non-negotiable.

## Data Accuracy

1. **Rankings must come from real, verifiable data.** Never estimate, guess, or use general knowledge to order items.
2. **Cross-reference at least 2 independent sources** before finalizing a ranking. If sources disagree, use the most authoritative source and note the discrepancy.
3. **Sources must be real.** Every entry in the `sources` array must be a real URL to an authoritative site or a named publication with enough detail to verify. No fabricated URLs.
   - **Bare URLs only.** Do not annotate source entries with descriptions, labels, parenthetical notes, or verification commentary (no " - Description", no "(primary source)", no "confirms X of 10"). The sources array is user-visible data — extra commentary reads as AI-generated. Only exception: a single "Data as of Month Year" timestamp entry is allowed.
4. **Include the time period.** Rankings change over time. Always specify the year or date range the data is from, both in the prompt text and in the sources.

## Content Quality

5. **Exactly 10 items per puzzle.** No exceptions — the schema enforces this with a CHECK constraint.
6. **Rankings 1 through 10.** Each item maps to a unique rank. No ties, no gaps.
7. **Item names must be unambiguous.** Use full official names. "United States" not "USA". "PlayStation 2" not "PS2". Exception: universally recognized abbreviations (e.g., "TSMC" is acceptable).
8. **Prompt text must be polished:**
   - Title Case capitalization
   - Include year or time period in parentheses
   - Concise — aim for under 60 characters
   - Consistent style with existing puzzles
9. **No offensive, controversial, or politically sensitive topics.** Rankings should be factual and non-divisive.
10. **Topics should be interesting and accessible** to a general audience. Avoid overly niche subjects.

## Technical Correctness

11. **SQL must be valid.** Single quotes in values escaped as `''`. All JSONB values properly cast.
12. **Dates must be explicit** (`'2024-01-15'::date`), never relative (`CURRENT_DATE`).
13. **puzzle_number must be sequential** with no gaps from the existing max.
14. **daily_date must be sequential** — one puzzle per day, no gaps, no weekends skipped.
15. **Items in the `items` array should be shuffled** — not in ranked order, since that would give away the answer.

## Common Pitfalls

- Don't use Wikipedia "List of..." articles as the sole source — they can be incomplete or outdated
- Don't confuse "most popular" with "highest revenue" or "most users" — be precise about what's being ranked
- Don't include items that are too similar (e.g., "Alphabet" and "Google" in the same list)
- Don't use data that changes so frequently it'll be wrong within days (e.g., "most followed on Twitter right now")
- Escape single quotes: `'McDonald''s'` not `'McDonald's'`
