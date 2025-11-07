-- Fix prediction_nonces table to prevent wallet address exposure

-- Drop the insecure public read policy
DROP POLICY IF EXISTS "Anyone can view nonces" ON public.prediction_nonces;

-- Drop the service role insert policy (will recreate with better permissions)
DROP POLICY IF EXISTS "Service role can insert nonces" ON public.prediction_nonces;

-- Only service role can access nonces (used by edge functions for replay attack prevention)
CREATE POLICY "Service role full access to nonces"
ON public.prediction_nonces
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Prevent any direct user access
CREATE POLICY "No public access to nonces"
ON public.prediction_nonces
FOR SELECT
TO authenticated, anon
USING (false);