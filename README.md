# Topick

A daily puzzle game where you guess which 5 items are in the top 5 of a ranked list.

## What it does

Topick presents you with 10 items from a data-backed ranking (e.g., "Top 10 Programming Languages by GitHub Stars"). Your goal is to identify which 5 are actually in the top 5, then guess which one is ranked #1. Scoring is simple: 1 point per correct top-5 pick, plus a 3-point bonus for correctly guessing #1. A perfect game is 8/8.

New puzzles are released daily. Missed one? Play past puzzles in the archive.

## Requirements

- Node.js 18+
- pnpm (or npm/yarn)
- A Supabase project (free tier works)

## Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd topick

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

Edit `.env` with your Supabase credentials (from Supabase Dashboard > Project Settings > API):

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Set up the database:
1. Go to your Supabase SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. (Optional) Add sample puzzles: `supabase/sample_puzzles.sql`

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## Usage

**Playing the daily puzzle:**
1. Select 5 items you think are in the actual top 5
2. Click one of your selections to mark it as your #1 guess (the captain)
3. Submit and see your score

**Scoring:**
- +1 point for each correct top-5 pick (max 5)
- +3 bonus points if your captain is actually #1
- Perfect score: 8/8

**Sharing results:**
After submitting, share your score as an image or copy the text to clipboard. Results are spoiler-free.

**Archive:**
Access past puzzles from the Archive tab.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |

## Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm check

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment (Netlify)

1. Push your repository to GitHub
2. Import the project on [netlify.com](https://netlify.com)
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `pnpm run build`
   - Publish directory: `build`
4. Add environment variables in Netlify dashboard
5. Deploy

The project includes in-memory rate limiting (10 requests/minute per IP) on the submission endpoint.
