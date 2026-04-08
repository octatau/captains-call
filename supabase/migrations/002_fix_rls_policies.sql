-- Fix RLS policies: restrict access to service_role only
-- Previously all policies used USING (true) which allowed the anon key
-- to read all data including puzzle answers and all user submissions

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can read puzzles" ON puzzles;
DROP POLICY IF EXISTS "Service role can insert submissions" ON submissions;
DROP POLICY IF EXISTS "Service role can read submissions" ON submissions;

-- Recreate with service_role restriction
CREATE POLICY "Service role can read puzzles" ON puzzles
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert submissions" ON submissions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read submissions" ON submissions
    FOR SELECT USING (auth.role() = 'service_role');
