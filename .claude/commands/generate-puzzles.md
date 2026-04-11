---
description: Generate production-quality topick puzzles from topic ideas and insert them into Supabase
argument-hint: [<topic1, topic2, ...>] [--start-date YYYY-MM-DD]
allowed-tools: Agent, Bash, Read, Write, Edit, Glob
---

# Generate Puzzles

Generates production-quality topick puzzles from topic ideas, researches real-world ranked data from the web, builds SQL INSERT statements, presents them for human review, and inserts approved puzzles into Supabase.

## Usage
`/generate-puzzles tallest buildings, fastest animals, largest lakes`
`/generate-puzzles tallest buildings, fastest animals --start-date 2026-05-01`
`/generate-puzzles` — interactive mode (see Step 0)

$ARGUMENTS accepts an optional comma-separated list of topic ideas and an optional `--start-date YYYY-MM-DD` flag. When no topics are given, the command enters interactive mode.

## What happens

### Step 0: Parse arguments / interactive intake

Parse `$ARGUMENTS` to extract:
- **Topics:** Split on commas, trim whitespace. Remove the `--start-date` flag and its value from the topic list if present.
- **Start date override:** If `--start-date YYYY-MM-DD` is present, extract the date value. Otherwise, leave it unset.

**If topics were provided**, continue to Step 1 with those topics and the parsed `--start-date` (if any).

**If no topics were provided**, enter interactive mode:

1. Check whether `puzzle-ideas.md` exists at the project root (`/home/coder/project/topick/puzzle-ideas.md`).

2. **If `puzzle-ideas.md` exists** (ideas-file mode):
   - Ask the user: "How many puzzles should I generate from `puzzle-ideas.md`?"
   - Ask the user: "Start date — use `max_daily_date + 1` (default), or a specific date (YYYY-MM-DD)?"
   - Read `puzzle-ideas.md` and parse topic titles from lines matching the regex `^\d+\.\s+\*\*(.+?)\*\*` — capture group 1 is the topic title. Preserve file order.
   - Take the first **N** parsed titles (where N is the user-supplied count) as the topic list. If there are fewer than N ideas in the file, report the shortfall and ask whether to proceed with the available count or abort.
   - Remember these selected titles verbatim — they will be used in Step 8.5 to prune the file after successful insertion.
   - If the user chose a specific start date, set `start_date_override` to that value. Otherwise leave it unset.

3. **If `puzzle-ideas.md` does not exist** (prompt mode):
   - Ask the user: "What topic(s) should I generate puzzles for? (comma-separated)"
   - Ask the user: "Start date — use `max_daily_date + 1` (default), or a specific date (YYYY-MM-DD)?"
   - Parse topics and optional start date from the responses.

Wait for the user's answers before proceeding.

### Step 1: Check Supabase CLI

This project uses Supabase CLI as an npm devDependency — invoke it via `npx supabase`, not a global binary.

Run `npx supabase --version` to verify it is installed. If it fails, stop and tell the user:
> Supabase CLI not available. Run `! npm install` (or `pnpm install`) to install project dependencies, then try again.

Run `npx supabase projects list` to check authentication. If it fails with an auth error, stop and tell the user:
> Supabase CLI is not authenticated. Run `! npx supabase login` in the prompt to authenticate, then try again.

Check whether the project is linked by verifying `supabase/.temp/project-ref` exists. If it does not, stop and tell the user:
> No Supabase project linked. Run `! npx supabase link --project-ref <your-project-ref>` in the prompt, then try again.

### Step 2: Prepare working directory

```bash
rm -rf /home/coder/project/topick/.claude/tmp/puzzles
mkdir -p /home/coder/project/topick/.claude/tmp/puzzles
```

### Step 3: Query current database state

Write a query file to `/home/coder/project/topick/.claude/tmp/puzzles/_query.sql`:
```sql
SELECT COALESCE(MAX(puzzle_number), 0) as max_num, COALESCE(MAX(daily_date)::text, '1970-01-01') as max_date FROM puzzles;
```

Run via Bash (uses the currently linked project — no --project-ref needed):
```bash
npx supabase db execute --file /home/coder/project/topick/.claude/tmp/puzzles/_query.sql
```

Parse the tabular output for `max_num` and `max_date`. If the CLI version on this system rejects `--file` for `db execute`, fall back to:
```bash
npx supabase db execute --sql "SELECT COALESCE(MAX(puzzle_number), 0) as max_num, COALESCE(MAX(daily_date)::text, '1970-01-01') as max_date FROM puzzles"
```

