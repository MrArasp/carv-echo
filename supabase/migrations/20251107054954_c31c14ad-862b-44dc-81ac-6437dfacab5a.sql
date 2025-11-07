-- Fix RLS policies to remove public access vulnerabilities

-- Drop existing insecure policies on predictions table
DROP POLICY IF EXISTS "Users can view their own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update their own predictions only" ON public.predictions;
DROP POLICY IF EXISTS "Users can only insert predictions for connected wallet" ON public.predictions;

-- Create secure policies that only allow service role access
-- All operations must go through edge functions

CREATE POLICY "Service role can manage all predictions"
ON public.predictions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can only view predictions through edge functions (no direct access)
CREATE POLICY "No direct user access to predictions"
ON public.predictions
FOR SELECT
TO authenticated, anon
USING (false);

-- Prevent direct inserts/updates from client
CREATE POLICY "No direct user inserts"
ON public.predictions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No direct user updates"
ON public.predictions
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);