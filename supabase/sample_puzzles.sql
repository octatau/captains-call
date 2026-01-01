-- Sample puzzles for Captain's Call
-- Based on verifiable data with sources
-- Run these in the Supabase SQL Editor to add test puzzles
-- Distribution: 4 past, 1 today, 2 future

-- Puzzle 1: Top 10 Tech Companies by Market Cap (Jan 2024) [PAST]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    1,
    CURRENT_DATE - INTERVAL '4 days',
    'Top 10 Tech Companies by Market Cap (Jan 2024)',
    '["Apple", "Microsoft", "Alphabet", "Amazon", "Nvidia", "Meta", "Tesla", "TSMC", "Samsung", "Oracle"]'::jsonb,
    '{"Apple": 1, "Microsoft": 2, "Alphabet": 3, "Amazon": 4, "Nvidia": 5, "Meta": 6, "Tesla": 7, "TSMC": 8, "Samsung": 9, "Oracle": 10}'::jsonb,
    '["https://companiesmarketcap.com", "Data as of January 2024"]'::jsonb
);

-- Puzzle 2: Most Popular Programming Languages (GitHub Stars 2024) [PAST]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    2,
    CURRENT_DATE - INTERVAL '3 days',
    'Most Popular Programming Languages by GitHub Stars (2024)',
    '["JavaScript", "Python", "Java", "TypeScript", "C++", "Go", "Rust", "Ruby", "PHP", "Swift"]'::jsonb,
    '{"JavaScript": 1, "Python": 2, "TypeScript": 3, "Java": 4, "Go": 5, "Rust": 6, "C++": 7, "Swift": 8, "Ruby": 9, "PHP": 10}'::jsonb,
    '["GitHub search data", "Based on repository stars as of Jan 2024"]'::jsonb
);

-- Puzzle 3: Highest Grossing Movies of All Time (Worldwide Box Office) [PAST]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    3,
    CURRENT_DATE - INTERVAL '2 days',
    'Highest Grossing Movies of All Time (Worldwide Box Office)',
    '["Avatar", "Avengers: Endgame", "Avatar: The Way of Water", "Titanic", "Star Wars: The Force Awakens", "Avengers: Infinity War", "Spider-Man: No Way Home", "Jurassic World", "The Lion King", "The Avengers"]'::jsonb,
    '{"Avatar": 1, "Avengers: Endgame": 2, "Avatar: The Way of Water": 3, "Titanic": 4, "Star Wars: The Force Awakens": 5, "Avengers: Infinity War": 6, "Spider-Man: No Way Home": 7, "Jurassic World": 8, "The Lion King": 9, "The Avengers": 10}'::jsonb,
    '["https://www.boxofficemojo.com", "Data as of December 2023"]'::jsonb
);

-- Puzzle 4: Most Populated Countries (2024) [PAST]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    4,
    CURRENT_DATE - INTERVAL '1 day',
    'Most Populated Countries (2024)',
    '["India", "China", "United States", "Indonesia", "Pakistan", "Nigeria", "Brazil", "Bangladesh", "Russia", "Mexico"]'::jsonb,
    '{"India": 1, "China": 2, "United States": 3, "Indonesia": 4, "Pakistan": 5, "Nigeria": 6, "Brazil": 7, "Bangladesh": 8, "Russia": 9, "Mexico": 10}'::jsonb,
    '["UN World Population Prospects 2024", "https://www.un.org/development/desa/pd/"]'::jsonb
);

-- Puzzle 5: Best-Selling Video Game Consoles of All Time [TODAY]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    5,
    CURRENT_DATE,
    'Best-Selling Video Game Consoles of All Time',
    '["PlayStation 2", "Nintendo DS", "Game Boy", "PlayStation 4", "PlayStation", "Nintendo Switch", "Wii", "PlayStation 3", "Xbox 360", "Game Boy Advance"]'::jsonb,
    '{"PlayStation 2": 1, "Nintendo DS": 2, "Game Boy": 3, "PlayStation 4": 4, "PlayStation": 5, "Nintendo Switch": 6, "Wii": 7, "PlayStation 3": 8, "Xbox 360": 9, "Game Boy Advance": 10}'::jsonb,
    '["VGChartz", "Sales data as of Q4 2023"]'::jsonb
);

-- Puzzle 6: Most Visited Countries by International Tourists (2023) [FUTURE]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    6,
    CURRENT_DATE + INTERVAL '1 day',
    'Most Visited Countries by International Tourists (2023)',
    '["France", "Spain", "United States", "China", "Italy", "Turkey", "Mexico", "Thailand", "Germany", "United Kingdom"]'::jsonb,
    '{"France": 1, "Spain": 2, "United States": 3, "China": 4, "Italy": 5, "Turkey": 6, "Mexico": 7, "Thailand": 8, "Germany": 9, "United Kingdom": 10}'::jsonb,
    '["UN World Tourism Organization", "2023 international arrivals data"]'::jsonb
);

-- Puzzle 7: Largest Companies by Revenue (Fortune Global 500, 2023) [FUTURE]
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources)
VALUES (
    7,
    CURRENT_DATE + INTERVAL '2 days',
    'Largest Companies by Revenue (Fortune Global 500, 2023)',
    '["Walmart", "Amazon", "State Grid", "Saudi Aramco", "Sinopec", "China National Petroleum", "Apple", "Volkswagen", "UnitedHealth Group", "CVS Health"]'::jsonb,
    '{"Walmart": 1, "Amazon": 2, "State Grid": 3, "Saudi Aramco": 4, "Sinopec": 5, "China National Petroleum": 6, "Apple": 7, "Volkswagen": 8, "UnitedHealth Group": 9, "CVS Health": 10}'::jsonb,
    '["Fortune Global 500 2023", "https://fortune.com/ranking/global500/"]'::jsonb
);