Delete `_query.sql` after use. Write the parsed result to `/home/coder/project/topick/.claude/tmp/puzzles/db-state.json`:
```json
{
  "max_puzzle_number": <number>,
  "max_daily_date": "<YYYY-MM-DD>",
  "start_date_override": "<YYYY-MM-DD or null>"
}
```

If a `--start-date` override was parsed in Step 0, include it in `start_date_override`. Otherwise set it to `null`. The puzzle-builder agent will use `start_date_override` if present, otherwise it will use `max_daily_date + 1`.

### Step 4: Research topics in parallel

For each topic, spawn an **Agent** tool invocation with the researcher agent:

```
Use the researcher agent to research the following topic for a topick puzzle: "<topic>"

Write your output to /home/coder/project/topick/.claude/tmp/puzzles/research-<topic-slug>.json

Read the puzzle-schema skill first at /home/coder/project/topick/.claude/skills/puzzle-schema/puzzle-schema.md for quality standards.
```

Spawn ALL researcher agents in parallel (one Agent tool call per topic, all in the same response).

**Retry cap:** If a researcher agent fails or reports the topic as unresearchable, re-spawn it **once** with a more specific prompt. If still failing, **stop** for that topic -- mark it as failed and continue with remaining topics.

### Step 5: Check research results

After all researcher agents complete, use Glob to find all `research-*.json` files in `/home/coder/project/topick/.claude/tmp/puzzles/`.

Read each research file. Report to the user:
- Which topics succeeded (with confidence level)
- Which topics failed or were marked unresearchable

If any topics failed, ask the user: "Some topics could not be researched. Continue with the N successful topics?"

If the user says no, stop and clean up.

### Step 6: Build SQL

Spawn an **Agent** tool invocation with the puzzle-builder agent:

```
Use the puzzle-builder agent to generate SQL INSERT statements from the research files.

Read db-state from /home/coder/project/topick/.claude/tmp/puzzles/db-state.json
Read research files from /home/coder/project/topick/.claude/tmp/puzzles/research-*.json
Read the puzzle-schema skill at /home/coder/project/topick/.claude/skills/puzzle-schema/puzzle-schema.md for format reference.

Write the final SQL to /home/coder/project/topick/.claude/tmp/puzzles/insert-puzzles.sql
```

If the puzzle-builder fails, re-spawn it **once** with the error details. If still failing, **stop** -- report to the user and wait for direction.

### Step 7: Human review gate

Read `/home/coder/project/topick/.claude/tmp/puzzles/insert-puzzles.sql` and display the full contents to the user.

Ask: "Review the SQL above. For each puzzle you can: **approve**, **reject**, or **request changes**. What would you like to do?"

- If the user approves all: proceed to Step 8.
- If the user rejects some: remove those INSERT statements from the file.
- If the user requests changes: re-spawn the puzzle-builder agent with the user's feedback. Then re-display and re-ask. Re-run **once**. If still failing, **stop** and report to the user.

### Step 8: Execute SQL

Run via Bash (uses the currently linked project):
```bash
npx supabase db execute --file /home/coder/project/topick/.claude/tmp/puzzles/insert-puzzles.sql
```

Report the result to the user -- success or failure with error details.

### Step 8.5: Prune used ideas from puzzle-ideas.md

Only run this step if ideas-file mode was used in Step 0 **and** the SQL execution in Step 8 succeeded.

For each topic title that was successfully inserted (match the titles remembered from Step 0 against the puzzles actually committed in Step 7 — skip any that were rejected during the review gate), remove its entire line from `/home/coder/project/topick/puzzle-ideas.md`.

Use the Edit tool to delete the matching lines. Match lines by the exact bold title captured in Step 0 (e.g. `**Longest Rivers**`) so numbering or category labels don't cause mismatches. Do **not** renumber the remaining entries — leave the numeric prefixes as-is; they are stable identifiers, not sequential indices.

Report to the user how many entries were removed from `puzzle-ideas.md`.

### Step 9: Clean up

```bash
rm -rf /home/coder/project/topick/.claude/tmp/puzzles
```

## After completion

Report to the user:
- How many puzzles were successfully inserted
- The puzzle numbers and daily dates assigned
- Any topics that were skipped or failed
