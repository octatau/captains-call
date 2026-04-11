---
description: Generate production-quality topick puzzles from topic ideas and insert them into Supabase
argument-hint: <topic1, topic2, ...> [--start-date YYYY-MM-DD]
allowed-tools: Agent, Bash, Read, Write, Glob
---

# Generate Puzzles

Generates production-quality topick puzzles from topic ideas, researches real-world ranked data from the web, builds SQL INSERT statements, presents them for human review, and inserts approved puzzles into Supabase.

## Usage
`/generate-puzzles tallest buildings, fastest animals, largest lakes`
`/generate-puzzles tallest buildings, fastest animals --start-date 2026-05-01`

$ARGUMENTS accepts a comma-separated list of topic ideas, with an optional `--start-date YYYY-MM-DD` flag to override the default consecutive date assignment.

## What happens

### Step 0: Parse arguments

Parse `$ARGUMENTS` to extract:
- **Topics:** Split on commas, trim whitespace. Remove the `--start-date` flag and its value from the topic list if present.
- **Start date override:** If `--start-date YYYY-MM-DD` is present, extract the date value. Otherwise, leave it unset (default behavior will be used later).

If no topics are provided, ask the user for topic ideas and wait.

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

### Step 9: Clean up

```bash
rm -rf /home/coder/project/topick/.claude/tmp/puzzles
```

## After completion

Report to the user:
- How many puzzles were successfully inserted
- The puzzle numbers and daily dates assigned
- Any topics that were skipped or failed
