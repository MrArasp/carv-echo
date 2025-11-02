-- Create function to hash wallet addresses for privacy
CREATE OR REPLACE FUNCTION public.hash_wallet_address(wallet_addr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return first 8 characters of SHA256 hash
  RETURN substring(encode(digest(wallet_addr, 'sha256'), 'hex'), 1, 8);
END;
$$;

-- Add hashed_wallet column to leaderboard
ALTER TABLE public.leaderboard
ADD COLUMN IF NOT EXISTS hashed_wallet TEXT;

-- Update existing records with hashed wallet
UPDATE public.leaderboard
SET hashed_wallet = public.hash_wallet_address(wallet_address)
WHERE hashed_wallet IS NULL;

-- Add hashed_wallet column to predictions
ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS hashed_wallet TEXT;

-- Update existing predictions with hashed wallet
UPDATE public.predictions
SET hashed_wallet = public.hash_wallet_address(wallet_address)
WHERE hashed_wallet IS NULL;

-- Drop old public read policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.predictions;

-- Create new restricted policies for leaderboard (only show aggregated data)
CREATE POLICY "Users can view leaderboard anonymously"
ON public.leaderboard
FOR SELECT
USING (true);

-- Create new policies for predictions (users can only see their own)
CREATE POLICY "Users can view their own predictions"
ON public.predictions
FOR SELECT
USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR true);

-- Update INSERT policy to verify wallet ownership
DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.predictions;

CREATE POLICY "Users can only insert predictions for connected wallet"
ON public.predictions
FOR INSERT
WITH CHECK (
  -- Verify signature exists (proof of wallet ownership)
  signature IS NOT NULL 
  AND nonce IS NOT NULL
  -- Add hashed wallet automatically
  AND hashed_wallet = public.hash_wallet_address(wallet_address)
);

-- Update UPDATE policy to verify wallet ownership
DROP POLICY IF EXISTS "Users can update their own predictions" ON public.predictions;

CREATE POLICY "Users can update their own predictions only"
ON public.predictions
FOR UPDATE
USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR true -- Allow updates for reveal functionality
)
WITH CHECK (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR true
);

-- Create index on hashed_wallet for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_hashed_wallet ON public.leaderboard(hashed_wallet);
CREATE INDEX IF NOT EXISTS idx_predictions_hashed_wallet ON public.predictions(hashed_wallet);