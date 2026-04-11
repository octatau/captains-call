-- topick puzzles table schema
-- Source: supabase/migrations/001_initial_schema.sql

CREATE TABLE puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_number INTEGER UNIQUE NOT NULL,          -- Sequential: 1, 2, 3, ...
    daily_date DATE UNIQUE NOT NULL,                -- YYYY-MM-DD, one puzzle per day
    prompt TEXT NOT NULL,                           -- Display text, e.g., "Top 10 Tech Companies by Market Cap (Jan 2024)"
    items JSONB NOT NULL,                           -- Array of exactly 10 items: ["Apple", "Microsoft", ...]
    true_rankings JSONB NOT NULL,                   -- Object mapping items to ranks: {"Apple": 1, "Microsoft": 2, ...}
    sources JSONB NOT NULL,                         -- Array of source citations: ["https://...", "Data as of..."]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_items CHECK (jsonb_array_length(items) = 10),
    CONSTRAINT valid_rankings CHECK (jsonb_typeof(true_rankings) = 'object'),
    CONSTRAINT valid_sources CHECK (jsonb_typeof(sources) = 'array')
);
