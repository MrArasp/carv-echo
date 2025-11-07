-- CRITICAL FIX: Remove public access to full wallet addresses in leaderboard

-- Drop the insecure public read policy
DROP POLICY IF EXISTS "Users can view leaderboard anonymously" ON public.leaderboard;

-- Service role has full access (for edge functions)
CREATE POLICY "Service role full access to leaderboard"
ON public.leaderboard
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Block all direct public access to prevent wallet address exposure
CREATE POLICY "No direct public access to leaderboard"
ON public.leaderboard
FOR SELECT
TO authenticated, anon
USING (false);