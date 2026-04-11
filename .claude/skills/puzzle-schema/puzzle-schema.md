---
name: puzzle-schema
description: Schema reference, sample INSERT format, and quality standards for topick puzzles. Used by researcher and puzzle-builder agents.
---

# Puzzle Schema Reference

This skill provides the complete schema context for generating topick puzzles.

## Quick Reference

- **Table**: `puzzles` in the public schema
- **10 items per puzzle**, ranked 1-10
- **Sources required**: real, verifiable URLs or named publications
- **Dates must be unique**: one puzzle per day

## Files

- `references/schema.sql` — Full DDL for the puzzles table
- `references/sample-insert.sql` — Annotated example INSERT showing exact format
- `references/quality-standards.md` — Enumerated quality rules for production puzzles

Read these files before generating any puzzle data.
