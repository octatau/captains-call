-- topick Database Schema
-- Initial migration: puzzles and submissions tables with sources support
-- Schema: public (default Supabase schema)

-- Table: puzzles
-- Daily puzzle definitions with verifiable data sources
CREATE TABLE puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_number INTEGER UNIQUE NOT NULL,          -- e.g., 1, 2, 3
    daily_date DATE UNIQUE NOT NULL,                -- YYYY-MM-DD (puzzle available midnight local time)
    prompt TEXT NOT NULL,                           -- e.g., "Top 10 Tech Companies by Market Cap (Jan 2024)"
    items JSONB NOT NULL,                           -- Array of 10 items: ["Apple", "Microsoft", ...]
    true_rankings JSONB NOT NULL,                   -- {"Apple": 2, "Google": 1, ...}
    sources JSONB NOT NULL,                         -- Array of source citations: ["https://...", "Data as of..."]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_items CHECK (jsonb_array_length(items) = 10),
    CONSTRAINT valid_rankings CHECK (jsonb_typeof(true_rankings) = 'object'),
    CONSTRAINT valid_sources CHECK (jsonb_typeof(sources) = 'array')
);

CREATE INDEX idx_puzzles_daily_date ON puzzles(daily_date DESC);

-- Table: submissions
-- User draft submissions (one per user per puzzle)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                          -- Client-generated UUID from localStorage
    puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,

    -- Draft data
    drafted_items JSONB NOT NULL,                   -- Array of 5 items: ["Google", "Apple", ...]
    captain TEXT NOT NULL,                          -- Must be in drafted_items (validated in API)

    -- Calculated score (server-side only)
    base_score INTEGER NOT NULL CHECK (base_score >= 0 AND base_score <= 5),
    captain_bonus INTEGER NOT NULL CHECK (captain_bonus IN (0, 3)),
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 8),

    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_metadata JSONB,                          -- Optional: user agent, timezone, etc.

    CONSTRAINT unique_user_puzzle UNIQUE(user_id, puzzle_id),
    CONSTRAINT valid_drafted_items CHECK (jsonb_array_length(drafted_items) = 5)
);

CREATE INDEX idx_submissions_puzzle ON submissions(puzzle_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_created ON submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Puzzles: Read-only via service role in API routes
CREATE POLICY "Service role can read puzzles" ON puzzles
    FOR SELECT USING (true);

-- Submissions: Only insertable via API routes (using service role key)
CREATE POLICY "Service role can insert submissions" ON submissions
    FOR INSERT WITH CHECK (true);

-- Submissions: Read via service role (for results and crowd stats)
CREATE POLICY "Service role can read submissions" ON submissions
    FOR SELECT USING (true);
