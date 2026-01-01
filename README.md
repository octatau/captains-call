# Captain's Call

> Draft the best 5 out of 10 — choose a Captain — and see how everyone else picked.

A daily draft game where you pick 5 items from 10 based on verifiable data, choose a Captain, and compete for the perfect 8/8 score.

## Features

- **Daily Puzzles** with data-backed rankings and cited sources
- **Archive Mode** to play past puzzles you missed
- **3-Layer Results Reveal** with scoring, rankings, and crowd statistics
- **Dark Mode** with system preference detection
- **Mobile Responsive** design with Tailwind CSS
- **Secure Scoring** - all validation happens server-side

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5) + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + API)
- **Deployment**: Vercel/Netlify (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works great)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd captains-call
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to **SQL Editor**
3. Run the migration: `supabase/migrations/001_initial_schema.sql`
4. (Optional) Insert sample puzzles: `supabase/sample_puzzles.sql`

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from: **Supabase Dashboard → Project Settings → API**

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## How to Play

1. **Draft**: Click to select 5 items from 10
2. **Captain**: Click a drafted item again to make it your Captain ⭐
3. **Submit**: Get your score!
   - **Base Score**: +1 for each drafted item in true top 5 (max 5 points)
   - **Captain Bonus**: +3 if Captain is ranked #1 (else 0 points)
   - **Total**: 0-8 points (8/8 = perfect game)

## Creating Puzzles

Add new daily puzzles via Supabase SQL Editor:

```sql
INSERT INTO puzzles (puzzle_number, daily_date, prompt, items, true_rankings, sources, published_at)
VALUES (
    8,
    '2026-01-08',
    'Top 10 Programming Languages by GitHub Stars (2024)',
    '["JavaScript", "Python", "Java", ...]'::jsonb,
    '{"JavaScript": 1, "Python": 2, ...}'::jsonb,
    '["https://github.com/search", "Data as of Jan 2024"]'::jsonb,
    '2026-01-08 00:00:00+00'::timestamptz
);
```

**Requirements**:
- Exactly 10 items
- Rankings 1-10 (no duplicates)
- Specific, data-backed prompts (not opinion-based)
- Include source citations

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables (see `.env.example`)
4. Deploy!

### Deploy to Netlify

1. Push to GitHub
2. Import on [netlify.com](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add environment variables
5. Deploy!

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components
│   ├── types.ts         # TypeScript types
│   ├── utils.ts         # Helper functions
│   └── supabaseClient.ts # Database client
├── routes/
│   ├── api/             # API endpoints
│   │   ├── puzzle/      # GET daily/archive puzzle
│   │   ├── puzzles/archive/ # GET all puzzles
│   │   ├── submit/      # POST submission
│   │   └── results/     # GET results
│   ├── +layout.svelte   # Root layout (dark mode)
│   └── +page.svelte     # Main page (tabs)
└── app.css              # Tailwind styles

supabase/
├── migrations/          # Database schema
└── sample_puzzles.sql  # Test data
```

## License

MIT
