-- Example INSERT for the puzzles table
-- This is the exact format that puzzle-builder must produce

-- Puzzle 5: Best-Selling Video Game Consoles of All Time
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    5,                                              -- puzzle_number: sequential integer
    '2024-01-15'::date,                             -- daily_date: explicit date, not CURRENT_DATE
    'Best-Selling Video Game Consoles of All Time', -- prompt: Title Case, includes time period if relevant
    '["PlayStation 2", "Nintendo DS", "Game Boy", "PlayStation 4", "PlayStation", "Nintendo Switch", "Wii", "PlayStation 3", "Xbox 360", "Game Boy Advance"]'::jsonb,
                                                    -- items: JSON array of exactly 10 strings
    '{"PlayStation 2": 1, "Nintendo DS": 2, "Game Boy": 3, "PlayStation 4": 4, "PlayStation": 5, "Nintendo Switch": 6, "Wii": 7, "PlayStation 3": 8, "Xbox 360": 9, "Game Boy Advance": 10}'::jsonb,
                                                    -- true_rankings: JSON object, every item mapped to rank 1-10
    '["VGChartz", "Sales data as of Q4 2023"]'::jsonb
                                                    -- sources: JSON array of citation strings
);

-- NOTES:
-- - Items in the array do NOT need to be in ranked order (they're shuffled for the player)
-- - The true_rankings object is the answer key
-- - Every item in `items` must appear in `true_rankings` and vice versa
-- - Single quotes in item names must be escaped as '' in SQL
-- - Use explicit dates ('2024-01-15'::date), never CURRENT_DATE or relative dates
